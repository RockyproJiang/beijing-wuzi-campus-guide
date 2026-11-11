<template>
  <div>
    <div class="a-toolbar">
      <div class="a-small a-muted">
        投稿管理 · 待处理 {{ counts.pending }} · 已处理 {{ counts.processed }} · 已忽略 {{ counts.ignored }}
      </div>
      <div class="a-spacer"></div>
      <input v-model="keyword" class="a-input" style="max-width:220px;" placeholder="按建筑 / 地点 / 内容搜索" />
      <button class="a-btn a-btn-sm" :disabled="loading" @click="load">
        <i class="fa-solid fa-rotate" :class="{ 'fa-spin': loading }"></i> 刷新
      </button>
    </div>

    <div class="a-card">
      <div class="a-card-head">
        <div class="a-card-title"><i class="fa-solid fa-inbox"></i> 投稿管理</div>
        <div class="a-row" style="gap:4px;">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="a-tab"
            :style="tabStyle"
            :class="{ active: filter === tab.id }"
            @click="filter = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="a-card-body">
        <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载投稿…</div>
        <div v-else-if="!filtered.length" class="a-empty">
          <i class="fa-solid fa-inbox"></i>
          <p>当前没有{{ filterLabel }}投稿</p>
        </div>
        <div v-else class="sub-list">
          <div v-for="item in filtered" :key="item.id" class="sub-card" :class="'status-' + item.status">
            <div class="sub-head">
              <div class="sub-place">
                <i class="fa-solid fa-location-dot"></i>
                <strong>{{ item.buildingName || item.placeName || (item.pin ? '地图点选位置' : '未命名位置') }}</strong>
                <span v-if="item.buildingName && item.placeName" class="a-muted">· {{ item.placeName }}</span>
                <span v-if="item.pin" class="sub-pin">X {{ item.pin.x.toFixed(1) }} · Z {{ item.pin.z.toFixed(1) }}</span>
              </div>
              <span class="sub-type">{{ typeLabel(item.type) }}</span>
              <span class="sub-status" :class="'s-' + item.status">{{ statusLabel(item.status) }}</span>
            </div>
            <div v-if="item.photo" class="sub-photo">
              <a :href="photoUrl(item.photo.path)" target="_blank" rel="noopener">
                <img :src="photoUrl(item.photo.thumb || item.photo.path)" alt="投稿照片" loading="lazy" />
              </a>
              <div class="sub-photo-side">
                <span class="sub-photo-name">
                  <i class="fa-solid fa-image"></i>
                  {{ item.placeName || '未命名照片' }}
                </span>
                <span class="sub-photo-dim">
                  {{ item.photo.width }}×{{ item.photo.height }} · {{ formatBytes(item.photo.bytes) }}
                </span>
                <span v-if="item.authorName" class="sub-photo-author">署名：{{ item.authorName }}</span>
                <span v-else class="sub-photo-author">匿名</span>
                <span v-if="item.publishedPhotoId" class="sub-photo-done">
                  <i class="fa-solid fa-circle-check"></i> 已入库 #{{ item.publishedPhotoId }}
                </span>
              </div>
            </div>
            <div v-if="item.content" class="sub-content">{{ item.content }}</div>
            <div v-if="item.adminNote" class="sub-note">
              <i class="fa-solid fa-note-sticky"></i> 处理备注：{{ item.adminNote }}
            </div>
            <div class="sub-meta">
              <span><i class="fa-regular fa-clock"></i> 发生/确认：{{ formatDate(item.occurredAt) || '未填写' }}</span>
              <span><i class="fa-solid fa-paper-plane"></i> 提交：{{ formatDate(item.createdAt) }}</span>
              <span v-if="item.contact"><i class="fa-solid fa-address-book"></i> {{ item.contact }}</span>
            </div>
            <div class="sub-actions">
              <button
                v-if="item.type === 'photo' && item.photo && !item.publishedPhotoId"
                class="a-btn a-btn-sm a-btn-primary"
                :disabled="publishing === item.id"
                @click="publishPhoto(item)"
              >
                <i class="fa-solid" :class="publishing === item.id ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'"></i>
                {{ publishing === item.id ? '入库中…' : '审核通过并入相册' }}
              </button>
              <button v-if="item.type === 'photo' && item.photo" class="a-btn a-btn-sm" @click="downloadPhoto(item)">
                <i class="fa-solid fa-download"></i> 下载照片
              </button>
              <button
                v-if="item.type === 'photo'"
                class="a-btn a-btn-sm"
                @click="openEdit(item)"
              >
                <i class="fa-solid fa-pen"></i> 编辑投稿
              </button>
              <button v-else-if="item.buildingId" class="a-btn a-btn-sm" @click="openBuildingEditor(item)">
                <i class="fa-solid fa-building-circle-check"></i> 打开建筑编辑
              </button>
              <button v-else class="a-btn a-btn-sm" @click="openEdit(item)">
                <i class="fa-solid fa-pen"></i> 编辑
              </button>
              <button v-if="item.status !== 'processed'" class="a-btn a-btn-sm" @click="setStatus(item, 'processed')">
                <i class="fa-solid fa-check"></i> 标记已处理
              </button>
              <button v-if="item.status !== 'ignored'" class="a-btn a-btn-sm" @click="setStatus(item, 'ignored')">
                <i class="fa-solid fa-eye-slash"></i> 忽略
              </button>
              <button v-if="item.status !== 'pending'" class="a-btn a-btn-sm" @click="setStatus(item, 'pending')">
                <i class="fa-solid fa-rotate-left"></i> 恢复待处理
              </button>
              <div class="a-spacer"></div>
              <button class="a-btn a-btn-sm a-btn-danger" @click="toDelete = item">
                <i class="fa-solid fa-trash"></i> 删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 编辑投稿 -->
    <div v-if="editing" class="a-modal-backdrop" @click.self="editing = null">
      <div class="a-modal" style="max-width:660px;">
        <div class="a-modal-head">
          <div>
            <div class="a-modal-title">编辑这条投稿</div>
            <div class="a-modal-sub">{{ editing.type === 'photo' ? '改完保存后，点「审核通过并入相册」即可把照片放进楼体相册' : '改完保存后，可点「打开建筑编辑」去改对应建筑的实际数据' }}</div>
          </div>
          <button class="a-close" @click="editing = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">
          <div class="a-grid" style="gap:11px;">
            <div v-if="editing.type === 'photo' && editing.photo" class="edit-photo">
              <img :src="photoUrl(editing.photo.thumb || editing.photo.path)" :alt="editing.placeName || '照片'" />
              <div class="edit-photo-meta">
                <b>{{ editing.photo.width }}×{{ editing.photo.height }}</b>
                <span>{{ formatBytes(editing.photo.bytes) }}</span>
                <span v-if="editing.publishedPhotoId" class="edit-photo-done">
                  <i class="fa-solid fa-circle-check"></i> 已入库 #{{ editing.publishedPhotoId }}
                </span>
              </div>
            </div>
            <div v-if="editing.type === 'photo'" class="a-grid a-grid-2" style="gap:11px;">
              <label class="a-field">
                <span class="a-label">照片名称</span>
                <input v-model="editForm.placeName" class="a-input" placeholder="如 图书馆正门" />
              </label>
              <label class="a-field">
                <span class="a-label">署名（留空为匿名）</span>
                <input v-model="editForm.authorName" class="a-input" placeholder="匿名" />
              </label>
            </div>
            <label class="a-field">
              <span class="a-label">关联建筑</span>
              <select v-model="editForm.buildingId" class="a-input">
                <option value="">（不关联建筑）</option>
                <option v-for="b in buildingOptions" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </label>
            <label class="a-field">
              <span class="a-label">{{ editing.type === 'photo' ? '具体位置（选填）' : '具体位置' }}</span>
              <input v-model="editForm.location" class="a-input" placeholder="如 3 号宿舍楼东侧快递架" />
            </label>
            <div class="a-grid a-grid-2" style="gap:11px;">
              <label class="a-field">
                <span class="a-label">X 坐标</span>
                <input v-model.number="editForm.pinX" class="a-input" type="number" step="0.1" />
              </label>
              <label class="a-field">
                <span class="a-label">Z 坐标</span>
                <input v-model.number="editForm.pinZ" class="a-input" type="number" step="0.1" />
              </label>
            </div>
            <div class="a-grid a-grid-2" style="gap:11px;">
              <label class="a-field">
                <span class="a-label">类型</span>
                <select v-model="editForm.type" class="a-input" :disabled="editing.type === 'photo'">
                  <option value="photo">照片投稿</option>
                  <option value="supplement">信息补充</option>
                  <option value="correction">内容纠错</option>
                  <option value="new">新增位置</option>
                  <option value="correction">信息纠错</option>
                  <option value="closed">已关闭</option>
                  <option value="moved">已搬迁</option>
                  <option value="other">其他</option>
                </select>
              </label>
              <label class="a-field">
                <span class="a-label">状态</span>
                <select v-model="editForm.status" class="a-input">
                  <option value="pending">待处理</option>
                  <option value="processed">已处理</option>
                  <option value="ignored">已忽略</option>
                </select>
              </label>
            </div>
            <label class="a-field">
              <span class="a-label">内容描述</span>
              <textarea v-model="editForm.content" class="a-input" rows="4" style="resize:vertical;"></textarea>
            </label>
            <label class="a-field">
              <span class="a-label">处理备注（只给后台看）</span>
              <input v-model="editForm.adminNote" class="a-input" placeholder="如：已更新 pin 坐标 / 已关闭" />
            </label>
          </div>
        </div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="editing = null">取消</button>
          <button class="a-btn a-btn-primary" :disabled="saving" @click="saveEdit">
            {{ saving ? '保存中…' : '保存修改' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="toDelete" class="a-modal-backdrop" @click.self="toDelete = null">
      <div class="a-modal" style="max-width:420px;">
        <div class="a-modal-head">
          <div>
            <div class="a-modal-title">删除投稿</div>
            <div class="a-modal-sub">删除后不可恢复</div>
          </div>
          <button class="a-close" @click="toDelete = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">
          <p class="a-small">确定删除“{{ toDelete.buildingName || toDelete.placeName }}”的这条投稿吗？</p>
        </div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="toDelete = null">取消</button>
          <button class="a-btn a-btn-danger" @click="remove">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, ref } from 'vue'
import { api } from './api.js'

const emit = defineEmits(['navigate'])
const notify = inject('notify', () => {})
const loading = ref(true)
const items = ref([])
const buildings = ref([])
const keyword = ref('')
const filter = ref('pending')
const toDelete = ref(null)
const editing = ref(null)
const saving = ref(false)
const editForm = ref({})
const tabs = [
  { id: 'all', label: '全部' },
  { id: 'pending', label: '待处理' },
  { id: 'processed', label: '已处理' },
  { id: 'ignored', label: '已忽略' },
]
const tabStyle = { padding: '5px 9px', fontSize: '10.5px' }
const publishing = ref(0)

/** 投稿照片的静态地址（待审核的在 submissions 目录，已入库的在 album 目录） */
function photoUrl(rel) {
  if (!rel) return ''
  if (/^https?:/i.test(rel) || rel.startsWith('/')) return rel
  return rel.startsWith('pending/') || rel.startsWith('pending/')
    ? `/uploads/submissions/${rel}`
    : `/uploads/album/${rel}`
}
function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

/** 审核通过：把照片搬进该建筑的楼体相册 */
async function publishPhoto(item) {
  publishing.value = item.id
  try {
    const result = await api(`/submissions/${item.id}/publish`, {
      method: 'POST',
      body: { title: item.placeName || '', caption: item.content || '' },
    })
    const idx = items.value.findIndex((i) => i.id === item.id)
    if (idx >= 0) {
      items.value[idx] = {
        ...items.value[idx],
        status: 'processed',
        publishedPhotoId: result.photo?.id || null,
      }
    }
    notify(`已入库到「${result.photo?.folderName || '相册'}」`, 'success')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    publishing.value = 0
  }
}

const buildingOptions = computed(() =>
  [...buildings.value]
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'))
)

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return items.value
    .filter((i) => filter.value === 'all' || i.status === filter.value)
    .filter((i) => {
      if (!kw) return true
      return `${i.buildingName} ${i.placeName} ${i.content} ${i.contact}`.toLowerCase().includes(kw)
    })
})
const counts = computed(() => ({
  pending: items.value.filter((i) => i.status === 'pending').length,
  processed: items.value.filter((i) => i.status === 'processed').length,
  ignored: items.value.filter((i) => i.status === 'ignored').length,
}))
const filterLabel = computed(() => tabs.find((t) => t.id === filter.value)?.label || '')

async function load() {
  loading.value = true
  try {
    const [result, buildingResult] = await Promise.all([
      api('/submissions'),
      api('/buildings').catch(() => ({ items: [] })),
    ])
    items.value = result.items || []
    buildings.value = buildingResult.items || []
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function setStatus(item, status) {
  try {
    const result = await api(`/submissions/${item.id}`, { method: 'PATCH', body: { status } })
    const idx = items.value.findIndex((i) => i.id === item.id)
    if (idx >= 0) items.value[idx] = result.item
    notify('状态已更新')
  } catch (error) {
    notify(error.message, 'error')
  }
}

function openEdit(item) {
  editing.value = item
  editForm.value = {
    buildingId: item.buildingId || '',
    placeName: item.placeName || '',
    authorName: item.authorName || '',
    location: item.type === 'photo' ? '' : (item.placeName || ''),
    pinX: item.pin ? item.pin.x : null,
    pinZ: item.pin ? item.pin.z : null,
    type: item.type,
    status: item.status,
    content: item.content,
    adminNote: item.adminNote || '',
  }
}

async function saveEdit() {
  if (!editing.value) return
  saving.value = true
  try {
    const hasPin = Number.isFinite(editForm.value.pinX) && Number.isFinite(editForm.value.pinZ)
    const result = await api(`/submissions/${editing.value.id}`, {
      method: 'PUT',
      body: {
        buildingId: editForm.value.buildingId || null,
        placeName: editing.value.type === 'photo'
          ? (editForm.value.placeName || '')
          : (editForm.value.location || ''),
        authorName: editForm.value.authorName || '',
        pin: hasPin ? { x: Number(editForm.value.pinX), z: Number(editForm.value.pinZ) } : null,
        clearPin: !hasPin,
        type: editForm.value.type,
        status: editForm.value.status,
        content: editForm.value.content,
        adminNote: editForm.value.adminNote,
      },
    })
    const idx = items.value.findIndex((i) => i.id === result.item.id)
    if (idx >= 0) items.value[idx] = result.item
    editing.value = null
    notify('投稿已更新')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    saving.value = false
  }
}

/** 下载投稿原图 */
async function downloadPhoto(item) {
  const url = photoUrl(item.photo?.path || item.photo?.thumb)
  if (!url) {
    notify('这条投稿没有照片', 'error')
    return
  }
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`下载失败（${res.status}）`)
    const blob = await res.blob()
    const ext = (url.split('.').pop() || 'jpg').split('?')[0]
    const name = `${item.buildingName || '投稿'}-${item.placeName || '照片'}.${ext}`.replace(/[\\/:*?"<>|]/g, '_')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    notify('照片已开始下载')
  } catch (error) {
    notify(error.message, 'error')
  }
}

/** 打开该投稿对应建筑的编辑器（由 AdminApp 负责跳到建筑管理并选中） */
function openBuildingEditor(item) {
  if (!item.buildingId) {
    notify('这条投稿没有关联建筑', 'error')
    return
  }
  emit('navigate', 'buildings')
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('admin:edit-building', { detail: { id: item.buildingId } }))
  }, 60)
}

async function remove() {
  if (!toDelete.value) return
  const id = toDelete.value.id
  try {
    await api(`/submissions/${id}`, { method: 'DELETE' })
    items.value = items.value.filter((i) => i.id !== id)
    toDelete.value = null
    notify('投稿已删除')
  } catch (error) {
    notify(error.message, 'error')
  }
}

function typeLabel(type) {
  return (
    {
      photo: '照片投稿',
      supplement: '信息补充',
      correction: '内容纠错',
      new: '新增位置',
      closed: '已关闭',
      moved: '已搬迁',
      other: '其他',
    }[type] || type
  )
}

function statusLabel(status) {
  return { pending: '待处理', processed: '已处理', ignored: '已忽略' }[status] || status
}
function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

onMounted(load)
</script>

<style scoped>
.sub-list { display: flex; flex-direction: column; gap: 9px; }
.sub-photo {
  display: flex; gap: 12px; align-items: stretch; margin-top: 2px;
  padding: 9px; border-radius: 11px;
  background: rgba(246, 236, 214, 0.32);
  border: 1px solid rgba(212, 168, 83, 0.24);
}
.sub-photo > a { flex: 0 0 132px; display: block; border-radius: 8px; overflow: hidden; }
.sub-photo img {
  width: 132px; height: 96px; object-fit: cover; display: block;
  transition: transform 0.25s;
}
.sub-photo > a:hover img { transform: scale(1.05); }
.sub-photo-side { display: flex; flex-direction: column; gap: 3px; justify-content: center; min-width: 0; }
.sub-photo-name { font-size: 12px; font-weight: 700; color: var(--a-text, #22352c); }
.sub-photo-name i { color: #b8892b; font-size: 11px; margin-right: 3px; }
.sub-photo-dim { font-size: 10.5px; color: var(--a-muted, #7b8a82); font-variant-numeric: tabular-nums; }
.sub-photo-author { font-size: 10.5px; color: var(--a-muted, #7b8a82); }
.sub-photo-done { font-size: 10.5px; font-weight: 600; color: #2d6a4f; }
.sub-photo-done i { font-size: 10px; }
.sub-card { border: 1px solid var(--a-border); border-radius: 11px; background: #fff; padding: 12px 14px; border-left: 4px solid #d4a853; }
.sub-card.status-processed { border-left-color: #2d6a4f; }
.sub-card.status-ignored { border-left-color: #b0a99a; opacity: 0.8; }
.sub-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.sub-place { display: flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--a-primary); }
.sub-place i { color: var(--a-accent); font-size: 11px; }
.sub-pin { font-size: 9px; color: var(--a-muted); font-family: ui-monospace, monospace; background: var(--a-bg); padding: 2px 5px; border-radius: 4px; }
.sub-type { font-size: 9.5px; padding: 2px 7px; border-radius: 999px; background: var(--a-bg); color: var(--a-muted); }
.sub-status { font-size: 9.5px; padding: 2px 7px; border-radius: 999px; margin-left: auto; }
.sub-status.s-pending { background: #fff3d6; color: #8a6420; }
.sub-status.s-processed { background: #d8f3dc; color: #1b4332; }
.sub-status.s-ignored { background: #ece9e2; color: #6b665c; }
.sub-content { font-size: 12px; line-height: 1.7; color: var(--a-fg); margin: 8px 0; white-space: pre-wrap; }
.sub-note { display: flex; align-items: flex-start; gap: 6px; margin-bottom: 8px; padding: 7px 10px; border-radius: 8px; background: #fff8e1; border: 1px solid #ffe0a3; color: #7a5b14; font-size: 10.5px; line-height: 1.6; }
.sub-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 10px; color: var(--a-muted); }
.sub-meta i { margin-right: 3px; color: var(--a-primary-light); }
.sub-actions { display: flex; align-items: center; gap: 5px; margin-top: 9px; padding-top: 8px; border-top: 1px dashed var(--a-bg-deep); flex-wrap: wrap; }
</style>