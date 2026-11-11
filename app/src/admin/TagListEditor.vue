<template>
  <div class="tag-editor">
    <div class="tag-list">
      <span v-for="(tag, i) in modelValue" :key="tag + i" class="tag-item">
        {{ tag }}
        <button type="button" title="移除" @click="remove(i)">×</button>
      </span>
      <span v-if="!modelValue.length" class="tag-empty">{{ emptyText }}</span>
    </div>
    <div class="tag-input-row">
      <input
        v-model="draft"
        class="a-input a-input-sm"
        :placeholder="placeholder"
        @keydown.enter.prevent="add"
      />
      <button type="button" class="a-btn a-btn-sm" :disabled="!draft.trim()" @click="add">
        <i class="fa-solid fa-plus"></i> 添加
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] },
  placeholder: { type: String, default: '输入后按回车添加' },
  emptyText: { type: String, default: '暂无条目' },
})
const emit = defineEmits(['update:modelValue'])
const draft = ref('')

function add() {
  const value = draft.value.trim()
  if (!value) return
  if (props.modelValue.includes(value)) {
    draft.value = ''
    return
  }
  emit('update:modelValue', [...props.modelValue, value])
  draft.value = ''
}

function remove(index) {
  const next = [...props.modelValue]
  next.splice(index, 1)
  emit('update:modelValue', next)
}
</script>

<style scoped>
.tag-editor { display: flex; flex-direction: column; gap: 7px; }
.tag-list { display: flex; flex-wrap: wrap; gap: 5px; min-height: 24px; }
.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 7px;
  background: var(--a-bg);
  border: 1px solid var(--a-border);
  font-size: 10.5px;
  color: var(--a-fg);
}
.tag-item button {
  border: none;
  background: none;
  padding: 0 0 0 2px;
  color: var(--a-muted);
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
}
.tag-item button:hover { color: var(--a-danger); }
.tag-empty { font-size: 10.5px; color: var(--a-muted); }
.tag-input-row { display: flex; gap: 6px; }
.tag-input-row .a-input { flex: 1; }
</style>
