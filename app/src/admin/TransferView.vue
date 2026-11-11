<template>
  <div>
    <div class="transfer-grid">
      <div class="a-card">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-download"></i> 导出备份</div>
        </div>
        <div class="a-card-body">
          <p class="a-hint" style="margin-top:0;">
            导出当前数据库中的分类、建筑、校历、提示和搜索别名，格式与 <code>data.js</code> 一致，可直接用于迁移或恢复。
          </p>
          <button class="a-btn a-btn-primary" :disabled="exporting" @click="exportAll">
            <i class="fa-solid fa-file-arrow-down"></i>
            {{ exporting ? '准备下载…' : '下载 JSON 备份' }}
          </button>
          <div class="a-hint" style="margin-top:10px;">建议在每次批量修改前先导出一次。</div>
        </div>
      </div>

      <div class="a-card">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-upload"></i> 导入数据</div>
        </div>
        <div class="a-card-body">
          <input ref="fileInput" type="file" accept="application/json,.json" class="a-input" @change="onFile" />
          <div v-if="parseError" class="a-login-error" style="margin-top:10px;">{{ parseError }}</div>

          <template v-if="parsed">
            <div class="import-summary">
              <div><strong>{{ parsed.categories.length }}</strong><span>分类</span></div>
              <div><strong>{{ buildingCount }}</strong><span>建筑</span></div>
              <div><strong>{{ parsed.calendar?.items?.length || 0 }}</strong><span>校历事件</span></div>
              <div><strong>{{ parsed.tips?.length || 0 }}</strong><span>提示</span></div>
              <div><strong>{{ parsed.aliases?.length || 0 }}</strong><span>别名</span></div>
            </div>

            <div class="mode-list">
              <label class="mode-item" :class="{ active: mode === 'merge' }">
                <input v-model="mode" type="radio" value="merge" />
                <span><strong>合并导入</strong><small>按 ID 更新已有分类/建筑，新增条目；不会删除现有数据。</small></span>
              </label>
              <label class="mode-item" :class="{ active: mode === 'replace' }">
                <input v-model="mode" type="radio" value="replace" />
                <span><strong>覆盖导入</strong><small>清空现有分类、建筑、提示和别名，完全替换为文件内容。</small></span>
              </label>
            </div>

            <label v-if="mode === 'replace'" class="a-switch" style="margin-top:10px;color:var(--a-danger);">
              <input v-model="confirmed" type="checkbox" />
              我确认覆盖导入会替换现有全部数据
            </label>

            <div class="a-row" style="margin-top:14px;">
              <button class="a-btn" @click="reset">取消</button>
              <div class="a-spacer"></div>
              <button
                class="a-btn a-btn-primary"
                :disabled="importing || (mode === 'replace' && !confirmed)"
                @click="doImport"
              >
                <i class="fa-solid fa-check"></i>
                {{ importing ? '导入中…' : '开始导入' }}
              </button>
            </div>
          </template>
        </div>
      </div>
    </div>

    <div v-if="result" class="a-card" style="margin-top:14px;">
      <div class="a-card-head">
        <div class="a-card-title"><i class="fa-solid fa-circle-check" style="color:#2d6a4f"></i> 导入完成</div>
        <button class="a-close" @click="result = null"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="a-card-body">
        <div class="import-summary">
          <div><strong>{{ result.counts.categories }}</strong><span>分类</span></div>
          <div><strong>{{ result.counts.buildings }}</strong><span>建筑</span></div>
          <div><strong>{{ result.counts.calendar }}</strong><span>校历事件</span></div>
          <div><strong>{{ result.counts.tips }}</strong><span>提示</span></div>
          <div><strong>{{ result.counts.aliases }}</strong><span>别名</span></div>
        </div>
        <div class="a-hint" style="margin-top:10px;">
          导入前已自动备份到：<code>{{ result.backup || '（备份失败，请检查 server/backups 权限）' }}</code>
        </div>
      </div>
    </div>

    <div class="a-card" style="margin-top:14px;">
      <div class="a-card-head">
        <div class="a-card-title"><i class="fa-solid fa-shield-halved"></i> 安全说明</div>
      </div>
      <div class="a-card-body">
        <ul class="tips">
          <li>导入前系统会自动把当前数据写入 <code>server/backups/</code>，文件名包含时间戳。</li>
          <li>覆盖导入不可撤销，但可以用备份文件重新导入恢复。</li>
          <li>导入使用数据库事务，格式校验失败不会写入任何数据。</li>
          <li>普通用户不会看到后台入口，也不会下载后台代码（按需懒加载）。</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'
import { api } from './api.js'

const notify = inject('notify', () => {})
const exporting = ref(false)
const importing = ref(false)
const parsed = ref(null)
const parseError = ref('')
const mode = ref('merge')
const confirmed = ref(false)
const result = ref(null)
const fileInput = ref(null)

const buildingCount = computed(() =>
  (parsed.value?.categories || []).reduce((sum, c) => sum + (c.buildings?.length || 0), 0)
)

async function exportAll() {
  exporting.value = true
  try {
    const res = await fetch('/api/admin/export', { credentials: 'same-origin' })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || `导出失败（${res.status}）`)
    }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bwz-campus-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    notify('备份已下载')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    exporting.value = false
  }
}

async function onFile(event) {
  parseError.value = ''
  parsed.value = null
  result.value = null
  confirmed.value = false
  const file = event.target.files?.[0]
  if (!file) return
  try {
    const text = (await file.text()).replace(/^\uFEFF/, '')
    const data = JSON.parse(text)
    if (!Array.isArray(data.categories) || !data.categories.length) {
      throw new Error('文件缺少 categories 数组')
    }
    parsed.value = data
  } catch (error) {
    parseError.value = '无法解析文件：' + error.message
  }
}

function reset() {
  parsed.value = null
  parseError.value = ''
  confirmed.value = false
  if (fileInput.value) fileInput.value.value = ''
}

async function doImport() {
  if (!parsed.value) return
  importing.value = true
  result.value = null
  try {
    const res = await api('/import', {
      method: 'POST',
      body: { mode: mode.value, data: parsed.value },
    })
    result.value = res
    notify('导入完成')
    reset()
  } catch (error) {
    notify(error.message, 'error')
    if (error.details?.length) {
      parseError.value = error.details.slice(0, 4).map((d) => `${d.path} ${d.message}`).join('；')
    }
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.transfer-grid { display: grid; grid-template-columns: 1fr 1.2fr; gap: 14px; }
.import-summary {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding: 12px;
  background: #fbf8f0;
  border: 1px solid var(--a-bg-deep);
  border-radius: 10px;
}
.import-summary > div { display: flex; flex-direction: column; align-items: center; min-width: 70px; }
.import-summary strong { font-family: 'Noto Serif SC', serif; font-size: 18px; color: var(--a-primary); }
.import-summary span { font-size: 10px; color: var(--a-muted); }
.mode-list { display: flex; flex-direction: column; gap: 7px; margin-top: 12px; }
.mode-item {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 10px 12px;
  border: 1px solid var(--a-border);
  border-radius: 9px;
  background: #fdfbf6;
  cursor: pointer;
  font-size: 11.5px;
}
.mode-item.active { border-color: var(--a-primary-light); background: #f3f9f3; }
.mode-item input { margin-top: 2px; accent-color: var(--a-primary); }
.mode-item span { display: flex; flex-direction: column; gap: 2px; }
.mode-item strong { font-size: 12px; color: var(--a-fg); }
.mode-item small { font-size: 10.5px; color: var(--a-muted); line-height: 1.5; }
.tips { margin: 0; padding-left: 18px; font-size: 11.5px; color: var(--a-muted); line-height: 1.8; }
code { background: var(--a-bg); padding: 1px 5px; border-radius: 4px; font-size: 10.5px; }
@media (max-width: 900px) {
  .transfer-grid { grid-template-columns: 1fr; }
}
</style>
