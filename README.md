# 北京物资学院 · 校园指南

> Beijing Wuzi University Campus Guide —— 面向北京物资学院的校园三维导览与设施速查网站。
>
> 本项目为个人作品，非学校官方发布。信息仅供参考，以现场通知为准。

- **三维校园地图**：GLB 模型 4.1 MB（177 个建筑体块），拖动旋转 / 滚轮缩放 / 点选建筑 / 3D 定位发光
- **设施速查**：按分类浏览或模糊搜索（支持别称），详情分为建筑信息 / 设施设备 / 楼层详情 / 上课时间 / 联系电话 / 周边设施 / 楼体相册
- **数字校园门户**：分区汇总，与地图互通
- **管理后台**：建筑增删改、图标预设、信息分类、3D 定位校准、区域与楼面贴片编辑、相册与顺序管理、投稿审核

技术栈：Vue 3 + Vite 5 + three.js 0.186 / Express 5 + MySQL 8 / Node 20+

---

## 目录结构

```
beijing-wuzi-campus-guide/
├─ app/                     ← 网站本体（Node 服务 + 前端源码与构建产物）
│  ├─ server/               Express 服务端（API + 托管 dist）
│  ├─ src/                  Vue 前端源码
│  ├─ dist/                 已构建好的前端（可直接上线，不用再 build）
│  ├─ public/uploads/       楼体相册上传的照片（部署时保留）
│  ├─ .env.example          环境变量模板（复制为 .env 后填写）
│  └─ package.json
├─ database/
│  ├─ 01-init.sql           建库 + 建数据库账号
│  └─ bwz_campus_guide.sql  完整数据导出（表结构 + 全部内容）
├─ deploy/
│  ├─ deploy.sh             Linux 一键部署脚本（systemd 开机自启）
│  └─ nginx.conf.example    Nginx 反代示例（可选，走 80/443 时用）
├─ blender/                 北京物资学院_白膜.blend（模型源文件，改模型时用）
├─ docs/
│  ├─ 平面图-建筑编号.png     建筑编号对照图
│  ├─ 部署说明.md            服务器部署与更新（**先看这个**）
│  └─ 贴图/                  建模用的贴图素材
└─ README.md                本文件
```

---

## 在服务器上跑起来（最短路径）

把整个仓库上传到服务器（例如 `/opt/bwz-campus-guide`），然后：

```bash
cd /opt/bwz-campus-guide/deploy
chmod +x deploy.sh
sudo ./deploy.sh
```

脚本会依次完成：装依赖 → 建库导数据 → 注册 systemd 服务 → 启动 → 健康检查。

默认访问 `http://服务器IP:55`，后台 `http://服务器IP:55/admin`，账号 `admin / 1234`（**上线后请立刻改密码**）。

详细步骤、端口冲突处理、Nginx 反代、后续更新流程，全部写在 `docs/部署说明.md`。

---

## 本地开发

要求 **Node 20+**、**MySQL 8**。

```bash
cd app
cp .env.example .env      # 填写 DB_HOST / DB_USER / DB_PASSWORD / DB_NAME / JWT_SECRET
npm install
npm run dev               # 前端 http://127.0.0.1:5000（Vite 代理 /api 到 3001）+ API 3001
```

生产预览：

```bash
npm run build
npm run start    # NODE_ENV=production，读取 .env 的 SERVE_PORT
```

数据库首次初始化（本地）：

```bash
mysql -u root -p < ../database/01-init.sql
mysql -u root -p < ../database/bwz_campus_guide.sql
```

---

## 内容维护

后台 `/admin` 可以改所有内容，改动直接进数据库，**不需要重新构建前端**。只有改前端界面或模型时才需要重新 build / 重新导出 GLB。

| 想改什么 | 怎么做 |
|---|---|
| 建筑名称、简介、设施、楼层、上课时间、图片 | 后台 → 建筑管理 / 楼体相册 |
| 地图上图标位置 | 后台 → 建筑管理 → 3D 定位 |
| 楼体上的色块区域、贴片 | 后台 → 建筑管理 → 区域编辑器 |
| 模型本身（楼体形状、贴图） | 改 `blender/北京物资学院_白膜.blend`，重新导出 GLB 替换 `app/public/models/campus.glb` 与 `app/dist/models/campus.glb`，再改 `app/src/modelVersion.js` 的版本号并重新 build |

---

## 许可

[MIT](LICENSE) © 2025-2026 Rocky (RockyproJiang)

校园名称、建筑与设施信息属公开信息整理；三维模型为本项目自制。本项目为个人作品，非北京物资学院官方发布，信息仅供参考，以现场通知为准。

## 数据与安全

- 仓库内**不含任何真实密钥**：数据库密码、JWT 密钥统一走 `app/.env`（已被 `.gitignore` 排除），模板见 `app/.env.example`。
- `database/01-init.sql` 用 `__DB_NAME__` / `__DB_USER__` / `__DB_PASS__` 占位符，由 `deploy/deploy.sh` 在部署时替换。
- 初始管理员为 `admin` / `1234`（`database/bwz_campus_guide.sql` 中的 bcrypt 哈希），**上线后请立刻在后台修改密码**。
- 楼体相册与用户投稿照片不随仓库分发（`app/public/uploads/` 仅保留空目录占位），部署后由后台上传。
