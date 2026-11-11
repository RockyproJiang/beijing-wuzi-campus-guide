<template>
  <div>
    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载概览…</div>
    <template v-else>
      <div class="overview-hero">
        <div>
          <div class="overview-eyebrow">CONTENT OVERVIEW</div>
          <h2>校园数据总览</h2>
          <p>前台所有内容都由这里维护。修改后刷新前台即可看到最新数据。</p>
        </div>
        <div class="overview-actions">
          <button class="a-btn a-btn-primary" @click="$emit('navigate', 'buildings')">
            <i class="fa-solid fa-plus"></i> 管理建筑
          </button>
          <button class="a-btn" @click="$emit('navigate', 'transfer')">
            <i class="fa-solid fa-download"></i> 备份数据
          </button>
        </div>
      </div>

      <div class="stat-grid">
        <div v-for="s in stats" :key="s.key" class="stat-card">
          <div class="stat-icon" :style="{ background: s.bg, color: s.color }">
            <i :class="s.icon"></i>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ data[s.key] ?? '—' }}</div>
            <div class="stat-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="overview-cols">
        <div class="a-card">
          <div class="a-card-head">
            <div class="a-card-title"><i class="fa-solid fa-clock-rotate-left"></i> 最近操作</div>
            <button class="a-btn a-btn-sm" @click="$emit('navigate', 'trash')">回收站</button>
          </div>
          <div v-if="!recent.length" class="a-empty">
            <i class="fa-solid fa-clock"></i>
            <p>暂无操作记录</p>
          </div>
          <div v-else class="log-list">
            <div v-for="log in recent" :key="log.id" class="log-item">
              <span class="log-action" :class="'act-' + log.action">{{ actionLabel(log.action) }}</span>
              <span class="log-text">
                {{ entityLabel(log.entity) }}
                <template v-if="log.entityId"> · {{ log.entityId }}</template>
              </span>
              <span class="log-time">{{ formatTime(log.createdAt) }}</span>
            </div>
          </div>
        </div>

        <div class="a-card">
          <div class="a-card-head">
            <div class="a-card-title"><i class="fa-solid fa-bolt"></i> 快捷入口</div>
          </div>
          <div class="quick-list">
            <button class="quick-item" @click="$emit('navigate', 'buildings')">
              <i class="fa-solid fa-building" style="color:#2d6a4f"></i>
              <span><strong>建筑与设施</strong><small>修改详情、楼层、设备、课表</small></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-item" @click="$emit('navigate', 'categories')">
              <i class="fa-solid fa-layer-group" style="color:#b5812e"></i>
              <span><strong>分类与排序</strong><small>调整前台筛选顺序和配色</small></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-item" @click="$emit('navigate', 'digital')">
              <i class="fa-solid fa-globe" style="color:#2d6a4f"></i>
              <span><strong>数字校园</strong><small>应用、服务、部门、网费与 VPN 入口</small></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-item" @click="$emit('navigate', 'submissions')">
              <i class="fa-solid fa-inbox" style="color:#b5812e"></i>
              <span><strong>位置投稿</strong><small>查看、标记和删除用户提交的位置信息</small></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-item" @click="$emit('navigate', 'calendar')">
              <i class="fa-solid fa-calendar-days" style="color:#3c6e91"></i>
              <span><strong>校历</strong><small>维护学期关键日期</small></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
            <button class="quick-item" @click="$emit('navigate', 'aliases')">
              <i class="fa-solid fa-magnifying-glass" style="color:#8a5a9e"></i>
              <span><strong>搜索别名</strong><small>“快递”“打印”等关键词指向</small></span>
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="data.lastUpdate" class="last-update">
        <i class="fa-solid fa-database"></i>
        最近一次建筑数据更新：{{ formatTime(data.lastUpdate) }}
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { api, actionLabel, entityLabel, formatTime } from './api.js'

const notify = inject('notify', () => {})
const loading = ref(true)
const data = ref({})
const recent = ref([])

const stats = [
  { key: 'buildings', label: '建筑条目', icon: 'fa-solid fa-building', bg: '#e3f0e6', color: '#1b4332' },
  { key: 'categories', label: '分类', icon: 'fa-solid fa-layer-group', bg: '#f6ecd6', color: '#8a6420' },
  { key: 'withModel', label: '已绑定 3D 模型', icon: 'fa-solid fa-cube', bg: '#e7eef8', color: '#3c5f85' },
  { key: 'tips', label: '温馨提示', icon: 'fa-solid fa-lightbulb', bg: '#f4ecf7', color: '#7a4b8c' },
  { key: 'aliases', label: '搜索别名', icon: 'fa-solid fa-magnifying-glass', bg: '#fdeee6', color: '#a55b34' },
  { key: 'trash', label: '回收站条目', icon: 'fa-solid fa-trash-can', bg: '#f1efe9', color: '#77736a' },
]

const maxLabel = computed(() => (data.value.buildings ? `${data.value.buildings} 个` : '—'))

async function load() {
  loading.value = true
  try {
    const result = await api('/overview')
    data.value = result
    recent.value = result.recent || []
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.overview-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}
.overview-eyebrow {
  font-size: 9.5px;
  letter-spacing: 0.2em;
  color: var(--a-accent);
  font-weight: 700;
}
.overview-hero h2 {
  margin: 3px 0 5px;
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  color: var(--a-primary);
}
.overview-hero p { margin: 0; font-size: 12px; color: var(--a-muted); }
.overview-actions { display: flex; gap: 8px; flex-wrap: wrap; }

.stat-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 11px;
  margin-bottom: 18px;
}
.stat-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 13px 14px;
  background: var(--a-card);
  border: 1px solid var(--a-border);
  border-radius: 12px;
}
.stat-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}
.stat-value { font-family: 'Noto Serif SC', serif; font-size: 20px; font-weight: 900; color: var(--a-primary); line-height: 1.1; }
.stat-label { font-size: 10px; color: var(--a-muted); margin-top: 2px; white-space: nowrap; }

.overview-cols { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; }
.log-list { padding: 6px 8px 8px; }
.log-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 11.5px;
}
.log-item:hover { background: #fbf8f1; }
.log-action {
  font-size: 9.5px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 5px;
  background: var(--a-bg);
  color: var(--a-muted);
  flex-shrink: 0;
}
.log-action.act-login { background: #e3f0e6; color: #1b4332; }
.log-action.act-create { background: #e3f0e6; color: #1b4332; }
.log-action.act-update { background: #f6ecd6; color: #7a5a1d; }
.log-action.act-delete, .log-action.act-purge { background: #f8e7e4; color: #a53f35; }
.log-action.act-import { background: #e7eef8; color: #3c5f85; }
.log-text { flex: 1; color: var(--a-fg); min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.log-time { font-size: 10px; color: var(--a-muted); white-space: nowrap; }

.quick-list { padding: 8px; }
.quick-item {
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  padding: 11px 10px;
  border: none;
  background: transparent;
  border-radius: 9px;
  text-align: left;
  transition: background 0.18s;
}
.quick-item:hover { background: #fbf8f1; }
.quick-item > i:first-child { width: 20px; text-align: center; font-size: 14px; }
.quick-item span { flex: 1; display: flex; flex-direction: column; }
.quick-item strong { font-size: 12px; color: var(--a-fg); font-weight: 700; }
.quick-item small { font-size: 10px; color: var(--a-muted); margin-top: 1px; }
.quick-item > i:last-child { font-size: 9px; color: var(--a-border); }

.last-update {
  margin-top: 18px;
  font-size: 10.5px;
  color: var(--a-muted);
  display: flex;
  align-items: center;
  gap: 6px;
}
.last-update i { color: var(--a-primary-light); }

@media (max-width: 1100px) {
  .stat-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .overview-cols { grid-template-columns: 1fr; }
}
@media (max-width: 700px) {
  .overview-hero { flex-direction: column; align-items: flex-start; }
  .stat-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>
