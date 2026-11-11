<template>
  <div>
    <div class="a-toolbar">
      <input v-model="filter" class="a-input" placeholder="搜索关键词…" />
      <span class="a-small a-muted">共 {{ filtered.length }} 个关键词</span>
      <div class="a-spacer"></div>
      <button class="a-btn a-btn-primary" @click="openCreate">
        <i class="fa-solid fa-plus"></i> 新建别名
      </button>
    </div>

    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载搜索别名…</div>
    <div v-else class="a-card">
      <table class="a-table">
        <thead>
          <tr>
            <th style="width:150px;">关键词</th>
            <th>指向建筑</th>
            <th style="width:120px;text-align:right;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filtered" :key="item.id">
            <td><span class="keyword">{{ item.keyword }}</span></td>
            <td>
              <div class="alias-buildings">
                <span v-for="id in item.ids" :key="id" class="a-tag a-tag-green">{{ buildingName(id) }}</span>
                <span v-if="!item.ids.length" class="a-small a-muted">未指定</span>
              </div>
            </td>
            <td>
              <div class="actions">
                <button class="a-btn a-btn-sm" @click="openEdit(item)"><i class="fa-solid fa-pen"></i> 编辑</button>
                <button class="a-btn a-btn-sm a-btn-danger" @click="askDelete(item)"><i class="fa-solid fa-trash"></i></button>
              </div>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="3"><div class="a-empty"><i class="fa-solid fa-magnifying-glass"></i><p>没有匹配的关键词</p></div></td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="modalOpen" class="a-modal-backdrop" @click.self="modalOpen = false">
      <div class="a-modal">
        <div class="a-modal-head">
          <div>
            <div class="a-modal-title">{{ editing ? '编辑搜索别名' : '新建搜索别名' }}</div>
            <div class="a-modal-sub">用户搜索关键词时，优先展示这里指定的建筑</div>
          </div>
          <button class="a-close" @click="modalOpen = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">
          <div v-if="error" class="a-login-error">{{ error }}</div>
          <label class="a-field">
            <span class="a-label">关键词</span>
            <input v-model="form.keyword" class="a-input" placeholder="例如 打印 / 快递 / 咖啡" />
          </label>

          <div class="a-label" style="margin:14px 0 6px;">指向建筑（可多选）</div>
          <input v-model="buildingSearch" class="a-input" placeholder="搜索建筑…" />
          <div class="building-grid">
            <label
              v-for="b in filteredBuildings"
              :key="b.id"
              class="building-item"
              :class="{ checked: form.ids.includes(b.id) }"
            >
              <input type="checkbox" :checked="form.ids.includes(b.id)" @change="toggle(b.id)" />
              <span class="bi-icon" :style="{ background: b.bgColor, color: b.color }"><i :class="b.icon"></i></span>
              <span class="bi-name">{{ b.name }}</span>
              <span class="bi-cat">{{ b.categoryName }}</span>
            </label>
          </div>
          <div class="a-hint" style="margin-top:6px;">已选 {{ form.ids.length }} 个建筑</div>
        </div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="modalOpen = false">取消</button>
          <button class="a-btn a-btn-primary" :disabled="saving" @click="save">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="deleting" class="a-modal-backdrop" @click.self="deleting = null">
      <div class="a-modal slim">
        <div class="a-modal-head">
          <div class="a-modal-title">删除关键词</div>
          <button class="a-close" @click="deleting = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">确定删除关键词 <strong>{{ deleting.keyword }}</strong> 吗？</div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="deleting = null">取消</button>
          <button class="a-btn a-btn-danger" @click="remove">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, onMounted, reactive, ref } from 'vue'
import { api } from './api.js'

const notify = inject('notify', () => {})
const loading = ref(true)
const saving = ref(false)
const items = ref([])
const buildings = ref([])
const filter = ref('')
const modalOpen = ref(false)
const editing = ref(null)
const deleting = ref(null)
const error = ref('')
const buildingSearch = ref('')

const form = reactive({ keyword: '', ids: [] })

const buildingMap = computed(() => {
  const map = new Map()
  for (const b of buildings.value) map.set(b.id, b)
  return map
})

const filtered = computed(() => {
  const q = filter.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((x) => x.keyword.toLowerCase().includes(q))
})

const filteredBuildings = computed(() => {
  const q = buildingSearch.value.trim().toLowerCase()
  if (!q) return buildings.value
  return buildings.value.filter((b) => `${b.name} ${b.sub} ${b.categoryName}`.toLowerCase().includes(q))
})

function buildingName(id) {
  return buildingMap.value.get(id)?.name || id
}

function toggle(id) {
  const i = form.ids.indexOf(id)
  if (i > -1) form.ids.splice(i, 1)
  else form.ids.push(id)
}

async function load() {
  loading.value = true
  try {
    const [aliasResult, buildingResult] = await Promise.all([
      api('/aliases'),
      api('/buildings?limit=500'),
    ])
    items.value = aliasResult.items
    buildings.value = buildingResult.items
  } catch (e) {
    notify(e.message, 'error')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  error.value = ''
  form.keyword = ''
  form.ids = []
  buildingSearch.value = ''
  modalOpen.value = true
}

function openEdit(item) {
  editing.value = item
  error.value = ''
  form.keyword = item.keyword
  form.ids = [...item.ids]
  buildingSearch.value = ''
  modalOpen.value = true
}

async function save() {
  error.value = ''
  if (!form.keyword.trim()) {
    error.value = '请填写关键词'
    return
  }
  saving.value = true
  try {
    const body = { keyword: form.keyword.trim(), ids: form.ids }
    if (editing.value) {
      await api(`/aliases/${editing.value.id}`, { method: 'PUT', body })
      notify('别名已更新')
    } else {
      await api('/aliases', { method: 'POST', body })
      notify('别名已创建')
    }
    modalOpen.value = false
    await load()
  } catch (e) {
    error.value = e.message
  } finally {
    saving.value = false
  }
}

function askDelete(item) {
  deleting.value = item
}

async function remove() {
  try {
    await api(`/aliases/${deleting.value.id}`, { method: 'DELETE' })
    items.value = items.value.filter((x) => x.id !== deleting.value.id)
    deleting.value = null
    notify('已删除')
  } catch (e) {
    notify(e.message, 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.keyword {
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 11.5px;
  background: var(--a-bg);
  border: 1px solid var(--a-border);
  padding: 2px 8px;
  border-radius: 6px;
  color: var(--a-primary);
}
.alias-buildings { display: flex; flex-wrap: wrap; gap: 4px; }
.building-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 8px;
  padding: 6px;
  background: #fdfbf6;
  border: 1px solid var(--a-border);
  border-radius: 9px;
}
.building-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 7px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  min-width: 0;
}
.building-item:hover { background: var(--a-bg); }
.building-item.checked { background: var(--a-pale); color: var(--a-primary); }
.building-item input { accent-color: var(--a-primary); }
.bi-icon { width: 22px; height: 22px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 9px; flex-shrink: 0; }
.bi-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.bi-cat { font-size: 8.5px; color: var(--a-muted); }
@media (max-width: 700px) {
  .building-grid { grid-template-columns: 1fr; }
}
</style>
