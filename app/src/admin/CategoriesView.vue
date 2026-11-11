<template>
  <div>
    <div class="a-toolbar">
      <div class="a-small a-muted">
        共 {{ items.length }} 个分类 · 分类顺序会直接影响前台筛选标签的顺序
      </div>
      <div class="a-spacer"></div>
      <button class="a-btn a-btn-primary" @click="openCreate">
        <i class="fa-solid fa-plus"></i> 新建分类
      </button>
    </div>

    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载分类…</div>
    <div v-else class="cat-grid">
      <div v-for="(cat, index) in items" :key="cat.id" class="cat-card">
        <div class="cat-top">
          <div class="cat-icon" :style="{ background: cat.bgColor, color: cat.color }">
            <i :class="cat.icon"></i>
          </div>
          <div class="cat-info">
            <div class="cat-name">{{ cat.name }}</div>
            <div class="cat-id">#{{ cat.id }}</div>
          </div>
          <div class="cat-order">
            <button class="a-btn a-btn-sm a-btn-icon" :disabled="index === 0" title="上移" @click="move(index, -1)">
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button class="a-btn a-btn-sm a-btn-icon" :disabled="index === items.length - 1" title="下移" @click="move(index, 1)">
              <i class="fa-solid fa-arrow-down"></i>
            </button>
          </div>
        </div>
        <div class="cat-meta">
          <span class="a-tag"><i class="fa-solid fa-building"></i> {{ cat.buildingCount ?? 0 }} 个建筑</span>
          <span class="a-tag" :style="{ background: cat.bgColor, color: cat.color, borderColor: cat.color + '33' }">
            {{ cat.color }}
          </span>
        </div>
        <div class="cat-actions">
          <button class="a-btn a-btn-sm" @click="openEdit(cat)"><i class="fa-solid fa-pen"></i> 编辑</button>
          <button
            v-if="confirmId !== cat.id"
            class="a-btn a-btn-sm a-btn-danger"
            @click="confirmId = cat.id"
          ><i class="fa-solid fa-trash"></i> 删除</button>
          <template v-else>
            <button class="a-btn a-btn-sm" @click="confirmId = ''">取消</button>
            <button class="a-btn a-btn-sm a-btn-danger" :disabled="saving" @click="remove(cat)">
              {{ saving ? '删除中…' : '确认删除' }}
            </button>
          </template>
        </div>
      </div>
      <button class="cat-add" @click="openCreate">
        <i class="fa-solid fa-plus"></i>
        <span>新建分类</span>
      </button>
    </div>

    <div v-if="modalOpen" class="a-modal-backdrop" @click.self="closeModal">
      <div class="a-modal slim">
        <div class="a-modal-head">
          <div>
            <div class="a-modal-title">{{ editing ? '编辑分类' : '新建分类' }}</div>
            <div class="a-modal-sub">分类 ID 创建后不可修改</div>
          </div>
          <button class="a-close" @click="closeModal"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">
          <div v-if="error" class="a-login-error">{{ error }}</div>
          <div class="a-grid" style="gap:13px;">
            <label class="a-field">
              <span class="a-label">分类 ID</span>
              <input
                v-model="form.id"
                class="a-input"
                :disabled="!!editing"
                placeholder="例如 security（小写字母开头）"
              />
            </label>
            <label class="a-field">
              <span class="a-label">分类名称</span>
              <input v-model="form.name" class="a-input" placeholder="例如 安保与后勤" />
            </label>
            <div class="a-grid" style="grid-template-columns:1fr 1fr;gap:12px;">
              <label class="a-field">
                <span class="a-label">图标（Font Awesome）</span>
                <div class="icon-row">
                  <span class="icon-preview" :style="{ background: form.bgColor, color: form.color }">
                    <i :class="form.icon"></i>
                  </span>
                  <input v-model="form.icon" class="a-input" list="fa-icon-list" />
                </div>
              </label>
              <div class="a-grid" style="grid-template-columns:1fr 1fr;gap:8px;">
                <label class="a-field">
                  <span class="a-label">背景色</span>
                  <input v-model="form.bgColor" class="a-input" type="color" />
                </label>
                <label class="a-field">
                  <span class="a-label">文字色</span>
                  <input v-model="form.color" class="a-input" type="color" />
                </label>
              </div>
            </div>
          </div>
          <div class="a-hint" style="margin-top:10px;">
            图标可以从 Font Awesome 官网复制 class 名，例如 <code>fa-solid fa-shield-halved</code>。
          </div>
        </div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="closeModal">取消</button>
          <button class="a-btn a-btn-primary" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <datalist id="fa-icon-list">
      <option v-for="icon in iconOptions" :key="icon" :value="icon"></option>
    </datalist>
  </div>
</template>

<script setup>
import { inject, onMounted, reactive, ref } from 'vue'
import { api } from './api.js'

const notify = inject('notify', () => {})
const items = ref([])
const loading = ref(true)
const saving = ref(false)
const confirmId = ref('')
const modalOpen = ref(false)
const editing = ref(null)
const error = ref('')

const form = reactive({
  id: '',
  name: '',
  icon: 'fa-solid fa-building',
  bgColor: '#D8F3DC',
  color: '#1B4332',
})

const iconOptions = [
  'fa-solid fa-building', 'fa-solid fa-building-columns', 'fa-solid fa-school', 'fa-solid fa-house',
  'fa-solid fa-bed', 'fa-solid fa-utensils', 'fa-solid fa-futbol', 'fa-solid fa-store',
  'fa-solid fa-door-open', 'fa-solid fa-square-parking', 'fa-solid fa-shield-halved',
  'fa-solid fa-notes-medical', 'fa-solid fa-book', 'fa-solid fa-tree', 'fa-solid fa-star',
  'fa-solid fa-flask', 'fa-solid fa-landmark', 'fa-solid fa-gears', 'fa-solid fa-graduation-cap',
  'fa-solid fa-cat', 'fa-solid fa-paw', 'fa-solid fa-camera-retro', 'fa-solid fa-calendar-star',
  'fa-solid fa-map-location-dot', 'fa-solid fa-seedling', 'fa-solid fa-leaf', 'fa-solid fa-music',
]

async function load() {
  loading.value = true
  try {
    const result = await api('/categories')
    items.value = result.items
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  error.value = ''
  Object.assign(form, {
    id: '',
    name: '',
    icon: 'fa-solid fa-building',
    bgColor: '#D8F3DC',
    color: '#1B4332',
  })
  modalOpen.value = true
}

function openEdit(cat) {
  editing.value = cat
  error.value = ''
  Object.assign(form, {
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    bgColor: cat.bgColor,
    color: cat.color,
  })
  modalOpen.value = true
}

function closeModal() {
  if (saving.value) return
  modalOpen.value = false
}

async function save() {
  error.value = ''
  if (!editing.value && !/^[a-z][a-z0-9_-]{1,31}$/.test(form.id)) {
    error.value = '分类 ID 需为小写字母开头，可含数字、- 和 _，长度 2-32'
    return
  }
  if (!form.name.trim()) {
    error.value = '请填写分类名称'
    return
  }
  saving.value = true
  try {
    if (editing.value) {
      await api(`/categories/${editing.value.id}`, { method: 'PUT', body: form })
      notify('分类已更新')
    } else {
      await api('/categories', { method: 'POST', body: form })
      notify('分类已创建')
    }
    modalOpen.value = false
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

async function remove(cat) {
  saving.value = true
  try {
    await api(`/categories/${cat.id}`, { method: 'DELETE' })
    notify('分类已移入回收站')
    confirmId.value = ''
    await load()
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    saving.value = false
  }
}

async function move(index, delta) {
  const next = index + delta
  if (next < 0 || next >= items.value.length) return
  const list = [...items.value]
  ;[list[index], list[next]] = [list[next], list[index]]
  items.value = list
  try {
    await api('/categories/reorder', { method: 'POST', body: { ids: list.map((c) => c.id) } })
    notify('排序已保存')
  } catch (e) {
    notify(e.message, 'error')
    await load()
  }
}

onMounted(load)
</script>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 12px;
}
.cat-card {
  background: var(--a-card);
  border: 1px solid var(--a-border);
  border-radius: 13px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 11px;
  transition: box-shadow 0.2s, border-color 0.2s;
}
.cat-card:hover { border-color: rgba(45, 106, 79, 0.3); box-shadow: var(--a-shadow); }
.cat-top { display: flex; align-items: center; gap: 10px; }
.cat-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.cat-info { flex: 1; min-width: 0; }
.cat-name { font-size: 13.5px; font-weight: 700; color: var(--a-fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cat-id { font-size: 10px; color: var(--a-muted); font-family: ui-monospace, monospace; }
.cat-order { display: flex; flex-direction: column; gap: 3px; }
.cat-order .a-btn { width: 24px; height: 22px; padding: 0; font-size: 9px; }
.cat-meta { display: flex; gap: 5px; flex-wrap: wrap; }
.cat-actions { display: flex; gap: 5px; justify-content: flex-end; border-top: 1px dashed var(--a-bg-deep); padding-top: 10px; }
.cat-add {
  min-height: 176px;
  border: 1.5px dashed var(--a-border);
  background: rgba(255, 253, 248, 0.5);
  border-radius: 13px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--a-muted);
  font-size: 12px;
  transition: all 0.2s;
}
.cat-add i { font-size: 20px; }
.cat-add:hover { border-color: var(--a-primary-light); color: var(--a-primary); background: #fbf9f3; }
.icon-row { display: flex; align-items: center; gap: 7px; }
.icon-preview { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; }
</style>
