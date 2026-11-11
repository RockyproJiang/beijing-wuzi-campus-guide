<template>
  <div class="album-view">
    <div class="av-top">
      <div class="av-top-text">
        <h2>楼体相册</h2>
        <p>每栋建筑都有独立文件夹，点进对应文件夹上传即可；照片会自动挂到这栋楼上，前台「设施速查 → 楼体相册」按这里的顺序显示。上传时会自动压缩到 750KB 左右。</p>
      </div>
      <div class="av-top-actions">
        <span class="av-stat"><b>{{ photos.length }}</b> 张照片</span>
        <span class="av-stat"><b>{{ buildingFolders.length }}</b> 个楼栋文件夹</span>
        <button class="btn ghost" :disabled="syncing" @click="syncFolders">
          <i class="fa-solid fa-arrows-rotate" :class="{ spin: syncing }"></i>
          {{ syncing ? '同步中…' : '同步建筑文件夹' }}
        </button>
        <button class="btn primary" @click="openUpload()"><i class="fa-solid fa-cloud-arrow-up"></i> 上传照片</button>
      </div>
    </div>

    <div class="av-body">
      <!-- 文件夹栏 -->
      <aside class="av-side">
        <div class="av-side-head">
          <span>文件夹</span>
          <button class="mini-btn" title="新建文件夹" @click="startNewFolder"><i class="fa-solid fa-plus"></i></button>
        </div>
        <div class="rail-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input v-model.trim="folderKeyword" class="rail-search-input" placeholder="找楼栋…" />
          <button v-if="folderKeyword" class="rail-search-clear" @click="folderKeyword = ''"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="folder-tabs">
          <button class="folder-tab" :class="{ active: folderScope === 'filled' }" @click="folderScope = 'filled'">
            有照片<em>{{ filledCount }}</em>
          </button>
          <button class="folder-tab" :class="{ active: folderScope === 'all' }" @click="folderScope = 'all'">
            全部<em>{{ folders.length }}</em>
          </button>
        </div>
        <div v-if="folderForm.open" class="folder-form">
          <input v-model.trim="folderForm.name" class="inp" placeholder="文件夹名称，如 图书馆" @keyup.enter="saveFolder" />
          <select v-model="folderForm.buildingId" class="inp">
            <option value="">不绑定建筑</option>
            <option v-for="b in buildingList" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <input v-model.trim="folderForm.description" class="inp" placeholder="说明（可选）" @keyup.enter="saveFolder" />
          <div class="folder-form-actions">
            <button class="btn ghost sm" @click="folderForm.open = false">取消</button>
            <button class="btn primary sm" :disabled="!folderForm.name || saving" @click="saveFolder">{{ folderForm.id ? '保存' : '创建' }}</button>
          </div>
        </div>
        <div class="folder-list">
          <button class="folder-item" :class="{ active: !folderId }" @click="pickFolder('')">
            <i class="fa-solid fa-layer-group"></i>
            <span class="folder-name">全部照片</span>
            <em class="folder-count">{{ photos.length }}</em>
          </button>
          <button class="folder-item" :class="{ active: folderId === '__none__' }" @click="pickFolder('__none__')">
            <i class="fa-regular fa-folder-open"></i>
            <span class="folder-name">未归档</span>
            <em class="folder-count">{{ looseCount }}</em>
          </button>
          <button
            v-for="f in visibleFolders" :key="f.id"
            class="folder-item" :class="{ active: folderId === String(f.id) }"
            @click="pickFolder(String(f.id))"
          >
            <i :class="f.buildingId ? 'fa-solid fa-building' : 'fa-solid fa-folder'"></i>
            <span class="folder-name" :title="f.description || f.name">{{ f.name }}</span>
            <em class="folder-count">{{ countOf(f.id) }}</em>
            <span class="folder-ops" @click.stop>
              <button class="mini-btn" title="重命名" @click="startEditFolder(f)"><i class="fa-solid fa-pen"></i></button>
              <button class="mini-btn danger" title="删除文件夹" @click="removeFolder(f)"><i class="fa-solid fa-trash-can"></i></button>
            </span>
          </button>
          <div v-if="!visibleFolders.length" class="folder-empty">没有匹配的文件夹</div>
        </div>
        <p class="av-side-tip"><i class="fa-solid fa-circle-info"></i> 删除文件夹不会删除照片，照片会移到「未归档」。带 <i class="fa-solid fa-building"></i> 的是绑定建筑的文件夹。</p>
      </aside>

      <!-- 照片区 -->
      <section class="av-main">
        <div class="av-toolbar">
          <input v-model.trim="keyword" class="inp search" placeholder="搜索标题 / 说明" />
          <select v-model="buildingFilter" class="inp select">
            <option value="">全部建筑</option>
            <option value="__none__">未挂建筑</option>
            <option v-for="b in buildingOptions" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
          <button
            v-if="canSort"
            class="btn sm"
            :class="sortMode ? 'primary' : 'ghost'"
            @click="sortMode = !sortMode"
          >
            <i class="fa-solid fa-arrow-down-up-across-line"></i>
            {{ sortMode ? '完成排序' : '调整顺序' }}
          </button>
          <span class="av-sel-count" v-if="selected.length">
            已选 {{ selected.length }} 张
            <button class="btn ghost sm" @click="batchAssign()">改挂建筑</button>
            <button class="btn danger sm" @click="batchRemove()">删除</button>
            <button class="btn ghost sm" @click="selected = []">取消选择</button>
          </span>
        </div>

        <div v-if="sortMode" class="sort-hint">
          <i class="fa-solid fa-hand-pointer"></i>
          拖动照片即可调整前台显示顺序，松手自动保存。
          <button class="btn ghost sm" @click="sortMode = false">完成</button>
        </div>

        <div v-if="loading" class="av-loading">加载中…</div>
        <div v-else-if="!filtered.length" class="av-empty">
          <i class="fa-regular fa-images"></i>
          <p>{{ folderId && folderId !== '__none__' ? '这个文件夹还没有照片' : '还没有照片' }}</p>
          <button class="btn primary" @click="openUpload()"><i class="fa-solid fa-cloud-arrow-up"></i> 上传第一批</button>
        </div>
        <div v-else class="photo-grid" :class="{ sorting: sortMode }">
          <div
            v-for="(p, i) in filtered" :key="p.id"
            class="photo-card"
            :data-photo-id="p.id"
            :class="{ picked: selected.includes(p.id), dragging: dragId === p.id, 'drop-target': dropId === p.id && dropId !== dragId }"
            :style="dragId === p.id ? { transform: `translate(${dragDx}px, ${dragDy}px)`, zIndex: 5, opacity: 0.9 } : null"
            @click="sortMode ? null : toggleSelect(p.id)"
            @pointerdown="onPointerDown(p, i, $event)"
          >
            <div class="photo-thumb">
              <img :src="photoSrc(p)" :alt="p.title || ''" loading="lazy" @error="onImgError($event, p)" />
              <span v-if="sortMode" class="photo-order">{{ i + 1 }}</span>
              <span v-else class="photo-check"><i class="fa-solid fa-check"></i></span>
              <span class="photo-size">{{ formatBytes(p.sizeBytes) }}</span>
            </div>
            <div v-if="sortMode" class="photo-sortbar" @click.stop @pointerdown.stop>
              <button class="mini-btn" :disabled="i === 0" title="往前一位" @click="nudge(p, -1)"><i class="fa-solid fa-arrow-left"></i></button>
              <span>第 {{ i + 1 }} 张</span>
              <button class="mini-btn" :disabled="i === filtered.length - 1" title="往后一位" @click="nudge(p, 1)"><i class="fa-solid fa-arrow-right"></i></button>
            </div>
            <div class="photo-meta">
              <div class="photo-title">{{ p.title || '未命名' }}</div>
              <div class="photo-sub">
                <span class="tag-building" :class="{ none: !p.buildingName }">{{ p.buildingName || '未挂建筑' }}</span>
                <span class="dot">·</span>
                <span>{{ p.folderName || '未归档' }}</span>
              </div>
            </div>
            <div class="photo-ops" @click.stop>
              <button class="mini-btn" title="编辑" @click="openEdit(p)"><i class="fa-solid fa-pen"></i></button>
              <a class="mini-btn" :href="photoSrc(p, true)" target="_blank" rel="noopener" title="查看原图"><i class="fa-solid fa-up-right-from-square"></i></a>
              <button class="mini-btn danger" title="删除" @click="removePhoto(p)"><i class="fa-solid fa-trash-can"></i></button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 上传 / 编辑弹窗 -->
    <div v-if="dialog.open" class="av-modal-mask" @click.self="closeDialog">
      <div class="av-modal">
        <header class="av-modal-head">
          <h3>{{ dialog.id ? '编辑照片' : '上传照片' }}</h3>
          <button class="mini-btn" @click="closeDialog"><i class="fa-solid fa-xmark"></i></button>
        </header>
        <div class="av-modal-body">
          <div
            v-if="!dialog.id"
            class="drop-zone"
            :class="{ over: dragOver }"
            @dragenter.prevent="onDragEnter"
            @dragover.prevent="onDragOver"
            @dragleave.prevent="onDragLeave"
            @drop.prevent="onDrop"
          >
            <input ref="fileInput" type="file" accept="image/*" multiple class="hidden-file" @change="onPick" />
            <i :class="dragOver ? 'fa-solid fa-file-arrow-down' : 'fa-solid fa-cloud-arrow-up'"></i>
            <p v-if="dragOver"><b>松手即可上传</b></p>
            <p v-else>把图片拖进来，或者 <button class="link-btn" @click="fileInput?.click()">选择文件</button></p>
            <small>支持多选，自动压缩到 700KB–1MB（不到 700KB 的保持原样不放大）</small>
          </div>

          <div class="form-grid">
            <label class="field">
              <span>文件夹</span>
              <select v-model="dialog.folderId" class="inp" @change="onDialogFolderChange">
                <option value="">未归档</option>
                <option v-for="f in folders" :key="f.id" :value="String(f.id)">{{ f.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>挂到建筑</span>
              <select v-model="dialog.buildingId" class="inp">
                <option value="">不挂建筑（仅在相册里）</option>
                <option v-for="b in buildingOptions" :key="b.id" :value="b.id">{{ b.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>标题</span>
              <input v-model.trim="dialog.title" class="inp" placeholder="如 图书馆正面" />
            </label>
            <label class="field">
              <span>说明</span>
              <input v-model.trim="dialog.caption" class="inp" placeholder="拍摄时间、角度等，可留空" />
            </label>
          </div>

          <div v-if="queue.length" class="queue">
            <div v-for="(item, i) in queue" :key="item.key" class="queue-row" :class="item.status">
              <img v-if="item.preview" :src="item.preview" alt="" class="queue-thumb" />
              <div v-else class="queue-thumb placeholder"><i class="fa-regular fa-image"></i></div>
              <div class="queue-info">
                <div class="queue-name">{{ item.name }}</div>
                <div class="queue-sub">
                  <span v-if="item.status === 'waiting'">等待处理…</span>
                  <span v-else-if="item.status === 'working'">正在压缩…</span>
                  <span v-else-if="item.status === 'done'">
                    <i class="fa-solid fa-circle-check ok"></i>
                    {{ formatBytes(item.origBytes) }} → <b>{{ formatBytes(item.sizeBytes) }}</b>
                    <em v-if="!item.compressed">（原图已足够小，未压缩）</em>
                  </span>
                  <span v-else-if="item.status === 'error'" class="err"><i class="fa-solid fa-triangle-exclamation"></i> {{ item.error }}</span>
                  <span v-else-if="item.status === 'uploaded'" class="ok"><i class="fa-solid fa-check"></i> 已上传</span>
                </div>
              </div>
              <button v-if="!dialog.id" class="mini-btn" @click="queue.splice(i, 1)"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>

          <div v-if="dialog.id" class="single-preview">
            <img :src="dialog.current ? photoSrc(dialog.current) : ''" alt="" />
          </div>
        </div>
        <footer class="av-modal-foot">
          <span class="foot-hint">{{ footHint }}</span>
          <button class="btn ghost" @click="closeDialog">取消</button>
          <button v-if="!dialog.id" class="btn primary" :disabled="busy || !queue.length" @click="submitUpload">
            <i class="fa-solid fa-upload"></i> {{ busy ? '上传中…' : `上传 ${queue.length} 张` }}
          </button>
          <button v-else class="btn primary" :disabled="busy" @click="submitEdit">保存</button>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { api } from './api.js'
import { compressPhoto, makeThumbDataUrl, formatBytes, PHOTO_TARGET_BYTES } from '../utils/photoCompress.js'

const notify = inject('notify', () => {})

const folders = ref([])
const photos = ref([])
const buildings = ref([])
const loading = ref(true)
const busy = ref(false)
const saving = ref(false)
const syncing = ref(false)

const folderId = ref('')
const folderKeyword = ref('')
const folderScope = ref('filled')
const keyword = ref('')
const buildingFilter = ref('')
const selected = ref([])
const dragOver = ref(false)
const fileInput = ref(null)
const sortMode = ref(false)

const BUILDING_VISIBLE_LIMIT = 400

/** 有照片或绑定了建筑的文件夹排前面，其余按名字 */
const buildingFolders = computed(() => folders.value.filter((f) => f.buildingId))
const filledCount = computed(() => folders.value.filter((f) => countOf(f.id) > 0).length)
const visibleFolders = computed(() => {
  const kw = folderKeyword.value.toLowerCase()
  let list = [...folders.value]
  if (folderScope.value === 'filled') list = list.filter((f) => countOf(f.id) > 0)
  if (kw) list = list.filter((f) => String(f.name).toLowerCase().includes(kw))
  return list.sort((a, b) => {
    const ca = countOf(a.id)
    const cb = countOf(b.id)
    if (ca !== cb) return cb - ca
    return String(a.name).localeCompare(String(b.name), 'zh')
  })
})

/** 拍到的照片按 id 排好；同一文件夹内按 sortOrder */
const sortedPhotos = computed(() =>
  [...photos.value].sort((a, b) => {
    const sa = a.sortOrder ?? 0
    const sb = b.sortOrder ?? 0
    if (sa !== sb) return sa - sb
    return (a.id || 0) - (b.id || 0)
  })
)

const buildingList = computed(() => [...buildings.value].sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh')))

const buildingOptions = computed(() => {
  const list = buildingList.value
  const chosen = buildingFilter.value && buildingFilter.value !== '__none__' ? buildingFilter.value : ''
  const top = chosen ? list.filter((b) => b.id === chosen) : []
  const rest = list.filter((b) => !top.includes(b))
  return [...top, ...rest].slice(0, BUILDING_VISIBLE_LIMIT)
})

const looseCount = computed(() => photos.value.filter((p) => !p.folderId).length)
function countOf(id) {
  return photos.value.filter((p) => String(p.folderId || '') === String(id)).length
}

const filtered = computed(() => {
  const kw = keyword.value.toLowerCase()
  return sortedPhotos.value.filter((p) => {
    if (folderId.value === '__none__' && p.folderId) return false
    if (folderId.value && folderId.value !== '__none__' && String(p.folderId || '') !== folderId.value) return false
    if (buildingFilter.value === '__none__' && p.buildingId) return false
    if (buildingFilter.value && buildingFilter.value !== '__none__' && p.buildingId !== buildingFilter.value) return false
    if (kw) {
      const text = `${p.title || ''} ${p.caption || ''} ${p.buildingName || ''}`.toLowerCase()
      if (!text.includes(kw)) return false
    }
    return true
  })
})

/** 只有在「单个文件夹」或「未归档」下才允许手动排序 */
const canSort = computed(() => Boolean(folderId.value) && !keyword.value && !buildingFilter.value)

/* ---------------- 图片地址 ---------------- */
/** 后端返回 filePath / thumbPath，拼成 /uploads/album/... */
function photoSrc(photo, original = false) {
  if (!photo) return ''
  const rel = original ? (photo.filePath || photo.thumbPath) : (photo.thumbPath || photo.filePath)
  if (!rel) return ''
  if (/^https?:|^data:/.test(rel)) return rel
  return `/uploads/album/${rel.replace(/^\/+/, '')}`
}
function onImgError(event, photo) {
  const el = event.target
  if (el.dataset.fallback) return
  el.dataset.fallback = '1'
  el.src = photoSrc(photo, true)
}

/* ---------------- 数据加载 ---------------- */
async function loadFolders() {
  const data = await api('/album/folders')
  folders.value = data.items || []
}
async function loadPhotos() {
  const data = await api('/album/photos')
  photos.value = data.items || []
}
async function loadBuildings() {
  try {
    const data = await api('/buildings?limit=500')
    buildings.value = data.items || []
  } catch {
    buildings.value = []
  }
}
async function reload() {
  loading.value = true
  try {
    await Promise.all([loadFolders(), loadPhotos()])
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}
onMounted(async () => {
  await Promise.all([reload(), loadBuildings()])
})

function pickFolder(id) {
  folderId.value = id
  selected.value = []
  sortMode.value = false
}

/* ---------------- 文件夹 ---------------- */
const folderForm = reactive({ open: false, id: null, name: '', description: '', buildingId: '' })
function startNewFolder() {
  Object.assign(folderForm, { open: true, id: null, name: '', description: '', buildingId: '' })
}
function startEditFolder(folder) {
  Object.assign(folderForm, {
    open: true, id: folder.id, name: folder.name,
    description: folder.description || '', buildingId: folder.buildingId || '',
  })
}
async function saveFolder() {
  if (!folderForm.name) return
  saving.value = true
  try {
    const body = {
      name: folderForm.name,
      description: folderForm.description,
      buildingId: folderForm.buildingId || null,
    }
    if (folderForm.id) {
      const data = await api(`/album/folders/${folderForm.id}`, { method: 'PUT', body })
      const idx = folders.value.findIndex((f) => f.id === folderForm.id)
      if (idx >= 0) folders.value[idx] = data.item
      notify('文件夹已更新')
    } else {
      const data = await api('/album/folders', { method: 'POST', body })
      folders.value.push(data.item)
      notify('文件夹已创建')
    }
    folderForm.open = false
    await Promise.all([loadFolders(), loadPhotos()])
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    saving.value = false
  }
}
async function removeFolder(folder) {
  if (!window.confirm(`删除文件夹「${folder.name}」？里面的照片会移到「未归档」，不会被删除。`)) return
  try {
    await api(`/album/folders/${folder.id}`, { method: 'DELETE' })
    if (folderId.value === String(folder.id)) folderId.value = ''
    notify('文件夹已删除')
    await Promise.all([loadFolders(), loadPhotos()])
  } catch (error) {
    notify(error.message, 'error')
  }
}

/** 给所有建筑补文件夹（每栋楼一个） */
async function syncFolders() {
  syncing.value = true
  try {
    const data = await api('/album/folders/sync-buildings', { method: 'POST', body: {} })
    await Promise.all([loadFolders(), loadPhotos()])
    notify(data.created ? `已为 ${data.created} 栋建筑新建文件夹` : '所有建筑都已经有文件夹了')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    syncing.value = false
  }
}

/* ---------------- 上传 / 编辑 ---------------- */
const dialog = reactive({
  open: false,
  id: null,
  folderId: '',
  buildingId: '',
  title: '',
  caption: '',
  current: null,
})
const queue = ref([])
let keySeed = 0

function defaultFolderValue() {
  return folderId.value && folderId.value !== '__none__' ? folderId.value : ''
}

function openUpload() {
  queue.value = []
  const presetFolder = defaultFolderValue()
  const bound = folders.value.find((f) => String(f.id) === presetFolder)
  Object.assign(dialog, {
    open: true, id: null,
    folderId: presetFolder,
    buildingId: bound?.buildingId || (buildingFilter.value && buildingFilter.value !== '__none__' ? buildingFilter.value : ''),
    title: '', caption: '', current: null,
  })
}

/** 选了绑定建筑的文件夹 → 自动把建筑也选上 */
function onDialogFolderChange() {
  const f = folders.value.find((x) => String(x.id) === dialog.folderId)
  if (f?.buildingId) dialog.buildingId = f.buildingId
}

function openEdit(photo) {
  queue.value = []
  Object.assign(dialog, {
    open: true, id: photo.id,
    folderId: photo.folderId ? String(photo.folderId) : '',
    buildingId: photo.buildingId || '',
    title: photo.title || '', caption: photo.caption || '',
    current: photo,
  })
}
function closeDialog() {
  if (busy.value) return
  dialog.open = false
  queue.value = []
}

const footHint = computed(() => {
  if (dialog.id) return '只改信息，不会重新压缩图片'
  const ready = queue.value.filter((q) => q.status === 'done').length
  const failed = queue.value.filter((q) => q.status === 'error').length
  if (!queue.value.length) return `目标大小约 ${formatBytes(PHOTO_TARGET_BYTES)}/张`
  return `${ready} 张已就绪${failed ? `，${failed} 张失败` : ''}`
})

function onPick(event) {
  addFiles(Array.from(event.target.files || []))
  event.target.value = ''
}
let dragDepth = 0
function onDragEnter(event) {
  if (!event.dataTransfer?.types?.includes('Files')) return
  dragDepth += 1
  dragOver.value = true
}
function onDragOver(event) {
  if (!event.dataTransfer?.types?.includes('Files')) return
  event.dataTransfer.dropEffect = 'copy'
  dragOver.value = true
}
function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dragOver.value = false
}
function onDrop(event) {
  dragDepth = 0
  dragOver.value = false
  addFiles(Array.from(event.dataTransfer?.files || []))
}
async function addFiles(files) {
  const images = files.filter((f) => f.type.startsWith('image/'))
  if (!images.length) {
    notify('请选择图片文件', 'error')
    return
  }
  for (const file of images) {
    const item = reactive({
      key: `q${keySeed++}`,
      name: file.name,
      status: 'working',
      preview: URL.createObjectURL(file),
      dataUrl: '',
      thumb: '',
      sizeBytes: 0,
      origBytes: file.size,
      compressed: false,
      error: '',
    })
    queue.value.push(item)
    processItem(item, file)
  }
}
async function processItem(item, file) {
  try {
    const result = await compressPhoto(file)
    item.dataUrl = result.dataUrl
    item.thumb = await makeThumbDataUrl(result.blob)
    item.sizeBytes = result.sizeBytes
    item.origBytes = result.origBytes
    item.compressed = result.compressed
    item.status = 'done'
  } catch (error) {
    item.status = 'error'
    item.error = error.message
  }
}

function photoBody(dataUrl, thumb) {
  return {
    dataUrl,
    thumbDataUrl: thumb || undefined,
    folderId: dialog.folderId ? Number(dialog.folderId) : null,
    buildingId: dialog.buildingId || null,
    title: dialog.title || '',
    caption: dialog.caption || '',
    source: 'admin',
  }
}

async function submitUpload() {
  const ready = queue.value.filter((q) => q.status === 'done')
  if (!ready.length) return
  busy.value = true
  let ok = 0
  let fail = 0
  for (const item of ready) {
    try {
      const body = photoBody(item.dataUrl, item.thumb)
      if (!body.title) body.title = item.name.replace(/\.[^.]+$/, '')
      await api('/album/photos', { method: 'POST', body })
      item.status = 'uploaded'
      ok += 1
    } catch {
      fail += 1
    }
  }
  busy.value = false
  if (ok) notify(`已上传 ${ok} 张${fail ? `，${fail} 张失败` : ''}`, fail ? 'error' : 'success')
  dialog.open = false
  queue.value = []
  await Promise.all([loadFolders(), loadPhotos()])
}

async function submitEdit() {
  if (!dialog.id) return
  busy.value = true
  try {
    const data = await api(`/album/photos/${dialog.id}`, {
      method: 'PUT',
      body: {
        folderId: dialog.folderId ? Number(dialog.folderId) : null,
        buildingId: dialog.buildingId || null,
        title: dialog.title,
        caption: dialog.caption,
      },
    })
    const idx = photos.value.findIndex((p) => p.id === dialog.id)
    if (idx >= 0 && data.item) photos.value[idx] = data.item
    notify('已保存')
    dialog.open = false
    await loadFolders()
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    busy.value = false
  }
}

/* ---------------- 拖动排序（指针事件，桌面/触屏都能用） ---------------- */
const dragId = ref(null)
const dropId = ref(null)
const dragDx = ref(0)
const dragDy = ref(0)
let dragStart = null
let dragMoved = false

function onPointerDown(photo, index, event) {
  if (!sortMode.value) return
  if (event.button !== undefined && event.button !== 0) return
  dragId.value = photo.id
  dragStart = { x: event.clientX, y: event.clientY }
  dragMoved = false
  dragDx.value = 0
  dragDy.value = 0
  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp, { once: true })
}

function onPointerMove(event) {
  if (!dragId.value || !dragStart) return
  const dx = event.clientX - dragStart.x
  const dy = event.clientY - dragStart.y
  if (!dragMoved && Math.abs(dx) + Math.abs(dy) > 5) dragMoved = true
  if (!dragMoved) return
  dragDx.value = dx
  dragDy.value = dy
  const under = document.elementFromPoint(event.clientX, event.clientY)
  const card = under?.closest?.('.photo-card')
  dropId.value = card ? Number(card.dataset.photoId) : null
}

async function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  const movedId = dragId.value
  const targetId = dropId.value
  const moved = dragMoved
  dragId.value = null
  dropId.value = null
  dragStart = null
  dragDx.value = 0
  dragDy.value = 0
  dragMoved = false
  if (!moved || !movedId || !targetId || movedId === targetId) return
  await applyReorder(movedId, targetId)
}

/** 把 movedId 插到 targetId 的位置，并把新顺序写回后端 */
async function applyReorder(movedId, targetId) {
  const list = [...filtered.value]
  const from = list.findIndex((p) => p.id === movedId)
  const to = list.findIndex((p) => p.id === targetId)
  if (from < 0 || to < 0) return
  const [item] = list.splice(from, 1)
  list.splice(to, 0, item)
  list.forEach((p, i) => { p.sortOrder = (i + 1) * 10 })
  try {
    await api('/album/photos/reorder', {
      method: 'POST',
      body: {
        folderId: folderId.value && folderId.value !== '__none__' ? Number(folderId.value) : null,
        ids: list.map((p) => p.id),
      },
    })
    notify('顺序已保存')
  } catch (error) {
    notify(error.message, 'error')
    await loadPhotos()
  }
}

/** 排序模式下也提供按钮方式：把某张往前/往后移一位 */
async function nudge(photo, delta) {
  const list = [...filtered.value]
  const i = list.findIndex((p) => p.id === photo.id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= list.length) return
  // 目标换成相邻那张
  await applyReorder(photo.id, list[j].id)
}

/* ---------------- 批量 / 删除 ---------------- */
function toggleSelect(id) {
  const idx = selected.value.indexOf(id)
  if (idx >= 0) selected.value.splice(idx, 1)
  else selected.value.push(id)
}

async function batchAssign() {
  if (!selected.value.length) return
  const name = window.prompt('把这些照片挂到哪栋建筑？（输入建筑名称的关键词）', '')
  if (!name) return
  const match = buildings.value.find((b) => b.name.includes(name))
  if (!match) {
    notify('没有匹配的建筑', 'error')
    return
  }
  busy.value = true
  try {
    for (const id of selected.value) {
      await api(`/album/photos/${id}`, { method: 'PUT', body: { buildingId: match.id } })
    }
    notify(`已改挂到「${match.name}」`)
    selected.value = []
    await Promise.all([loadFolders(), loadPhotos()])
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function batchRemove() {
  if (!selected.value.length) return
  if (!window.confirm(`删除选中的 ${selected.value.length} 张照片？`)) return
  busy.value = true
  try {
    for (const id of selected.value) {
      await api(`/album/photos/${id}`, { method: 'DELETE' })
    }
    notify('已删除')
    selected.value = []
    await Promise.all([loadFolders(), loadPhotos()])
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    busy.value = false
  }
}

async function removePhoto(photo) {
  if (!window.confirm(`删除照片「${photo.title || '未命名'}」？`)) return
  try {
    await api(`/album/photos/${photo.id}`, { method: 'DELETE' })
    selected.value = selected.value.filter((id) => id !== photo.id)
    notify('已删除')
    await Promise.all([loadFolders(), loadPhotos()])
  } catch (error) {
    notify(error.message, 'error')
  }
}
</script>

<style scoped>
.album-view { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow: hidden; }

/* 顶部 */
.av-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; padding: 20px 24px 16px; border-bottom: 1px solid rgba(27,67,50,0.09); background: rgba(255,255,255,0.55); flex-wrap: wrap; }
.av-top-text h2 { font-family: 'Noto Serif SC', serif; font-size: 19px; font-weight: 900; color: var(--primary, #1B4332); margin: 0 0 4px; }
.av-top-text p { font-size: 12px; color: var(--fg-muted, #6B6B80); line-height: 1.6; margin: 0; max-width: 620px; }
.av-top-actions { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
.av-stat { font-size: 11.5px; color: var(--fg-muted, #6B6B80); background: rgba(216,243,220,0.6); border-radius: 8px; padding: 5px 10px; }
.av-stat b { color: var(--primary, #1B4332); font-size: 13px; font-variant-numeric: tabular-nums; }
.spin { animation: spin 0.9s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.av-body { flex: 1; min-height: 0; display: flex; gap: 0; overflow: hidden; }

/* 左侧文件夹 */
.av-side { width: 248px; flex-shrink: 0; border-right: 1px solid rgba(27,67,50,0.08); background: rgba(255,255,255,0.4); display: flex; flex-direction: column; overflow-y: auto; padding: 12px 10px 16px; }
.av-side-head { display: flex; align-items: center; justify-content: space-between; padding: 2px 6px 8px; font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #9a7a3c; text-transform: uppercase; }
.rail-search { position: relative; padding: 0 4px 8px; }
.rail-search > i { position: absolute; left: 16px; top: 50%; transform: translateY(-60%); font-size: 11px; color: var(--fg-muted, #6B6B80); pointer-events: none; }
.rail-search-input { width: 100%; box-sizing: border-box; padding: 7px 28px 7px 30px; border-radius: 8px; border: 1px solid rgba(27,67,50,0.14); background: #fff; font-family: inherit; font-size: 12px; outline: none; }
.rail-search-input:focus { border-color: var(--primary-light, #2D6A4F); box-shadow: 0 0 0 3px rgba(45,106,79,0.1); }
.rail-search-clear { position: absolute; right: 10px; top: 50%; transform: translateY(-60%); border: none; background: none; color: var(--fg-muted, #6B6B80); cursor: pointer; font-size: 11px; padding: 3px; }
.folder-form { display: flex; flex-direction: column; gap: 6px; padding: 8px 6px 10px; }
.folder-tabs { display: flex; gap: 4px; padding: 0 4px 8px; }
.folder-tab {
  flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 4px;
  padding: 5px 8px; border-radius: 7px; border: 1px solid rgba(27,67,50,0.12);
  background: rgba(255,255,255,0.7); font-family: inherit; font-size: 11px; font-weight: 600;
  color: var(--fg-muted, #6B6B80); cursor: pointer; transition: background 0.16s, color 0.16s, border-color 0.16s;
}
.folder-tab em { font-style: normal; font-size: 9.5px; opacity: 0.75; font-variant-numeric: tabular-nums; }
.folder-tab:hover { border-color: rgba(45,106,79,0.3); color: var(--primary, #1B4332); }
.folder-tab.active { background: rgba(216,243,220,0.9); border-color: rgba(45,106,79,0.35); color: var(--primary, #1B4332); }
.folder-form-actions { display: flex; justify-content: flex-end; gap: 6px; }
.folder-list { display: flex; flex-direction: column; gap: 2px; }
.folder-empty { padding: 14px 8px; font-size: 11px; color: var(--fg-muted, #6B6B80); text-align: center; }
.folder-item {
  display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 9px; border-radius: 8px;
  border: none; background: transparent; font-family: inherit; font-size: 12.5px; color: var(--fg, #1A1A2E);
  cursor: pointer; text-align: left; transition: background 0.16s;
}
.folder-item i { font-size: 11px; color: var(--accent, #D4A853); width: 14px; flex-shrink: 0; }
.folder-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.folder-count { font-style: normal; font-size: 10.5px; color: var(--fg-muted, #6B6B80); font-variant-numeric: tabular-nums; }
.folder-item:hover { background: rgba(216,243,220,0.5); }
.folder-item.active { background: var(--primary, #1B4332); color: #fff; }
.folder-item.active i, .folder-item.active .folder-count { color: rgba(255,255,255,0.8); }
.folder-ops { display: none; gap: 2px; }
.folder-item:hover .folder-ops { display: flex; }
.folder-item.active .folder-ops { display: flex; }
.av-side-tip { margin: 12px 6px 0; font-size: 10.5px; color: var(--fg-muted, #6B6B80); line-height: 1.6; }
.av-side-tip i { color: var(--accent, #D4A853); }

/* 主区 */
.av-main { flex: 1; min-width: 0; display: flex; flex-direction: column; overflow-y: auto; padding: 14px 20px 30px; }
.av-toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
.av-sel-count { display: inline-flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--primary, #1B4332); background: rgba(216,243,220,0.7); border-radius: 8px; padding: 4px 4px 4px 11px; }
.sort-hint { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 8px 12px; border-radius: 9px; background: rgba(246,236,214,0.6); border: 1px dashed rgba(212,168,83,0.55); font-size: 11.5px; color: #8A6320; }
.sort-hint i { font-size: 11px; }
.sort-hint .btn { margin-left: auto; }
.av-loading { padding: 40px; text-align: center; font-size: 12.5px; color: var(--fg-muted, #6B6B80); }
.av-empty { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 60px 20px; border: 1px dashed rgba(27,67,50,0.16); border-radius: 14px; background: rgba(255,255,255,0.45); }
.av-empty i { font-size: 30px; color: rgba(27,67,50,0.22); }
.av-empty p { font-size: 12.5px; color: var(--fg-muted, #6B6B80); margin: 0; }

.photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(178px, 1fr)); gap: 12px; }
.photo-grid.sorting { gap: 14px; }
.photo-card { position: relative; border-radius: 12px; overflow: hidden; border: 1px solid rgba(27,67,50,0.09); background: #fff; cursor: pointer; transition: box-shadow 0.2s, transform 0.2s, border-color 0.2s; }
.photo-card:hover { transform: translateY(-2px); box-shadow: 0 10px 24px rgba(27,67,50,0.13); border-color: rgba(45,106,79,0.3); }
.photo-card.picked { border-color: var(--primary, #1B4332); box-shadow: 0 0 0 2px rgba(27,67,50,0.22); }
.photo-grid.sorting .photo-card { cursor: grab; }
.photo-grid.sorting .photo-card:active { cursor: grabbing; }
.photo-grid.sorting .photo-card:hover { transform: none; }
.photo-card.dragging { opacity: 0.9; box-shadow: 0 16px 40px rgba(27,67,50,0.28); pointer-events: none; }
.photo-card.drop-target { border-color: var(--accent, #D4A853); box-shadow: 0 0 0 2px rgba(212,168,83,0.55); }
.photo-thumb { position: relative; aspect-ratio: 4 / 3; background: #EDE6D8; }
.photo-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.photo-check { position: absolute; top: 7px; left: 7px; width: 19px; height: 19px; border-radius: 6px; border: 1.5px solid rgba(255,255,255,0.85); background: rgba(0,0,0,0.22); display: flex; align-items: center; justify-content: center; color: transparent; font-size: 10px; }
.photo-card.picked .photo-check { background: var(--primary, #1B4332); border-color: var(--primary, #1B4332); color: #fff; }
.photo-order { position: absolute; top: 7px; left: 7px; min-width: 20px; height: 20px; padding: 0 5px; border-radius: 6px; background: rgba(27,67,50,0.82); color: #fff; font-size: 10.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; font-variant-numeric: tabular-nums; }
.photo-size { position: absolute; right: 6px; bottom: 6px; font-size: 9.5px; color: #fff; background: rgba(10,26,19,0.6); border-radius: 5px; padding: 1px 5px; font-variant-numeric: tabular-nums; }
.photo-meta { padding: 8px 10px 9px; }
.photo-title { font-size: 12.5px; font-weight: 600; color: var(--fg, #1A1A2E); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.photo-sub { margin-top: 3px; font-size: 10px; color: var(--fg-muted, #6B6B80); display: flex; align-items: center; gap: 4px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.tag-building { color: var(--primary, #1B4332); background: rgba(216,243,220,0.8); border-radius: 4px; padding: 0 4px; }
.tag-building.none { color: #9a7a3c; background: rgba(212,168,83,0.16); }
.dot { opacity: 0.5; }
.photo-ops { position: absolute; top: 6px; right: 6px; display: none; gap: 3px; }
.photo-card:hover .photo-ops { display: flex; }
.photo-grid.sorting .photo-ops { display: none !important; }
.photo-sortbar {
  display: flex; align-items: center; justify-content: space-between; gap: 4px;
  padding: 5px 6px; background: rgba(246,236,214,0.6); border-top: 1px solid rgba(212,168,83,0.28);
  font-size: 10px; color: #8A6320; font-weight: 600;
}
.photo-sortbar .mini-btn { width: 22px; height: 22px; font-size: 9.5px; background: rgba(255,255,255,0.9); }
.photo-sortbar .mini-btn:disabled { opacity: 0.35; }

/* 弹窗 */
.av-modal-mask { position: fixed; inset: 0; z-index: 200; background: rgba(15,24,20,0.55); backdrop-filter: blur(3px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.av-modal { width: min(680px, 100%); max-height: calc(100vh - 60px); display: flex; flex-direction: column; background: #FDFBF6; border-radius: 16px; box-shadow: 0 30px 70px rgba(0,0,0,0.32); overflow: hidden; }
.av-modal-head { display: flex; align-items: center; justify-content: space-between; padding: 15px 18px; border-bottom: 1px solid rgba(27,67,50,0.09); }
.av-modal-head h3 { margin: 0; font-family: 'Noto Serif SC', serif; font-size: 16px; color: var(--primary, #1B4332); }
.av-modal-body { padding: 16px 18px; overflow-y: auto; }
.av-modal-foot { display: flex; align-items: center; gap: 9px; padding: 12px 18px; border-top: 1px solid rgba(27,67,50,0.09); background: rgba(255,255,255,0.6); }
.foot-hint { flex: 1; font-size: 11px; color: var(--fg-muted, #6B6B80); }

.drop-zone { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 26px 18px; border: 1.5px dashed rgba(27,67,50,0.22); border-radius: 12px; background: rgba(255,255,255,0.55); text-align: center; transition: background 0.2s, border-color 0.2s; }
.drop-zone.over { border-color: var(--primary, #1B4332); background: rgba(216,243,220,0.55); }
.drop-zone > i { font-size: 24px; color: rgba(27,67,50,0.35); }
.drop-zone p { font-size: 12.5px; color: var(--fg, #1A1A2E); margin: 0; }
.drop-zone small { font-size: 10.5px; color: var(--fg-muted, #6B6B80); }
.hidden-file { display: none; }
.link-btn { border: none; background: none; color: var(--primary-light, #2D6A4F); font-family: inherit; font-size: 12.5px; font-weight: 700; cursor: pointer; text-decoration: underline; padding: 0; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
.field { display: flex; flex-direction: column; gap: 4px; font-size: 11px; color: var(--fg-muted, #6B6B80); }
.field > span { font-weight: 600; letter-spacing: 0.02em; }
.inp { width: 100%; box-sizing: border-box; padding: 8px 10px; border-radius: 8px; border: 1px solid rgba(27,67,50,0.16); background: #fff; font-family: inherit; font-size: 12.5px; color: var(--fg, #1A1A2E); outline: none; transition: border-color 0.18s, box-shadow 0.18s; }
.inp:focus { border-color: var(--primary-light, #2D6A4F); box-shadow: 0 0 0 3px rgba(45,106,79,0.12); }
.inp.search { max-width: 200px; }
.inp.select { max-width: 180px; background: #fff; }

.queue { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; max-height: 240px; overflow-y: auto; }
.queue-row { display: flex; align-items: center; gap: 9px; padding: 7px 9px; border-radius: 9px; background: rgba(255,255,255,0.75); border: 1px solid rgba(27,67,50,0.07); }
.queue-row.error { border-color: rgba(200,60,60,0.3); background: rgba(253,237,236,0.7); }
.queue-thumb { width: 42px; height: 42px; border-radius: 7px; object-fit: cover; flex-shrink: 0; background: #EDE6D8; }
.queue-thumb.placeholder { display: flex; align-items: center; justify-content: center; color: rgba(27,67,50,0.3); }
.queue-info { flex: 1; min-width: 0; }
.queue-name { font-size: 12px; color: var(--fg, #1A1A2E); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.queue-sub { font-size: 10.5px; color: var(--fg-muted, #6B6B80); margin-top: 2px; font-variant-numeric: tabular-nums; }
.queue-sub em { font-style: normal; opacity: 0.8; }
.queue-sub .ok, .ok { color: #1d7a4f; }
.err { color: #b23b3b; }
.single-preview { margin-top: 12px; }
.single-preview img { max-width: 100%; max-height: 260px; border-radius: 10px; display: block; margin: 0 auto; }

/* 按钮 */
.btn { display: inline-flex; align-items: center; gap: 5px; padding: 8px 14px; border-radius: 9px; border: 1px solid transparent; font-family: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: background 0.18s, color 0.18s, border-color 0.18s, opacity 0.18s; }
.btn.sm { padding: 5px 10px; font-size: 11.5px; }
.btn.primary { background: var(--primary, #1B4332); color: #fff; }
.btn.primary:hover { background: var(--primary-light, #2D6A4F); }
.btn.ghost { background: rgba(255,255,255,0.8); color: var(--primary, #1B4332); border-color: rgba(27,67,50,0.18); }
.btn.ghost:hover { background: rgba(216,243,220,0.75); }
.btn.danger { background: rgba(200,60,60,0.1); color: #b23b3b; border-color: rgba(200,60,60,0.24); }
.btn.danger:hover { background: #b23b3b; color: #fff; }
.btn:disabled { opacity: 0.5; cursor: not-allowed; }
.mini-btn { width: 24px; height: 24px; border-radius: 6px; border: none; background: rgba(27,67,50,0.06); color: var(--fg-muted, #6B6B80); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 10.5px; text-decoration: none; transition: background 0.16s, color 0.16s; }
.mini-btn:hover { background: rgba(27,67,50,0.14); color: var(--primary, #1B4332); }
.mini-btn.danger:hover { background: rgba(200,60,60,0.16); color: #b23b3b; }

@media (max-width: 900px) {
  .av-body { flex-direction: column; }
  .av-side { width: auto; border-right: none; border-bottom: 1px solid rgba(27,67,50,0.08); max-height: 40vh; }
  .folder-list { flex-direction: row; flex-wrap: wrap; gap: 5px; }
  .folder-item { width: auto; padding: 6px 10px; }
  .folder-ops { display: none !important; }
  .av-main { padding: 12px 12px 26px; }
  .photo-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
  .form-grid { grid-template-columns: 1fr; }
  .inp.search, .inp.select { max-width: 100%; flex: 1; }
}
</style>