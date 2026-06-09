# 🏫 北京物资学院校园交互指南 (Beijing Wuzi Campus Guide)

基于 **Vue 3 + Vite** 构建的北京物资学院校园交互导航网站，提供校园地图、建筑信息查询、校历查看等功能。

## ✨ 功能特性

- **🗺️ 校园交互地图** — 可视化校园地图，支持建筑/设施点击查看详情
- **🏢 建筑信息查询** — 教学楼、宿舍、食堂、运动场等设施详情展示
- **📅 校历查看** — 查看学校学期安排、节假日信息
- **🔍 校园服务浏览** — 分类浏览校园服务设施
- **📱 响应式设计** — 适配桌面端与移动端
- **🎬 动画过渡** — 流畅的页面切换与元素动画

## 🛠️ 技术栈

- **Vue 3** (Composition API + <script setup>)
- **Vite 5** 构建工具
- **Font Awesome** 图标库
- **CSS3 动画** (渐变、浮动、关键帧)

## 🚀 本地运行

`ash
# 安装依赖
npm install

# 启动开发服务器 (默认 http://127.0.0.1:5000)
npm run dev

# 构建生产版本
npm run build
`

## 📁 项目结构

`
src/
├── App.vue              # 主应用 (路由、导航、页面编排)
├── main.js              # 入口文件
└── components/
    ├── NavBar.vue        # 顶部导航栏
    ├── MapSection.vue    # 校园地图交互组件
    ├── CalendarPanel.vue # 校历面板
    ├── BrowseSidebar.vue # 浏览侧边栏
    ├── DetailOverlay.vue # 建筑详情弹窗
    ├── DetailOverlayInline.vue
    ├── BrowseOverlay.vue # 浏览弹窗
    ├── DcampusOverlay.vue
    ├── AboutOverlay.vue  # 关于页面
    ├── TipsBox.vue       # 提示框
    ├── FooterSection.vue # 页脚
    └── OverlayNav.vue    # 弹窗导航
`

## 📄 数据文件

- data.js — 校园建筑设施数据
- data.md — 数据说明文档
- public/map.png — 校园地图资源

## ⚙️ 配置说明

服务端口在 ite.config.js 中配置，默认为 127.0.0.1:5000。如需内网穿透，可在 llowedHosts 中添加域名。

## 📃 许可

MIT License
