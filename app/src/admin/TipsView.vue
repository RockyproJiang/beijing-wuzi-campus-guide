<template>
  <div>
    <div class="a-toolbar">
      <div class="a-small a-muted">展示在设施速查页底部的“温馨提示”，建议每条不超过 40 字</div>
    </div>

    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载提示…</div>
    <div v-else class="a-card">
      <div class="a-card-head">
        <div class="a-card-title"><i class="fa-solid fa-lightbulb"></i> 温馨提示</div>
        <span class="a-tag">{{ items.length }} 条</span>
      </div>
      <div class="a-card-body">
        <div v-for="item in items" :key="item.id" class="tip-row">
          <i class="fa-solid fa-circle-check tip-icon"></i>
          <input v-model="item.content" class="a-input" @keyup.enter="save(item)" />
          <button class="a-btn a-btn-sm" :disabled="item._saving" @click="save(item)">
            {{ item._saving ? '保存中…' : '保存' }}
          </button>
          <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" :disabled="item._saving" @click="remove(item)">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>
        <div v-if="!items.length" class="a-empty"><i class="fa-solid fa-lightbulb"></i><p>暂无提示</p></div>

        <div class="tip-add">
          <input v-model="newContent" class="a-input" placeholder="输入一条新的温馨提示…" @keyup.enter="add" />
          <button class="a-btn a-btn-primary" :disabled="adding || !newContent.trim()" @click="add">
            <i class="fa-solid fa-plus"></i> {{ adding ? '添加中…' : '添加' }}
          </button>
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
const adding = ref(false)
const items = ref([])
const newContent = ref('')

async function load() {
  loading.value = true
  try {
    const result = await api('/tips')
    items.value = result.items.map((x) => ({ ...x, _saving: false }))
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function save(item) {
  if (!item.content.trim()) {
    notify('提示内容不能为空', 'error')
    return
  }
  item._saving = true
  try {
    await api(`/tips/${item.id}`, { method: 'PUT', body: { content: item.content } })
    notify('提示已保存')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    item._saving = false
  }
}

async function add() {
  if (!newContent.value.trim()) return
  adding.value = true
  try {
    const result = await api('/tips', { method: 'POST', body: { content: newContent.value.trim() } })
    items.value.push({ ...result.item, _saving: false })
    newContent.value = ''
    notify('提示已添加')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    adding.value = false
  }
}

async function remove(item) {
  try {
    await api(`/tips/${item.id}`, { method: 'DELETE' })
    items.value = items.value.filter((x) => x.id !== item.id)
    notify('提示已删除')
  } catch (error) {
    notify(error.message, 'error')
  }
}

onMounted(load)
</script>

<style scoped>
.tip-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border: 1px solid var(--a-bg-deep);
  border-radius: 9px;
  background: #fdfbf6;
  margin-bottom: 7px;
}
.tip-icon { color: var(--a-primary-light); font-size: 12px; flex-shrink: 0; }
.tip-row .a-input { flex: 1; }
.tip-add {
  display: flex;
  gap: 8px;
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px dashed var(--a-border);
}
.tip-add .a-input { flex: 1; }
</style>
