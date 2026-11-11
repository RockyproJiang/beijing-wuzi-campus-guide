<template>
  <div>
    <div class="a-toolbar">
      <div class="a-small a-muted">删除的分类和建筑会先进入这里，普通用户立即不可见</div>
      <div class="a-spacer"></div>
      <button class="a-btn a-btn-sm" @click="load"><i class="fa-solid fa-rotate"></i> 刷新</button>
    </div>

    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载回收站…</div>
    <template v-else>
      <div class="a-card" style="margin-bottom:14px;">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-layer-group"></i> 已删除分类</div>
          <span class="a-tag">{{ categories.length }} 个</span>
        </div>
        <div v-if="!categories.length" class="a-empty"><i class="fa-solid fa-check"></i><p>没有已删除的分类</p></div>
        <table v-else class="a-table">
          <thead><tr><th>分类</th><th>ID</th><th>删除时间</th><th style="text-align:right;">操作</th></tr></thead>
          <tbody>
            <tr v-for="cat in categories" :key="cat.id">
              <td><span class="name">{{ cat.name }}</span></td>
              <td><span class="a-small a-muted">#{{ cat.id }}</span></td>
              <td class="a-small a-muted">{{ formatTime(cat.deletedAt) }}</td>
              <td>
                <div class="actions">
                  <button class="a-btn a-btn-sm" @click="restoreCategory(cat)"><i class="fa-solid fa-rotate-left"></i> 恢复</button>
                  <button class="a-btn a-btn-sm a-btn-danger" @click="askPurge('category', cat)"><i class="fa-solid fa-trash"></i> 彻底删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="a-card">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-building"></i> 已删除建筑</div>
          <span class="a-tag">{{ buildings.length }} 个</span>
        </div>
        <div v-if="!buildings.length" class="a-empty"><i class="fa-solid fa-check"></i><p>没有已删除的建筑</p></div>
        <table v-else class="a-table">
          <thead><tr><th>建筑</th><th>分类</th><th>删除时间</th><th style="text-align:right;">操作</th></tr></thead>
          <tbody>
            <tr v-for="b in buildings" :key="b.id">
              <td>
                <div class="name">{{ b.name }}</div>
                <div class="sub">#{{ b.id }}</div>
              </td>
              <td><span class="a-small a-muted">{{ b.categoryName || b.categoryId }}</span></td>
              <td class="a-small a-muted">{{ formatTime(b.deletedAt) }}</td>
              <td>
                <div class="actions">
                  <button class="a-btn a-btn-sm" @click="restoreBuilding(b)"><i class="fa-solid fa-rotate-left"></i> 恢复</button>
                  <button class="a-btn a-btn-sm a-btn-danger" @click="askPurge('building', b)"><i class="fa-solid fa-trash"></i> 彻底删除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-if="purging" class="a-modal-backdrop" @click.self="purging = null">
      <div class="a-modal slim">
        <div class="a-modal-head">
          <div>
            <div class="a-modal-title">彻底删除</div>
            <div class="a-modal-sub">此操作不可恢复</div>
          </div>
          <button class="a-close" @click="purging = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="a-modal-body">
          确定要彻底删除 <strong>{{ purging.item.name }}</strong> 吗？删除后无法从回收站恢复。
        </div>
        <div class="a-modal-foot">
          <button class="a-btn" @click="purging = null">取消</button>
          <button class="a-btn a-btn-danger" :disabled="saving" @click="purge">
            {{ saving ? '删除中…' : '彻底删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'
import { api, formatTime } from './api.js'

const notify = inject('notify', () => {})
const loading = ref(true)
const saving = ref(false)
const categories = ref([])
const buildings = ref([])
const purging = ref(null)

async function load() {
  loading.value = true
  try {
    const result = await api('/trash')
    categories.value = result.categories
    buildings.value = result.buildings
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function restoreCategory(cat) {
  try {
    await api(`/categories/${cat.id}/restore`, { method: 'POST' })
    notify('分类已恢复')
    await load()
  } catch (error) {
    notify(error.message, 'error')
  }
}

async function restoreBuilding(b) {
  try {
    await api(`/buildings/${b.id}/restore`, { method: 'POST' })
    notify('建筑已恢复')
    await load()
  } catch (error) {
    notify(error.message, 'error')
  }
}

function askPurge(type, item) {
  purging.value = { type, item }
}

async function purge() {
  if (!purging.value) return
  const { type, item } = purging.value
  saving.value = true
  try {
    if (type === 'category') {
      await api(`/categories/${item.id}/purge`, { method: 'DELETE' })
    } else {
      await api(`/buildings/${item.id}/purge`, { method: 'DELETE' })
    }
    notify('已彻底删除')
    purging.value = null
    await load()
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>
