<template>
  <div>
    <div class="a-toolbar">
      <div class="a-small a-muted">校历显示在“数字校园 → 校历”中，按列表顺序展示</div>
      <div class="a-spacer"></div>
      <button class="a-btn a-btn-sm" @click="add"><i class="fa-solid fa-plus"></i> 添加事件</button>
      <button class="a-btn a-btn-primary" :disabled="saving" @click="save">
        <i class="fa-solid fa-check"></i> {{ saving ? '保存中…' : '保存校历' }}
      </button>
    </div>

    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载校历…</div>
    <div v-else class="a-card">
      <div class="a-card-head">
        <div class="a-card-title"><i class="fa-solid fa-calendar-days"></i> 学期与关键日期</div>
        <span class="a-tag">{{ items.length }} 个事件</span>
      </div>
      <div class="a-card-body">
        <label class="a-field" style="max-width:460px;">
          <span class="a-label">学期标题</span>
          <input v-model="title" class="a-input" placeholder="例如 2025-2026第二学期校历" />
        </label>

        <div class="cal-list">
          <div v-for="(item, i) in items" :key="i" class="cal-row">
            <span class="cal-index">{{ String(i + 1).padStart(2, '0') }}</span>
            <input v-model="item.event" class="a-input" placeholder="事件名称，如 报到注册" />
            <input v-model="item.date" class="a-input" placeholder="日期，如 3月1日" />
            <div class="cal-actions">
              <button class="a-btn a-btn-sm a-btn-icon" :disabled="i === 0" @click="move(i, -1)"><i class="fa-solid fa-arrow-up"></i></button>
              <button class="a-btn a-btn-sm a-btn-icon" :disabled="i === items.length - 1" @click="move(i, 1)"><i class="fa-solid fa-arrow-down"></i></button>
              <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="items.splice(i, 1)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
          <div v-if="!items.length" class="a-empty"><i class="fa-solid fa-calendar-xmark"></i><p>暂无事件，点击右上角添加</p></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'
import { api } from './api.js'

const notify = inject('notify', () => {})
const loading = ref(true)
const saving = ref(false)
const title = ref('')
const items = ref([])

function add() {
  items.value.push({ event: '', date: '' })
}

function move(index, delta) {
  const next = index + delta
  if (next < 0 || next >= items.value.length) return
  const list = [...items.value]
  ;[list[index], list[next]] = [list[next], list[index]]
  items.value = list
}

async function load() {
  loading.value = true
  try {
    const result = await api('/calendar')
    title.value = result.calendar.title || ''
    items.value = result.calendar.items || []
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const clean = items.value.filter((x) => x.event.trim())
    const result = await api('/calendar', {
      method: 'PUT',
      body: { title: title.value, items: clean.map((x) => ({ event: x.event, date: x.date })) },
    })
    items.value = result.calendar.items
    notify('校历已保存')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.cal-list { margin-top: 16px; display: flex; flex-direction: column; gap: 7px; }
.cal-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #fdfbf6;
  border: 1px solid var(--a-bg-deep);
  border-radius: 9px;
}
.cal-index {
  width: 26px;
  text-align: center;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  color: var(--a-muted);
  flex-shrink: 0;
}
.cal-row .a-input:first-of-type { flex: 1.3; }
.cal-row .a-input:last-of-type { flex: 1; }
.cal-actions { display: flex; gap: 3px; flex-shrink: 0; }
.cal-actions .a-btn { width: 27px; height: 30px; padding: 0; }
@media (max-width: 700px) {
  .cal-row { flex-wrap: wrap; }
  .cal-row .a-input { min-width: 120px; }
}
</style>
