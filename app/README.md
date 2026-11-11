# app —— 网站本体

这是可运行的 Node + Vue 项目。上层的 `../README.md` 和 `../docs/部署说明.md` 讲部署，这里只讲代码结构。

## 目录

```
app/
├─ server/              Express 5 服务端
│  ├─ index.js          入口：装配中间件、挂路由、生产模式托管 dist
│  ├─ db.js             MySQL 连接池
│  ├─ repo.js           所有 SQL 都在这（建筑/分类/相册/投稿/审计）
│  ├─ validate.js       zod 校验 schema（字段不在这里声明会被 strip 掉）
│  ├─ auth.js           登录、JWT Cookie、登录限流
│  ├─ album.js          相册图片落盘（dataURL → 文件 + 缩略图）
│  ├─ routes/
│  │  ├─ public.js      GET /api/health、/api/site、/api/album、投稿
│  │  └─ admin.js       /api/admin/*（需登录）
│  ├─ scripts/          建库种子、增量迁移、重置管理员密码
│  └─ sql/              schema 与各版本迁移 SQL
├─ src/                 Vue 前端
│  ├─ App.vue           顶层状态、页面切换
│  ├─ components/       Campus3D / BrowseOverlay / DetailOverlayInline / AboutOverlay …
│  ├─ admin/            后台各视图（BuildingEditor / AlbumView / SpatialEditor3D …）
│  ├─ utils/            surfacePatch.js（楼面贴片的几何计算，前后台共用）
│  ├─ data.js           首次加载的兜底数据
│  └─ modelVersion.js   模型版本号，改 GLB 后必须改这里
├─ dist/                构建产物（服务端直接托管，不用再 build）
├─ public/uploads/      用户上传的相册照片（**不要删、不要用 --delete 同步**）
├─ public/models/       campus.glb 源文件
└─ tools/               export-model.py（Blender 导出 GLB）、_glb_manifest.mjs
```

## 关键约定

- **`/api/site` 返回结构**：顶层是 `{ categories, digitalCampus, calendar, tips, aliases }`，建筑嵌在 `categories[].buildings[]`；没有 `/api/buildings`。
- **改建筑必须 PUT 全量字段**：name / sub / aliases / intro / icon / bgColor / color / categoryId / mapX / mapY / mapHidden / group / info / equipment / floors / schedule / contacts / surroundings / timetable / modelObjects / pin / regions / surfacePoints，少传会被 400 或者被置空。
- **新增字段要改三处**：`server/sql/` 加迁移 → `server/repo.js` 的 `buildingRow()` 与写入语句 → `server/validate.js` 的 schema，漏了 schema 就会被 zod strip。
- **改了 GLB**：替换 `public/models/campus.glb` 与 `dist/models/campus.glb`，同步 `public/models/manifest.json`，再改 `src/modelVersion.js` 的 `MODEL_VERSION`，最后 `npm run build`。
- **中文字符编码**：源码统一 UTF-8 无 BOM。**不要用 PowerShell 的 `Set-Content` 回写含中文的文件**，会写成乱码。

## 本地开发

```bash
npm install
npm run dev        # Vite :5000（代理 /api 到 :3001） + API :3001
npm run build      # 产出 dist
npm run start      # 生产模式，读 .env 的 SERVE_PORT
```

数据库：

```bash
mysql -u root -p < ../database/01-init.sql
mysql -u root -p < ../database/bwz_campus_guide.sql
```

增量迁移（本地已有旧库时）：

```bash
node server/scripts/migrate-v12.mjs
node server/scripts/migrate-v17.mjs
node server/scripts/migrate-v18.mjs
```
