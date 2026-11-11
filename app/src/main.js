import { createApp } from 'vue'
import App from './App.vue'
import './styles/map-panels.css'

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const isAdmin = path === '/admin' || path === '/admin.html' || path.startsWith('/admin/')

if (isAdmin) {
  document.title = '后台管理 · 北京物资学院校园指南'
  import('./admin/AdminApp.vue')
    .then(({ default: AdminApp }) => createApp(AdminApp).mount('#app'))
    .catch((error) => {
      console.error('[admin] 加载失败', error)
      document.getElementById('app').innerHTML =
        '<div style="padding:40px;font-family:sans-serif">后台加载失败，请刷新页面或检查控制台。</div>'
    })
} else {
  createApp(App).mount('#app')
}