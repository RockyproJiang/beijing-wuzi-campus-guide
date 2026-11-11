<template>
  <div class="link-editor">
    <div class="le-rows">
      <div v-for="(row, i) in rows" :key="i" class="le-row">
        <input v-model="row.name" class="a-input le-name" :placeholder="namePlaceholder" @input="commit" />
        <input v-if="showDept" v-model="row.dept" class="a-input le-dept" :placeholder="deptPlaceholder" @input="commit" />
        <input v-model="row.url" class="a-input le-url" :placeholder="urlPlaceholder" @input="commit" />
        <input v-if="showDesc" v-model="row.desc" class="a-input le-desc" :placeholder="descPlaceholder" @input="commit" />
        <button type="button" class="a-btn a-btn-sm a-btn-icon" title="上移" :disabled="i === 0" @click="move(i, -1)">
          <i class="fa-solid fa-arrow-up"></i>
        </button>
        <button type="button" class="a-btn a-btn-sm a-btn-icon" title="下移" :disabled="i === rows.length - 1" @click="move(i, 1)">
          <i class="fa-solid fa-arrow-down"></i>
        </button>
        <button type="button" class="a-btn a-btn-sm a-btn-icon a-btn-danger" title="删除" @click="removeAt(i)">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div v-if="!rows.length" class="le-empty">{{ emptyText }}</div>
    </div>
    <div class="le-add">
      <input v-model="draftName" class="a-input le-add-name" :placeholder="namePlaceholder" @keydown.enter.prevent="add" />
      <input v-if="showDept" v-model="draftDept" class="a-input le-add-dept" :placeholder="deptPlaceholder" @keydown.enter.prevent="add" />
      <input v-model="draftUrl" class="a-input le-add-url" :placeholder="urlPlaceholder" @keydown.enter.prevent="add" />
      <input v-if="showDesc" v-model="draftDesc" class="a-input le-add-desc" :placeholder="descPlaceholder" @keydown.enter.prevent="add" />
      <button type="button" class="a-btn a-btn-sm" :disabled="!draftName.trim() && !draftUrl.trim()" @click="add">
        <i class="fa-solid fa-plus"></i> 添加
      </button>
    </div>
    <div v-if="hint" class="le-hint">{{ hint }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  namePlaceholder: { type: String, default: '名称' },
  urlPlaceholder: { type: String, default: '链接（可选，如 https://…）' },
  deptPlaceholder: { type: String, default: '部门（可选）' },
  descPlaceholder: { type: String, default: '简介（可选）' },
  showDept: { type: Boolean, default: false },
  showDesc: { type: Boolean, default: false },
  emptyText: { type: String, default: '暂无条目' },
  hint: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const rows = ref([])
const draftName = ref('')
const draftDept = ref('')
const draftUrl = ref('')
const draftDesc = ref('')

// 兼容历史数据：纯字符串 = 只有名称
function toRow(x) {
  if (typeof x === 'string') return { name: x, dept: '', url: '', desc: '' }
  if (x && typeof x === 'object') {
    return {
      name: String(x.name ?? ''),
      dept: String(x.dept ?? ''),
      url: String(x.url ?? ''),
      desc: String(x.desc ?? ''),
    }
  }
  return { name: '', dept: '', url: '', desc: '' }
}

function toPlain(list) {
  const out = []
  for (const r of list) {
    const name = String(r.name || '').trim()
    const url = String(r.url || '').trim()
    const desc = String(r.desc || '').trim()
    if (!name && !url) continue
    if (props.showDept) {
      const dept = String(r.dept || '').trim()
      const row = { name, url }
      if (dept) row.dept = dept
      if (desc) row.desc = desc
      out.push(row)
    } else if (props.showDesc) {
      const row = { name }
      if (url) row.url = url
      if (desc) row.desc = desc
      out.push(desc || url ? row : name)
    } else {
      out.push(url ? { name, url } : name)
    }
  }
  return out
}

watch(
  () => props.modelValue,
  (v) => {
    const next = (Array.isArray(v) ? v : []).map(toRow)
    if (JSON.stringify(next) === JSON.stringify(rows.value)) return
    rows.value = next
  },
  { immediate: true, deep: true }
)

function commit() {
  emit('update:modelValue', toPlain(rows.value))
}

function add() {
  const name = draftName.value.trim()
  if (!name && !draftUrl.value.trim()) return
  rows.value.push({
    name,
    dept: draftDept.value.trim(),
    url: draftUrl.value.trim(),
    desc: draftDesc.value.trim(),
  })
  draftName.value = ''
  draftDept.value = ''
  draftUrl.value = ''
  draftDesc.value = ''
  commit()
}

function removeAt(i) {
  rows.value.splice(i, 1)
  commit()
}

function move(i, delta) {
  const j = i + delta
  if (j < 0 || j >= rows.value.length) return
  const [item] = rows.value.splice(i, 1)
  rows.value.splice(j, 0, item)
  commit()
}
</script>

<style scoped>
.link-editor { display: flex; flex-direction: column; gap: 7px; }
.le-rows { display: flex; flex-direction: column; gap: 5px; }
.le-row { display: flex; gap: 5px; align-items: center; }
.le-row .a-input { flex: 1 1 0; min-width: 0; width: auto; }
.le-name { flex: 1.1 1 0 !important; }
.le-dept { flex: 0.8 1 0 !important; }
.le-url { flex: 1.8 1 0 !important; }
.le-desc { flex: 1.6 1 0 !important; }
.le-empty { font-size: 10.5px; color: var(--a-muted); }
.le-add { display: flex; gap: 5px; margin-top: 3px; }
.le-add .a-input { flex: 1 1 0; min-width: 0; width: auto; }
.le-add .a-input:nth-child(1) { flex: 1.1 1 0; }
.le-add .a-input.le-add-url { flex: 1.8 1 0; }
.le-hint { font-size: 10px; color: var(--a-muted); line-height: 1.5; }
</style>
