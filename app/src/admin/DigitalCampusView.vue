<template>
  <div>
    <div class="a-toolbar">
      <div class="a-small a-muted">
        数字校园前台内容 · {{ form.entries.length }} 个入口 · {{ form.apps.length }} 个应用 · {{ form.services.length }} 项服务 · {{ form.departments.length }} 个部门
      </div>
      <div class="a-spacer"></div>
      <span v-if="savedAt" class="a-small" style="color:var(--a-primary-light);">
        <i class="fa-solid fa-circle-check"></i> 已保存 {{ savedAt }}
      </span>
      <a class="a-btn a-btn-sm" href="/" target="_blank" rel="noopener">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 查看前台
      </a>
      <button class="a-btn a-btn-primary" :disabled="saving" @click="save">
        <i class="fa-solid fa-check"></i> {{ saving ? '保存中…' : '保存数字校园' }}
      </button>
    </div>

    <div v-if="loading" class="a-loading"><span class="a-spinner"></span>加载数字校园数据…</div>
    <div v-else class="a-card">
      <div class="a-card-head">
        <div class="a-card-title"><i class="fa-solid fa-globe"></i> 数字校园内容</div>
        <span class="a-tag">数据库存储</span>
      </div>
      <div class="a-card-body">
        <div class="a-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="a-tab"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon" style="margin-right:5px;"></i>{{ tab.label }}
          </button>
        </div>

        <!-- 入口 -->
        <div v-show="activeTab === 'links'" class="tab-pane">
          <div class="a-hint" style="margin-bottom:12px;">
            一条入口 = 名称 + 链接 + 简介，可以自行增删和调整顺序。前台顶部主按钮取第一条有链接的条目，首页「快捷入口」按这里的顺序展示。
          </div>
          <div class="a-field">
            <LinkListEditor
              v-model="form.entries"
              show-desc
              name-placeholder="名称，如 数字校园门户"
              url-placeholder="链接，如 https://my.bwu.edu.cn/"
              desc-placeholder="简介，如 统一身份认证入口"
              hint="教务系统、学生管理系统、服务大厅、办事大厅、预约大厅、WebVPN 这些版块按钮会复用同名条目的链接；删掉条目后对应按钮会自动隐藏。"
            />
          </div>
        </div>

        <!-- 应用与服务 -->
        <div v-show="activeTab === 'apps'" class="tab-pane">
          <div class="a-hint" style="margin-bottom:12px;">
            每一行都能改「名称」和「链接」。链接留空时，前台点它还是会跳转到该版块的默认入口（如服务大厅）；填了就优先打开这一条自己的链接。
          </div>
          <div class="two-col">
            <div class="a-field">
              <span class="a-label">应用宫格（{{ form.apps.length }}）</span>
              <LinkListEditor
                v-model="form.apps"
                name-placeholder="应用名称，如 我的课表"
                url-placeholder="链接，如 https://…（留空则打开门户）"
              />
            </div>
            <div class="a-field">
              <span class="a-label">热门服务（{{ form.hotServices.length }}）</span>
              <LinkListEditor
                v-model="form.hotServices"
                name-placeholder="服务名称"
                url-placeholder="链接（留空则打开服务大厅）"
              />
            </div>
          </div>

          <div class="sub-title">服务大厅事项</div>
          <div class="a-field">
            <LinkListEditor
              v-model="form.services"
              show-dept
              name-placeholder="服务名称"
              dept-placeholder="负责部门（可选）"
              url-placeholder="链接（留空则打开服务大厅）"
            />
          </div>

          <div class="two-col" style="margin-top:16px;">
            <div>
              <div class="sub-title">办事大厅列表</div>
              <LinkListEditor
                v-model="form.serviceHallItems"
                show-dept
                name-placeholder="事项名称"
                dept-placeholder="部门"
                url-placeholder="链接（留空则打开办事大厅）"
              />
            </div>
            <div>
              <div class="sub-title">预约大厅列表</div>
              <LinkListEditor
                v-model="form.bookingHallItems"
                show-dept
                name-placeholder="预约项目名称"
                dept-placeholder="部门"
                url-placeholder="链接（留空则打开预约大厅）"
              />
            </div>
          </div>
        </div>

        <!-- 学生系统 -->
        <div v-show="activeTab === 'student'" class="tab-pane">
          <label class="a-field" style="max-width:420px;">
            <span class="a-label">学生系统标题</span>
            <input v-model="form.stuSystemMenu.name" class="a-input" />
          </label>
          <div v-for="(group, gi) in form.stuSystemMenu.groups" :key="gi" class="sub-card">
            <div class="menu-head">
              <input v-model="group.name" class="a-input" placeholder="分组名称" />
              <input v-model="group.icon" class="a-input" placeholder="fa-solid fa-list-check" />
              <input v-model="group.color" class="a-input" type="color" />
              <input v-model="group.textColor" class="a-input" type="color" />
              <button class="a-btn a-btn-sm a-btn-danger" @click="form.stuSystemMenu.groups.splice(gi, 1)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
            <LinkListEditor
              v-model="group.items"
              name-placeholder="菜单项名称"
              url-placeholder="链接（留空则打开学生管理系统）"
            />
          </div>
          <button class="a-btn a-btn-sm" @click="form.stuSystemMenu.groups.push({ name: '', icon: 'fa-solid fa-list', color: '#D8F3DC', textColor: '#1B4332', items: [] })">
            <i class="fa-solid fa-plus"></i> 添加分组
          </button>
        </div>

        <!-- 教务系统 -->
        <div v-show="activeTab === 'edu'" class="tab-pane">
          <label class="a-field" style="max-width:420px;">
            <span class="a-label">教务系统标题</span>
            <input v-model="form.eduSystemMenu.name" class="a-input" />
          </label>
          <div v-for="(section, si) in form.eduSystemMenu.sections" :key="si" class="sub-card">
            <div class="menu-head">
              <input v-model="section.name" class="a-input" placeholder="分组名称" />
              <input v-model="section.icon" class="a-input" placeholder="fa-solid fa-user-graduate" />
              <input v-model="section.color" class="a-input" type="color" />
              <input v-model="section.textColor" class="a-input" type="color" />
              <button class="a-btn a-btn-sm a-btn-danger" @click="form.eduSystemMenu.sections.splice(si, 1)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
            <LinkListEditor
              v-model="section.items"
              name-placeholder="菜单项名称"
              url-placeholder="链接（留空则打开教务系统）"
            />
          </div>
          <button class="a-btn a-btn-sm" @click="form.eduSystemMenu.sections.push({ name: '', icon: 'fa-solid fa-book', color: '#D6EAF8', textColor: '#1A5276', items: [] })">
            <i class="fa-solid fa-plus"></i> 添加分组
          </button>
        </div>

        <!-- 网费 -->
        <div v-show="activeTab === 'netfee'" class="tab-pane">
          <div class="link-grid">
            <label class="a-field">
              <span class="a-label">标题</span>
              <input v-model="form.netFee.title" class="a-input" />
            </label>
            <label class="a-field">
              <span class="a-label">充值链接</span>
              <input v-model="form.netFee.url" class="a-input" />
            </label>
            <label class="a-field">
              <span class="a-label">充值时间</span>
              <input v-model="form.netFee.rechargeTime" class="a-input" />
            </label>
          </div>
          <label class="a-field" style="margin-top:10px;">
            <span class="a-label">计费说明</span>
            <textarea v-model="form.netFee.calc" class="a-textarea" rows="3"></textarea>
          </label>
          <label class="a-field" style="margin-top:10px;">
            <span class="a-label">补充说明</span>
            <textarea v-model="form.netFee.note" class="a-textarea" rows="3"></textarea>
          </label>
          <div class="two-col" style="margin-top:12px;">
            <div class="a-field">
              <span class="a-label">小提示</span>
              <TagListEditor v-model="form.netFee.tips" placeholder="添加小提示" />
            </div>
            <div class="a-field">
              <span class="a-label">联系方式 / 客服</span>
              <TagListEditor v-model="form.netFee.contacts" placeholder="添加微信/邮箱等" />
            </div>
          </div>
        </div>

        <!-- 部门 -->
        <div v-show="activeTab === 'departments'" class="tab-pane">
          <div class="a-hint" style="margin-bottom:10px;">部门名称、地址、电话、邮箱、网站；前台会做成可搜索的通讯录。</div>
          <div v-for="(d, i) in form.departments" :key="i" class="dept-card">
            <div class="dept-head">
              <input v-model="d.name" class="a-input" placeholder="部门名称" />
              <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="form.departments.splice(i, 1)">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
            <div class="dept-fields">
              <input v-model="d.addr" class="a-input" placeholder="地址" />
              <input v-model="d.tel" class="a-input" placeholder="电话" />
              <input v-model="d.fax" class="a-input" placeholder="传真" />
              <input v-model="d.email" class="a-input" placeholder="邮箱" />
              <input v-model="d.web" class="a-input" placeholder="网站" />
            </div>
          </div>
          <button class="a-btn a-btn-sm" @click="form.departments.push({ name: '', addr: '', tel: '', fax: '', email: '', web: '' })">
            <i class="fa-solid fa-plus"></i> 添加部门
          </button>
        </div>

        <!-- VPN -->
        <div v-show="activeTab === 'vpn'" class="tab-pane">
          <div class="two-col">
            <div>
              <div class="sub-title">VPN 业务系统</div>
              <div class="row-table">
                <div v-for="(item, i) in form.vpnBusiness" :key="i" class="edit-row">
                  <input v-model="item.name" class="a-input" placeholder="系统名称" />
                  <input v-model="item.url" class="a-input" placeholder="地址" />
                  <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="form.vpnBusiness.splice(i, 1)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
                <button class="a-btn a-btn-sm" @click="form.vpnBusiness.push({ name: '', url: '' })">
                  <i class="fa-solid fa-plus"></i> 添加
                </button>
              </div>
            </div>
            <div>
              <div class="sub-title">VPN 图书馆资源</div>
              <div class="row-table">
                <div v-for="(item, i) in form.vpnLibrary" :key="i" class="edit-row">
                  <input v-model="item.name" class="a-input" placeholder="资源名称" />
                  <input v-model="item.url" class="a-input" placeholder="地址" />
                  <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="form.vpnLibrary.splice(i, 1)">
                    <i class="fa-solid fa-trash"></i>
                  </button>
                </div>
                <button class="a-btn a-btn-sm" @click="form.vpnLibrary.push({ name: '', url: '' })">
                  <i class="fa-solid fa-plus"></i> 添加
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, ref } from 'vue'
import { api } from './api.js'
import TagListEditor from './TagListEditor.vue'
import LinkListEditor from './LinkListEditor.vue'

const notify = inject('notify', () => {})
const loading = ref(true)
const saving = ref(false)
const savedAt = ref('')
const activeTab = ref('links')

const tabs = [
  { id: 'links', label: '入口', icon: 'fa-solid fa-link' },
  { id: 'apps', label: '应用与服务', icon: 'fa-solid fa-grid-2' },
  { id: 'student', label: '学生系统', icon: 'fa-solid fa-user-graduate' },
  { id: 'edu', label: '教务系统', icon: 'fa-solid fa-book-open' },
  { id: 'netfee', label: '网费', icon: 'fa-solid fa-wifi' },
  { id: 'departments', label: '部门', icon: 'fa-solid fa-building' },
  { id: 'vpn', label: 'VPN', icon: 'fa-solid fa-shield-halved' },
]

// 入口按钮的名字（老数据兜底，前台没有 entries 时才用）
const defaultLinkLabels = {
  portal: '数字校园门户',
  affairHall: '办事大厅',
  serviceHall: '服务大厅',
  bookingHall: '预约大厅',
  eduSystem: '教务系统',
  stuSystem: '学生管理系统',
  webvpn: 'WebVPN',
}

// 「入口」只在后台维护一份「名称 + 链接 + 简介」清单；
// 下面这些版块仍需要各自的地址，按名称关键词从清单里自动认领（与前台规则一致）。
const legacyDefaults = {
  portal: { label: '数字校园门户', desc: '统一身份认证入口' },
  affairHall: { label: '办事大厅', desc: '线上办理校园事务' },
  serviceHall: { label: '服务大厅', desc: '服务事项与进度' },
  bookingHall: { label: '预约大厅', desc: '空间与场馆预约' },
  eduSystem: { label: '教务系统', desc: '选课、课表、成绩' },
  stuSystem: { label: '学生管理系统', desc: '学籍、资助、请假' },
  webvpn: { label: 'WebVPN', desc: '校外访问校内资源' },
}

// 越靠前越具体，先认领（和前台 DcampusOverlay.vue 的 SECTION_MATCH 保持一致）
const sectionMatch = [
  ['webvpn', /vpn/i],
  ['bookingHall', /预约/],
  ['stuSystem', /学生管理|学工/],
  ['eduSystem', /教务系统|教务服务|^教务$/],
  ['serviceHall', /服务大厅|服务平台|教务处/],
  ['affairHall', /办事|办公室/],
  ['portal', /门户|数字校园/],
]

function entriesFromLegacy(data) {
  const labels = data.linkLabels || {}
  const out = []
  for (const [key, meta] of Object.entries(legacyDefaults)) {
    const url = String(data[key] || '').trim()
    if (!url) continue
    out.push({ name: String(labels[key] || meta.label).trim() || meta.label, url, desc: meta.desc })
  }
  return out
}

// 把清单里的条目同步到各版块的固定字段。
// 清单非空时它就是唯一来源：认领不到的版块会被清空（前台对应按钮自动隐藏）；
// 清单为空（老数据）时不动，避免把历史链接一次性清掉。
function applyEntriesToLegacy(target) {
  const list = (Array.isArray(target.entries) ? target.entries : [])
    .map((x) => (typeof x === 'string' ? { name: x, url: '' } : x || {}))
    .filter((x) => String(x.url || '').trim())
  if (!list.length) return
  const used = new Set()
  const hit = {}
  for (const [key, test] of sectionMatch) {
    const item = list.find((x, i) => !used.has(i) && test.test(String(x.name || '')))
    if (!item) continue
    used.add(list.indexOf(item))
    hit[key] = item
  }
  for (const [key, meta] of Object.entries(legacyDefaults)) {
    const item = hit[key]
    target[key] = item ? String(item.url).trim() : ''
    target.linkLabels[key] = item ? String(item.name).trim() || meta.label : meta.label
  }
}

function blank() {
  return {
    entries: [],
    portal: '',
    affairHall: '',
    serviceHall: '',
    bookingHall: '',
    eduSystem: '',
    stuSystem: '',
    webvpn: '',
    linkLabels: { ...defaultLinkLabels },
    apps: [],
    hotServices: [],
    services: [],
    bookingHallItems: [],
    serviceHallItems: [],
    departments: [],
    vpnBusiness: [],
    vpnLibrary: [],
    netFee: { title: '网费服务', url: '', calc: '', tips: [], rechargeTime: '', contacts: [], note: '' },
    stuSystemMenu: { name: '学生管理系统', groups: [] },
    eduSystemMenu: { name: '教务服务', sections: [] },
  }
}

const form = ref(blank())

function merge(data) {
  const base = blank()
  const result = { ...base, ...data }
  result.linkLabels = { ...base.linkLabels, ...(data.linkLabels || {}) }
  result.netFee = { ...base.netFee, ...(data.netFee || {}) }
  result.stuSystemMenu = { ...base.stuSystemMenu, ...(data.stuSystemMenu || {}) }
  result.eduSystemMenu = { ...base.eduSystemMenu, ...(data.eduSystemMenu || {}) }
  for (const key of ['entries', 'apps', 'hotServices', 'services', 'bookingHallItems', 'serviceHallItems', 'departments', 'vpnBusiness', 'vpnLibrary']) {
    result[key] = Array.isArray(result[key]) ? result[key] : []
  }
  // 老数据还没有 entries：从 7 个固定入口迁一份出来
  if (!result.entries.length && !Array.isArray(data.entries)) {
    result.entries = entriesFromLegacy(result)
  }
  applyEntriesToLegacy(result)
  result.netFee.tips = Array.isArray(result.netFee.tips) ? result.netFee.tips : []
  result.netFee.contacts = Array.isArray(result.netFee.contacts) ? result.netFee.contacts : []
  result.stuSystemMenu.groups = Array.isArray(result.stuSystemMenu.groups) ? result.stuSystemMenu.groups : []
  result.eduSystemMenu.sections = Array.isArray(result.eduSystemMenu.sections) ? result.eduSystemMenu.sections : []
  return result
}

async function load() {
  loading.value = true
  try {
    const result = await api('/digital-campus')
    form.value = merge(result.digitalCampus || {})
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form.value }
    payload.entries = (payload.entries || []).filter((x) => {
      if (typeof x === 'string') return x.trim()
      return x && (String(x.name || '').trim() || String(x.url || '').trim())
    })
    applyEntriesToLegacy(payload)
    await api('/digital-campus', { method: 'PUT', body: payload })
    form.value = merge(payload)
    savedAt.value = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    notify('数字校园内容已保存')
  } catch (error) {
    notify(error.message, 'error')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.tab-pane { animation: fade 0.2s ease; }
@keyframes fade { from { opacity: 0.4; } to { opacity: 1; } }
.link-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.two-col { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; }
.sub-title { font-size: 11px; font-weight: 700; color: var(--a-muted); margin: 14px 0 7px; letter-spacing: 0.04em; }
.row-table { display: flex; flex-direction: column; gap: 6px; }
.edit-row { display: flex; gap: 6px; align-items: center; }
.edit-row .a-input:first-child { flex: 1.2; }
.edit-row .a-input { flex: 1; }
.menu-head { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
.menu-head .a-input:first-child { flex: 1.2; }
.menu-head .a-input:nth-child(2) { flex: 1; }
.menu-head .a-input[type='color'] { width: 42px; flex: none; }
.sub-card { border: 1px solid var(--a-border); border-radius: 11px; padding: 12px; margin-top: 10px; background: #fdfbf6; }
.dept-card { border: 1px solid var(--a-border); border-radius: 10px; padding: 10px; margin-bottom: 8px; background: #fdfbf6; }
.dept-head { display: flex; gap: 6px; margin-bottom: 6px; }
.dept-head .a-input { flex: 1; font-weight: 600; }
.dept-fields { display: grid; grid-template-columns: 1.3fr 1fr 0.8fr 1fr 1.2fr; gap: 5px; }
@media (max-width: 900px) {
  .link-grid, .two-col { grid-template-columns: 1fr; }
  .dept-fields { grid-template-columns: 1fr 1fr; }
  .menu-head { flex-wrap: wrap; }
}
</style>
