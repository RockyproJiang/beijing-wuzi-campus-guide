<template>
  <div>
    <div class="a-toolbar">
      <input v-model="search" class="a-input" placeholder="搜索建筑名称、副标题或 ID…" />
      <select v-model="categoryId" class="a-select">
        <option value="">全部分类</option>
        <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
      </select>
      <span class="a-small a-muted">共 {{ total }} 条</span>
      <div class="a-spacer"></div>
      <button class="a-btn a-btn-primary" @click="openCreate">
        <i class="fa-solid fa-plus"></i> 新建建筑
      </button>
    </div>

    <div class="a-card">
      <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载建筑…</div>
      <div v-else-if="!items.length" class="a-empty">
        <i class="fa-solid fa-building-circle-xmark"></i>
        <p>没有找到建筑</p>
      </div>
      <table v-else class="a-table">
        <thead>
          <tr>
            <th style="width:40%;">建筑</th>
            <th>分类</th>
            <th>3D / 标记</th>
            <th>更新时间</th>
            <th style="text-align:right;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(b, index) in items" :key="b.id">
            <td>
              <div class="b-cell">
                <span class="b-icon" :style="{ background: b.bgColor, color: b.color }">
                  <i :class="b.icon"></i>
                </span>
                <div class="b-text">
                  <div class="name">{{ b.name }}</div>
                  <div class="sub">{{ b.sub || '—' }} · #{{ b.id }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="a-tag" :style="{ background: b.bgColor, color: b.color, borderColor: b.color + '33' }">
                {{ b.categoryName }}
              </span>
            </td>
            <td>
              <span v-if="b.modelObjects?.length" class="a-badge on">
                <i class="fa-solid fa-cube"></i> 3D ×{{ b.modelObjects.length }}
              </span>
              <span v-else-if="b.pin" class="a-badge on">
                <i class="fa-solid fa-location-dot"></i> 标记
              </span>
              <span v-else class="a-badge off">未定位 3D</span>
              <span v-if="b.mapHidden" class="a-badge" style="margin-left:4px;">已隐藏</span>
            </td>
            <td class="a-small a-muted">{{ formatTime(b.updatedAt) }}</td>
            <td>
              <div class="actions">
                <button
                  v-if="canReorder"
                  class="a-btn a-btn-sm a-btn-icon"
                  :disabled="index === 0"
                  title="上移"
                  @click="move(index, -1)"
                ><i class="fa-solid fa-arrow-up"></i></button>
                <button
                  v-if="canReorder"
                  class="a-btn a-btn-sm a-btn-icon"
                  :disabled="index === items.length - 1"
                  title="下移"
                  @click="move(index, 1)"
                ><i class="fa-solid fa-arrow-down"></i></button>
                <button class="a-btn a-btn-sm" @click="openEdit(b)"><i class="fa-solid fa-pen"></i> 编辑</button>
                <button class="a-btn a-btn-sm a-btn-danger" @click="askDelete(b)"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="canReorder" class="a-hint" style="margin-top:8px;">
      <i class="fa-solid fa-arrows-up-down"></i>
      当前按分类排序；用上下箭头调整该分类内建筑在前台列表中的顺序。
    </div>

    <BuildingEditor
      v-if="editorOpen"
      :building="editing"
      :categories="categories"
      :object-options="objectOptions"
      :default-category-id="categoryId || categories[0]?.id || ''"
      @close="editorOpen = false"
      @saved="onSaved"
    />

    <div v-if="deleting" class="a-modal-backdrop" @click.self="deleting = null">
      <div class="a-modal slim">
        <div class="a-modal-head">
          <div>
            <div class="a-modal-title">删除建筑</div>
            <div class="a-modal-sub">删除后进入回收站，可随时恢复</div>
          </div>
          <button class="a-close" @click="deleting = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">
          确定要删除 <strong>{{ deleting.name }}</strong> 吗？前台的设施速查和 3D 点击都会立即不再显示它。
        </div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="deleting = null">取消</button>
          <button class="a-btn a-btn-danger" :disabled="saving" @click="remove">
            {{ saving ? '删除中…' : '移入回收站' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { api, formatTime } from './api.js'
import BuildingEditor from './BuildingEditor.vue'
import { MANIFEST_URL } from '../modelVersion.js'

const notify = inject('notify', () => {})
const categories = ref([])
const items = ref([])
const total = ref(0)
const loading = ref(true)
const saving = ref(false)
const search = ref('')
const categoryId = ref('')
const editorOpen = ref(false)
const editing = ref(null)
const deleting = ref(null)
const objectOptions = ref([])

const canReorder = computed(() => Boolean(categoryId.value) && !search.value.trim())

let searchTimer = 0
watch(search, () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(load, 260)
})
watch(categoryId, load)

async function loadCategories() {
  try {
    const result = await api('/categories')
    categories.value = result.items
  } catch (error) {
    notify(error.message, 'error')
  }
}

async function loadManifest() {
  try {
    const res = await fetch(MANIFEST_URL)
    if (!res.ok) return
    const data = await res.json()
    objectOptions.value = data.objects || []
  } catch {
    /* ignore */
  }
}

async function load() {
  loading.value = true
  try {
    const params = new URLSearchParams({ limit: '500' })
    if (categoryId.value) params.set('category', categoryId.value)
    if (search.value.trim()) params.set('q', search.value.trim())
    const result = await api('/buildings?' + params.toString())
    items.value = result.items
    total.value = result.total
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  editorOpen.value = true
}

function openEdit(b) {
  editing.value = b
  editorOpen.value = true
}

function onSaved() {
  editorOpen.value = false
  editing.value = null
  notify('建筑已保存')
  load()
}

function askDelete(b) {
  deleting.value = b
}

async function remove() {
  if (!deleting.value) return
  saving.value = true
  try {
    await api(`/buildings/${deleting.value.id}`, { method: 'DELETE' })
    notify('已移入回收站')
    deleting.value = null
    await load()
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    saving.value = false
  }
}

async function move(index, delta) {
  if (!canReorder.value) return
  const next = index + delta
  if (next < 0 || next >= items.value.length) return
  const list = [...items.value]
  ;[list[index], list[next]] = [list[next], list[index]]
  items.value = list
  try {
    await api('/buildings/reorder', {
      method: 'POST',
      body: { categoryId: categoryId.value, ids: list.map((b) => b.id) },
    })
    notify('排序已保存')
  } catch (error) {
    notify(error.message, 'error')
    await load()
  }
}

onMounted(async () => {
  await Promise.all([loadCategories(), loadManifest()])
  await load()
})

// 支持从「位置投稿」和「相册」直接跳到某栋建筑的编辑器
async function openById(id) {
  if (!id) return
  try {
    const result = await api('/buildings/' + encodeURIComponent(id))
    const building = result.item || result
    if (building?.id) openEdit(building)
    else notify('没有找到该建筑', 'error')
  } catch (error) {
    notify(error.message, 'error')
  }
}

defineExpose({ openById })

function onExternalEdit(event) {
  const id = event?.detail?.id
  if (id) openById(id)
}

onMounted(() => window.addEventListener('admin:edit-building', onExternalEdit))
onBeforeUnmount(() => window.removeEventListener('admin:edit-building', onExternalEdit))
</script>

<style scoped>
.b-cell { display: flex; align-items: center; gap: 9px; min-width: 0; }
.b-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.b-text { min-width: 0; }
.b-text .name { font-weight: 700; font-size: 12.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.b-text .sub { font-size: 10px; color: var(--a-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
</style>
