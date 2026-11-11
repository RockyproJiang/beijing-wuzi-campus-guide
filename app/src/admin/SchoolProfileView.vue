<template>
  <div>
    <div class="a-toolbar">
      <div class="a-small a-muted">这里填写的信息会显示在前台「关于」页的「学校信息」区域，保存后立即生效</div>
      <div class="a-spacer"></div>
      <button class="a-btn a-btn-primary" :disabled="saving" @click="save">
        <i class="fa-solid fa-floppy-disk"></i> {{ saving ? '保存中…' : '保存学校信息' }}
      </button>
    </div>

    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载学校信息…</div>
    <template v-else>
      <div class="a-card">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-school"></i> 学校基本信息</div>
          <span v-if="savedAt" class="a-tag a-tag-green">已保存 {{ savedAt }}</span>
        </div>
        <div class="a-card-body">
          <div class="sp-grid">
            <label class="a-field">
              <span class="a-label">学校名称</span>
              <input v-model="form.name" class="a-input" placeholder="北京物资学院" />
            </label>
            <label class="a-field">
              <span class="a-label">英文名称</span>
              <input v-model="form.enName" class="a-input" placeholder="Beijing Wuzi University" />
            </label>
            <label class="a-field">
              <span class="a-label">简称</span>
              <input v-model="form.shortName" class="a-input" placeholder="北物院 / 物资学院" />
            </label>
            <label class="a-field">
              <span class="a-label">办学层次</span>
              <input v-model="form.level" class="a-input" placeholder="公办本科 · 北京市属" />
            </label>
          </div>

          <label class="a-field sp-full">
            <span class="a-label">学校简介</span>
            <textarea v-model="form.intro" class="a-textarea" rows="4" placeholder="一两句话介绍学校，显示在信息卡上方"></textarea>
            <span class="a-hint">支持换行，前台会自动处理段落</span>
          </label>
        </div>
      </div>

      <div class="a-card">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-address-card"></i> 联系方式</div>
        </div>
        <div class="a-card-body">
          <div class="sp-grid">
            <label class="a-field sp-wide">
              <span class="a-label">地址</span>
              <input v-model="form.address" class="a-input" placeholder="北京市通州区富河大街321号" />
            </label>
            <label class="a-field">
              <span class="a-label">邮编</span>
              <input v-model="form.postcode" class="a-input" placeholder="101149" />
            </label>
            <label class="a-field">
              <span class="a-label">总机电话</span>
              <input v-model="form.phone" class="a-input" placeholder="010-89534000" />
            </label>
            <label class="a-field">
              <span class="a-label">招生电话</span>
              <input v-model="form.admissionPhone" class="a-input" placeholder="010-89534490" />
            </label>
            <label class="a-field">
              <span class="a-label">电子邮箱</span>
              <input v-model="form.email" class="a-input" placeholder="office@bwu.edu.cn" />
            </label>
            <label class="a-field">
              <span class="a-label">传真</span>
              <input v-model="form.fax" class="a-input" placeholder="选填" />
            </label>
            <label class="a-field">
              <span class="a-label">学校官网</span>
              <input v-model="form.website" class="a-input" placeholder="https://www.bwu.edu.cn/" />
            </label>
            <label class="a-field">
              <span class="a-label">招生网址</span>
              <input v-model="form.admissionUrl" class="a-input" placeholder="https://zs.bwu.edu.cn/" />
            </label>
          </div>
        </div>
      </div>

      <div class="a-card">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-location-dot"></i> 位置与地图</div>
        </div>
        <div class="a-card-body">
          <div class="sp-grid">
            <label class="a-field sp-wide">
              <span class="a-label">位置说明</span>
              <input v-model="form.location" class="a-input" placeholder="北京市通州区 · 地铁6号线物资学院路站" />
            </label>
            <label class="a-field">
              <span class="a-label">经度</span>
              <input v-model="form.lng" class="a-input" placeholder="116.6372" />
            </label>
            <label class="a-field">
              <span class="a-label">纬度</span>
              <input v-model="form.lat" class="a-input" placeholder="39.9086" />
            </label>
            <label class="a-field sp-wide">
              <span class="a-label">地图链接</span>
              <input v-model="form.mapUrl" class="a-input" placeholder="留空则按经纬度自动生成高德链接" />
            </label>
          </div>
          <div class="a-hint sp-hint">
            前台会提供「在地图中查看」按钮：填了「地图链接」就用它，否则用经纬度拼一个高德地图链接。
          </div>
        </div>
      </div>

      <div class="a-card">
        <div class="a-card-head">
          <div class="a-card-title"><i class="fa-solid fa-list-ul"></i> 其他信息</div>
          <span class="a-tag">{{ form.items.length }} 条</span>
        </div>
        <div class="a-card-body">
          <div class="a-hint sp-hint" style="margin-bottom:10px">
            自定义条目，比如「建校时间 / 1956 年」「占地面积 / 约 700 亩」「办学性质 / 公办」。名称与内容都必填。
          </div>
          <div v-for="(item, i) in form.items" :key="i" class="sp-item-row">
            <input v-model="item.label" class="a-input sp-item-label" placeholder="名称，如 建校时间" />
            <input v-model="item.value" class="a-input sp-item-value" placeholder="内容，如 1956 年" />
            <button class="a-btn a-btn-sm a-btn-icon" title="上移" :disabled="i === 0" @click="moveItem(i, -1)">
              <i class="fa-solid fa-arrow-up"></i>
            </button>
            <button class="a-btn a-btn-sm a-btn-icon" title="下移" :disabled="i === form.items.length - 1" @click="moveItem(i, 1)">
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" title="删除" @click="removeItem(i)">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
          <div v-if="!form.items.length" class="a-empty" style="padding:14px 0">
            <i class="fa-solid fa-list-ul"></i><p>暂无自定义条目</p>
          </div>
          <div class="sp-item-add">
            <input v-model="draftLabel" class="a-input sp-item-label" placeholder="名称，如 建校时间" @keyup.enter="addItem" />
            <input v-model="draftValue" class="a-input sp-item-value" placeholder="内容，如 1956 年" @keyup.enter="addItem" />
            <button class="a-btn a-btn-sm" :disabled="!draftLabel.trim() || !draftValue.trim()" @click="addItem">
              <i class="fa-solid fa-plus"></i> 添加
            </button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'
import { api } from './api.js'

const notify = inject('notify', () => {})
const loading = ref(true)
const saving = ref(false)
const savedAt = ref('')
const draftLabel = ref('')
const draftValue = ref('')

function blank() {
  return {
    name: '',
    enName: '',
    shortName: '',
    level: '',
    intro: '',
    address: '',
    postcode: '',
    phone: '',
    admissionPhone: '',
    email: '',
    fax: '',
    website: '',
    admissionUrl: '',
    location: '',
    lng: '',
    lat: '',
    mapUrl: '',
    items: [],
  }
}

function normalize(data) {
  const base = blank()
  const out = { ...base, ...(data || {}) }
  for (const key of Object.keys(base)) {
    if (key === 'items') continue
    out[key] = out[key] == null ? '' : String(out[key])
  }
  out.items = (Array.isArray(out.items) ? out.items : [])
    .map((x) => ({ label: String(x?.label || ''), value: String(x?.value || '') }))
    .filter((x) => x.label || x.value)
  return out
}

const form = ref(blank())

async function load() {
  loading.value = true
  try {
    const result = await api('/school-profile')
    form.value = normalize(result.schoolProfile)
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const payload = normalize(form.value)
    payload.items = payload.items.filter((x) => x.label.trim() && x.value.trim())
    const result = await api('/school-profile', { method: 'PUT', body: payload })
    form.value = normalize(result.schoolProfile)
    savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    notify('学校信息已保存')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    saving.value = false
  }
}

function moveItem(i, delta) {
  const j = i + delta
  if (j < 0 || j >= form.value.items.length) return
  const [item] = form.value.items.splice(i, 1)
  form.value.items.splice(j, 0, item)
}

function removeItem(i) {
  form.value.items.splice(i, 1)
}

function addItem() {
  const label = draftLabel.value.trim()
  const value = draftValue.value.trim()
  if (!label || !value) return
  form.value.items.push({ label, value })
  draftLabel.value = ''
  draftValue.value = ''
}

onMounted(load)
</script>

<style scoped>
.sp-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 14px; }
.sp-wide { grid-column: span 2; }
.sp-full { margin-top: 12px; }
.sp-hint { margin-top: 10px; }
.sp-item-row { display: flex; gap: 6px; align-items: center; margin-bottom: 6px; }
.sp-item-row .a-input { flex: 1 1 0; min-width: 0; width: auto; }
.sp-item-label { flex: 0 0 200px !important; }
.sp-item-add { display: flex; gap: 6px; align-items: center; margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--a-bg-deep); }
.sp-item-add .a-input { flex: 1 1 0; min-width: 0; width: auto; }
.sp-item-add .sp-item-label { flex: 0 0 200px !important; }
@media (max-width: 760px) {
  .sp-grid { grid-template-columns: 1fr; }
  .sp-wide { grid-column: span 1; }
  .sp-item-label { flex: 0 0 120px !important; }
}
</style>
