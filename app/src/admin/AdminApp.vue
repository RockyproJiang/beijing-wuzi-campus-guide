<template>
  <div v-if="checking" class="a-loading">
    <span class="a-spinner"></span>
    <span>正在验证登录状态…</span>
  </div>

  <LoginView v-else-if="!admin" @success="onLogin" />

  <div v-else class="a-shell">
    <div v-if="sidebarOpen" class="a-sidebar-backdrop" @click="sidebarOpen = false"></div>

    <aside class="a-sidebar" :class="{ open: sidebarOpen }">
      <div class="a-brand">
        <div class="a-brand-icon"><i class="fa-solid fa-graduation-cap"></i></div>
        <div>
          <strong>北京物资学院</strong>
          <span>校园指南 · 管理后台</span>
        </div>
      </div>

      <nav class="a-nav">
        <div class="a-nav-label">内容管理</div>
        <button
          v-for="item in navItems"
          :key="item.id"
          :class="{ active: view === item.id }"
          @click="go(item.id)"
        >
          <i :class="item.icon"></i>
          {{ item.label }}
        </button>
        <div class="a-nav-label">系统</div>
        <button :class="{ active: view === 'trash' }" @click="go('trash')">
          <i class="fa-solid fa-trash-can"></i>
          回收站
        </button>
        <button :class="{ active: view === 'transfer' }" @click="go('transfer')">
          <i class="fa-solid fa-file-import"></i>
          导入 / 导出
        </button>
      </nav>

      <div class="a-sidebar-foot">
        <div class="who">{{ admin.displayName || admin.username }}</div>
        <div class="sub">@{{ admin.username }} · 已登录</div>
        <div class="links">
          <button @click="openPassword">改密码</button>
          <button @click="logout">退出</button>
        </div>
      </div>
    </aside>

    <main class="a-main">
      <header class="a-topbar">
        <div class="a-row" style="min-width:0;">
          <button class="a-menu-btn" @click="sidebarOpen = true">
            <i class="fa-solid fa-bars"></i>
          </button>
          <div style="min-width:0;">
            <h1>{{ currentNav.label }}</h1>
            <div class="sub">{{ currentNav.sub }}</div>
          </div>
        </div>
        <div class="a-topbar-actions">
          <a class="a-btn a-btn-sm" href="/" target="_blank" rel="noopener">
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
            查看前台
          </a>
          <button class="a-btn a-btn-sm" @click="openPassword">
            <i class="fa-solid fa-key"></i>
            修改密码
          </button>
        </div>
      </header>

      <div class="a-content">
        <component :is="currentView" @navigate="go" />
      </div>
    </main>

    <div class="a-toasts">
      <div v-for="t in toasts" :key="t.id" class="a-toast" :class="t.type">{{ t.message }}</div>
    </div>

    <!-- 修改密码 -->
    <div v-if="passwordOpen" class="a-modal-backdrop" @click.self="passwordOpen = false">
      <div class="a-modal slim">
        <div class="a-modal-head">
          <div>
            <div class="a-modal-title">修改管理员密码</div>
            <div class="a-modal-sub">修改后当前会话仍有效，下次登录请使用新密码</div>
          </div>
          <button class="a-close" @click="passwordOpen = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">
          <div v-if="passwordError" class="a-login-error">{{ passwordError }}</div>
          <div class="a-grid" style="gap:12px;">
            <label class="a-field">
              <span class="a-label">当前密码</span>
              <input v-model="passwordForm.currentPassword" class="a-input" type="password" autocomplete="current-password" />
            </label>
            <label class="a-field">
              <span class="a-label">新密码（至少 4 位）</span>
              <input v-model="passwordForm.nextPassword" class="a-input" type="password" autocomplete="new-password" />
            </label>
            <label class="a-field">
              <span class="a-label">确认新密码</span>
              <input v-model="passwordForm.confirm" class="a-input" type="password" autocomplete="new-password" />
            </label>
          </div>
        </div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="passwordOpen = false">取消</button>
          <button class="a-btn a-btn-primary" :disabled="passwordSaving" @click="savePassword">
            {{ passwordSaving ? '保存中…' : '保存新密码' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, provide, reactive, ref } from 'vue'
import './admin.css'
import { api, onUnauthorized } from './api.js'
import LoginView from './LoginView.vue'
import OverviewView from './OverviewView.vue'
import CategoriesView from './CategoriesView.vue'
import BuildingsView from './BuildingsView.vue'
import CalendarView from './CalendarView.vue'
import DigitalCampusView from './DigitalCampusView.vue'
import SchoolProfileView from './SchoolProfileView.vue'
import SubmissionsView from './SubmissionsView.vue'
import AlbumView from './AlbumView.vue'
import TipsView from './TipsView.vue'
import AliasesView from './AliasesView.vue'
import TrashView from './TrashView.vue'
import TransferView from './TransferView.vue'

const checking = ref(true)
const admin = ref(null)
const view = ref('overview')
const sidebarOpen = ref(false)

const navItems = [
  { id: 'overview', label: '概览', icon: 'fa-solid fa-chart-pie', sub: '数据状态与最近操作' },
  { id: 'buildings', label: '建筑管理', icon: 'fa-solid fa-building', sub: '增删改查建筑、设施与详情' },
  { id: 'categories', label: '分类管理', icon: 'fa-solid fa-layer-group', sub: '分类名称、颜色与排序' },
  { id: 'digital', label: '数字校园', icon: 'fa-solid fa-globe', sub: '应用、服务、部门、网费与 VPN 入口' },
  { id: 'school', label: '学校信息', icon: 'fa-solid fa-school', sub: '「关于」页展示的学校地址、电话、邮编等信息' },
  { id: 'submissions', label: '投稿管理', icon: 'fa-solid fa-inbox', sub: '照片投稿 / 信息补充 / 内容纠错，审核后可一键入库相册' },
  { id: 'album', label: '楼体相册', icon: 'fa-solid fa-images', sub: '按文件夹整理照片，并挂到具体建筑' },
  { id: 'calendar', label: '校历', icon: 'fa-solid fa-calendar-days', sub: '学期标题与关键日期' },
  { id: 'tips', label: '温馨提示', icon: 'fa-solid fa-lightbulb', sub: '首页与速查页展示的小提示' },
  { id: 'aliases', label: '搜索别名', icon: 'fa-solid fa-magnifying-glass', sub: '关键词到建筑的搜索映射' },
]

const views = {
  overview: OverviewView,
  categories: CategoriesView,
  buildings: BuildingsView,
  digital: DigitalCampusView,
  school: SchoolProfileView,
  submissions: SubmissionsView,
  album: AlbumView,
  calendar: CalendarView,
  tips: TipsView,
  aliases: AliasesView,
  trash: TrashView,
  transfer: TransferView,
}

const currentView = computed(() => views[view.value] || OverviewView)
const currentNav = computed(() => {
  const item = navItems.find((n) => n.id === view.value)
  if (item) return item
  if (view.value === 'trash') return { label: '回收站', sub: '已删除的分类与建筑，可恢复或彻底删除' }
  if (view.value === 'transfer') return { label: '导入 / 导出', sub: '整站数据备份、恢复与迁移' }
  return { label: '管理后台', sub: '北京物资学院校园指南' }
})

const toasts = ref([])
let toastSeq = 0

function notify(message, type = 'success') {
  const id = ++toastSeq
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    const i = toasts.value.findIndex((t) => t.id === id)
    if (i > -1) toasts.value.splice(i, 1)
  }, 3200)
}

provide('notify', notify)

function go(id) {
  view.value = id
  sidebarOpen.value = false
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function onLogin(nextAdmin) {
  admin.value = nextAdmin
  view.value = 'overview'
}

async function logout() {
  try {
    await api('/logout', { method: 'POST' })
  } catch {
    /* ignore */
  }
  admin.value = null
}

const passwordOpen = ref(false)
const passwordSaving = ref(false)
const passwordError = ref('')
const passwordForm = reactive({ currentPassword: '', nextPassword: '', confirm: '' })

function openPassword() {
  passwordError.value = ''
  passwordForm.currentPassword = ''
  passwordForm.nextPassword = ''
  passwordForm.confirm = ''
  passwordOpen.value = true
}

async function savePassword() {
  passwordError.value = ''
  if (passwordForm.nextPassword.length < 4) {
    passwordError.value = '新密码至少 4 位'
    return
  }
  if (passwordForm.nextPassword !== passwordForm.confirm) {
    passwordError.value = '两次输入的新密码不一致'
    return
  }
  passwordSaving.value = true
  try {
    await api('/password', {
      method: 'POST',
      body: {
        currentPassword: passwordForm.currentPassword,
        nextPassword: passwordForm.nextPassword,
      },
    })
    passwordOpen.value = false
    notify('密码已修改')
  } catch (error) {
    passwordError.value = error.message
  } finally {
    passwordSaving.value = false
  }
}

onUnauthorized(() => {
  admin.value = null
  checking.value = false
})

onMounted(async () => {
  try {
    const result = await api('/me')
    admin.value = result.admin
  } catch (error) {
    if (error.status !== 401) notify(error.message, 'error')
  } finally {
    checking.value = false
  }
})
</script>
