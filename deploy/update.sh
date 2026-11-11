#!/usr/bin/env bash
# ============================================================
# 更新已经部署好的站点（不重装、不动数据库）
#
#   cd beijing-wuzi-campus-guide/deploy
#   sudo ./update.sh
#
# 使用场景：你在本机改好了前端 / 后端代码，把新的 beijing-wuzi-campus-guide
# 整个传上来（覆盖旧的），然后在 deploy 目录跑这个脚本。
#
# 做的事情：
#   1. 备份当前 dist / server 到 ./backup_时间戳/
#   2. 覆盖 dist（前端构建产物），只清理 7 天前的旧 hash 产物
#   3. 如果 .env 里 DB_* 变了，只同步数据库账号
#   4. 同步内容数据：表结构迁移（v17/v18/v19）+ database/content.json
#   5. 重启服务 + 健康检查
#
# 注意：不会覆盖 app/public/uploads（用户上传的照片），
#       也不会覆盖相册 / 投稿 / 操作日志 / 后台账号这几张表。
# ============================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${HERE}/../app" && pwd)"
SERVICE_NAME="bwz-campus"
STAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_DIR="${HERE}/backup_${STAMP}"

log()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[1;33m[!] %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m[x] %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "请用 root 执行：sudo ./update.sh"
[[ -f "${APP_DIR}/dist/index.html" ]] || die "app/dist 缺失，这不像是一个完整的更新包"
systemctl list-unit-files | grep -q "^${SERVICE_NAME}.service" || die "服务 ${SERVICE_NAME} 还没装过，请先跑 deploy.sh"

env_get() {
  grep -E "^[[:space:]]*$1[[:space:]]*=" "${APP_DIR}/.env" \
    | tail -n1 | cut -d= -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'\'']//' -e 's/["'\'']$//'
}
PORT="$(env_get SERVE_PORT)"; PORT="${PORT:-55}"

log "1/5 备份当前版本"
mkdir -p "$BACKUP_DIR"
cp -a "${APP_DIR}/dist"   "${BACKUP_DIR}/dist"   2>/dev/null || true
cp -a "${APP_DIR}/server" "${BACKUP_DIR}/server" 2>/dev/null || true
cp -a "${APP_DIR}/.env"   "${BACKUP_DIR}/.env"   2>/dev/null || true
ok "已备份到 ${BACKUP_DIR}"

log "2/5 更新前端产物"
# 整包覆盖上传后，dist 已经是新版本，这里无需再复制。
# 旧 hash 产物只清理「7 天前」的，避免误删刚上传的新文件
# （原来的 -mmin +1 会把上传超过一分钟的全部 js/css 删掉，导致白屏）。
if [[ -d "${APP_DIR}/dist/assets" ]]; then
  OLD_CNT="$(find "${APP_DIR}/dist/assets" -type f \( -name '*.js' -o -name '*.css' \) -mmin +10080 2>/dev/null | wc -l || echo 0)"
  if [[ "${OLD_CNT:-0}" -gt 0 ]]; then
    find "${APP_DIR}/dist/assets" -type f \( -name '*.js' -o -name '*.css' \) -mmin +10080 -delete 2>/dev/null || true
    ok "清理 7 天前的旧产物 ${OLD_CNT} 个"
  fi
fi
ok "dist 已就绪（$(ls "${APP_DIR}/dist/assets" | wc -l) 个文件）"

log "3/5 同步数据库账号配置"
DB_NAME="$(env_get DB_NAME)"; DB_NAME="${DB_NAME:-bwz_campus_guide}"
DB_USER="$(env_get DB_USER)"; DB_USER="${DB_USER:-bwz_app}"
DB_PASS="$(env_get DB_PASSWORD)"
if [[ -n "$DB_PASS" ]]; then
  INIT_SQL="$(mktemp /tmp/bwz-init-XXXXXX.sql)"
  sed -e "s/__DB_NAME__/${DB_NAME}/g" -e "s/__DB_USER__/${DB_USER}/g" -e "s/__DB_PASS__/${DB_PASS}/g" \
    "${HERE}/../database/01-init.sql" > "$INIT_SQL"
  mysql < "$INIT_SQL" && ok "账号 ${DB_USER} 密码已同步（数据未动）"
  rm -f "$INIT_SQL"
else
  warn ".env 里 DB_PASSWORD 为空，跳过"
fi

log "4/5 同步内容数据（建筑信息 / 周边设施 / 分类…）"
# 先补结构（v17/v18/v19 的字段，幂等），再覆盖 7 张内容表。
# 这是「本机改好的信息传上来却看不到」的根因修复：update.sh 以前完全不碰数据。
if ( cd "$APP_DIR" && node server/scripts/migrate-all.mjs >/dev/null 2>&1 ); then
  ok "表结构已对齐（v17/v18/v19）"
else
  warn "表结构迁移失败，继续尝试同步内容"
fi
CONTENT_JSON="${HERE}/../database/content.json"
if [[ -f "$CONTENT_JSON" ]]; then
  if ( cd "$APP_DIR" && node server/scripts/sync-content.mjs ); then
    ok "内容数据已同步（$(du -h "$CONTENT_JSON" | cut -f1)）"
  else
    warn "内容数据同步失败（站点仍是旧数据，但不影响启动）"
    warn "  可手动重跑：cd ${APP_DIR} && node server/scripts/sync-content.mjs"
  fi
else
  warn "包里没有 database/content.json，跳过内容同步（旧包）"
fi

log "5/5 重启并检查"
systemctl restart "$SERVICE_NAME"
READY=0
for i in $(seq 1 25); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/api/health" 2>/dev/null; then READY=1; break; fi
  sleep 1
done
if [[ $READY -eq 1 ]]; then
  ok "健康检查通过 http://127.0.0.1:${PORT}/api/health"
else
  warn "健康检查失败。回滚办法："
  warn "  systemctl stop ${SERVICE_NAME}"
  warn "  rm -rf ${APP_DIR}/dist && cp -a ${BACKUP_DIR}/dist ${APP_DIR}/dist"
  warn "  systemctl start ${SERVICE_NAME}"
  warn "看日志：journalctl -u ${SERVICE_NAME} -n 60 --no-pager"
fi

printf '\n  更新完成。浏览器强制刷新（Ctrl+F5）看效果。\n\n'
