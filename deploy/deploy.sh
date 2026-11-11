#!/usr/bin/env bash
# ============================================================
# 北京物资学院 · 校园指南 v1.5  —— Linux 一键部署
#
#   cd beijing-wuzi-campus-guide/deploy
#   chmod +x deploy.sh
#   sudo ./deploy.sh
#
# 依次完成：检查环境 → 装依赖 → 建库导数据 → 注册 systemd → 启动 → 自检
# 可重复执行；已完成的步骤会自动跳过，不会覆盖你已有的数据。
# ============================================================
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${HERE}/../app" && pwd)"
DB_DIR="$(cd "${HERE}/../database" && pwd)"
SERVICE_NAME="bwz-campus"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

log()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
ok()   { printf '    \033[32m✓\033[0m %s\n' "$*"; }
warn() { printf '    \033[1;33m[!] %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m[x] %s\033[0m\n' "$*" >&2; exit 1; }

[[ $EUID -eq 0 ]] || die "请用 root 执行：sudo ./deploy.sh"
[[ -f "${APP_DIR}/.env" ]] || die "找不到 ${APP_DIR}/.env"

# 从 .env 读一个键（去掉首尾空白和引号）
env_get() {
  grep -E "^[[:space:]]*$1[[:space:]]*=" "${APP_DIR}/.env" \
    | tail -n1 | cut -d= -f2- | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//' -e 's/^["'\'']//' -e 's/["'\'']$//'
}

PORT="$(env_get SERVE_PORT)"; PORT="${PORT:-55}"
DB_NAME="$(env_get DB_NAME)";  DB_NAME="${DB_NAME:-bwz_campus_guide}"
DB_USER="$(env_get DB_USER)";  DB_USER="${DB_USER:-bwz_app}"
DB_PASS="$(env_get DB_PASSWORD)"
[[ -n "$DB_PASS" ]] || die ".env 里 DB_PASSWORD 是空的"

log "1/6 检查运行环境"
command -v node  >/dev/null || die "没有 node。见 docs/部署说明.md 第 1 步"
command -v npm   >/dev/null || die "没有 npm"
command -v mysql >/dev/null || die "没有 mysql 客户端。见 docs/部署说明.md 第 2 步"

NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
[[ "$NODE_MAJOR" -ge 18 ]] || die "Node 版本过低（$(node -v)），至少 18"
ok "node $(node -v) / npm $(npm -v)"
ok "应用目录 ${APP_DIR}"
ok "端口 ${PORT}，数据库 ${DB_NAME}"

log "2/6 安装依赖"
cd "$APP_DIR"
if [[ -d node_modules && -f node_modules/express/package.json ]]; then
  ok "node_modules 已就位（安装包自带），跳过"
else
  if [[ -f package-lock.json ]]; then npm ci --omit=dev; else npm install --omit=dev; fi
  ok "依赖安装完成"
fi

log "3/6 初始化数据库"
INIT_SQL="$(mktemp /tmp/bwz-init-XXXXXX.sql)"
sed -e "s/__DB_NAME__/${DB_NAME}/g" -e "s/__DB_USER__/${DB_USER}/g" -e "s/__DB_PASS__/${DB_PASS}/g" \
  "${DB_DIR}/01-init.sql" > "$INIT_SQL"
mysql < "$INIT_SQL"
rm -f "$INIT_SQL"
ok "数据库与账号就绪（${DB_USER}@localhost）"

TABLE_COUNT="$(mysql -N -B -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${DB_NAME}';")"
if [[ "$TABLE_COUNT" -eq 0 ]]; then
  sed "s/bwz_campus_guide/${DB_NAME}/g" "${DB_DIR}/bwz_campus_guide.sql" | mysql --default-character-set=utf8mb4
  ok "数据导入完成"
else
  ok "库里已有 ${TABLE_COUNT} 张表，跳过数据导入（不覆盖现有内容）"
fi

# 结构迁移（v17/v18/v19 加的字段），幂等；旧库缺字段时由它补上
if ( cd "$APP_DIR" && node server/scripts/migrate-all.mjs ); then
  ok "表结构迁移完成"
else
  warn "表结构迁移失败，内容同步可能出错；可手动重跑：cd ${APP_DIR} && node server/scripts/migrate-all.mjs"
fi

# 内容数据（建筑信息 / 周边设施 / 分类 / 提示语 / 校历…）用 content.json 覆盖式同步。
# SQL 快照里的数据可能是旧的，content.json 是发布时从本机导出的最新内容；
# 只碰这 7 张内容表，不动照片、投稿、日志、后台账号。
if [[ -f "${DB_DIR}/content.json" ]]; then
  if ( cd "$APP_DIR" && node server/scripts/sync-content.mjs ); then
    ok "内容数据已同步（content.json）"
  else
    warn "内容数据同步失败，站点仍可启动；可稍后手动重跑：cd ${APP_DIR} && node server/scripts/sync-content.mjs"
  fi
else
  warn "没有 database/content.json，跳过内容数据同步"
fi

log "4/6 注册 systemd 服务"
mkdir -p "${APP_DIR}/logs"
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=BWZ Campus Guide (Node + Express)
After=network.target mysql.service
Wants=mysql.service

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=${APP_DIR}
Environment=NODE_ENV=production
ExecStart=$(command -v node) server/index.js
Restart=always
RestartSec=3
StandardOutput=append:${APP_DIR}/logs/server.log
StandardError=append:${APP_DIR}/logs/server.err.log

[Install]
WantedBy=multi-user.target
EOF
systemctl daemon-reload
systemctl enable "$SERVICE_NAME" >/dev/null 2>&1 || true
systemctl restart "$SERVICE_NAME"
ok "服务 ${SERVICE_NAME} 已注册并启动"

log "5/6 健康检查"
READY=0
for i in $(seq 1 25); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${PORT}/api/health" 2>/dev/null; then READY=1; break; fi
  sleep 1
done
if [[ $READY -eq 1 ]]; then
  ok "http://127.0.0.1:${PORT}/api/health 正常"
  for p in / /models/campus.glb /admin; do
    code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:${PORT}${p}")"
    [[ "$code" == "200" ]] && ok "GET ${p} → 200" || warn "GET ${p} → ${code}"
  done
else
  warn "健康检查未通过，查看日志：journalctl -u ${SERVICE_NAME} -n 60 --no-pager"
  warn "或：tail -40 ${APP_DIR}/logs/server.err.log"
fi

log "6/6 完成"
HOST_CFG="$(env_get HOST)"
HOST_CFG="${HOST_CFG:-127.0.0.1}"

# 只监听 127.0.0.1 却没装反向代理 → 外网一定打不开，这里提前指出来
if [[ "$HOST_CFG" == "127.0.0.1" ]]; then
  if command -v nginx >/dev/null 2>&1 && systemctl is-active --quiet nginx 2>/dev/null; then
    ok "检测到 Nginx 正在运行，由它反向代理到 127.0.0.1:${PORT}"
  else
    warn "HOST=127.0.0.1 且没有检测到 Nginx —— 外网将无法访问。"
    warn "两种解决办法（二选一）："
    warn "  A. 不用 Nginx：把 app/.env 的 HOST 改成 0.0.0.0，再 systemctl restart ${SERVICE_NAME}"
    warn "  B. 用 Nginx：见 docs/部署说明.md 第 9 节"
  fi
fi

cat <<TXT

  站点        http://127.0.0.1:${PORT}
  后台        http://127.0.0.1:${PORT}/admin     默认 admin / 1234（请马上改）
  监听地址    ${HOST_CFG}
  服务管理    systemctl status | restart | stop ${SERVICE_NAME}
  实时日志    journalctl -u ${SERVICE_NAME} -f

  外网访问不了，先放行端口：
    sudo ufw allow ${PORT}/tcp                                        # Ubuntu / Debian
    sudo firewall-cmd --add-port=${PORT}/tcp --permanent && sudo firewall-cmd --reload   # CentOS
  云服务器还要去控制台「安全组」里放行 ${PORT} 端口。

TXT
