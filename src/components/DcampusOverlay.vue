<template>
  <div class="dc-overlay" @keydown.escape="handleEsc">
    <div class="dc-overlay-header">
      <button class="dc-back-btn" @click="subFeature ? (subFeature = null) : selectedFeature ? (selectedFeature = null) : $emit('close')" title="返回">
        <i class="fa-solid fa-arrow-left"></i>
        <span class="back-label">地图</span>
      </button>
      <div class="content-panel-icon" style="background:var(--primary);color:#fff;">
        <i class="fa-solid fa-graduation-cap"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div class="dc-overlay-title">{{ subFeature ? otherServices.find(s=>s.id===subFeature)?.title : selectedFeature ? selectedFeature.title : '数字校园' }}</div>
        <div class="dc-overlay-sub" v-if="!selectedFeature">校园服务一站式入口</div>
      </div>
    </div>

    <!-- ======== 功能网格 ======== -->
    <div v-if="!selectedFeature" class="dc-overlay-body">
      <div class="dc-search-wrap">
        <i class="fa-solid fa-magnifying-glass dc-search-icon"></i>
        <input v-model="filterQuery" class="dc-search-input" type="text" placeholder="搜索功能服务..." />
        <button v-if="filterQuery" class="dc-search-clear" @click="filterQuery = ''"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <h3 class="dc-section-label"><i class="fa-solid fa-th-large"></i> 功能服务</h3>
      <div class="dc-feature-grid">
        <button v-for="feat in filteredFeatures" :key="feat.id" class="dc-feature-card" @click="selectedFeature = feat">
          <div class="dc-feature-icon" :style="{ background: feat.bgColor, color: feat.color }">
            <i :class="feat.icon"></i>
          </div>
          <div class="dc-feature-name">{{ feat.name }}</div>
          <div class="dc-feature-desc">{{ feat.desc }}</div>
          <div class="dc-feature-arrow"><i class="fa-solid fa-chevron-right"></i></div>
        </button>
        <div v-if="filteredFeatures.length === 0" class="dc-no-results">未找到匹配的功能服务</div>
      </div>
    </div>

    <!-- ======== 校历 ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'calendar'" class="dc-overlay-body">
      <div class="cal-hero"><div class="cal-year-badge">{{ calendar.title }}</div></div>
      <div class="cal-timeline">
        <div v-for="item in calendar.items" :key="item.event" class="cal-event">
          <div class="cal-event-dot"></div>
          <div class="cal-event-content">
            <div class="cal-event-name">{{ item.event }}</div>
            <div class="cal-event-date">{{ item.date }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ======== 统一信息门户 ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'portal'" class="dc-overlay-body">
      <a :href="digitalCampus.portal" target="_blank" class="dc-portal-link">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开统一信息门户
      </a>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-grid-2"></i> 应用中心</div>
        <div class="dc-tag-grid">
          <a :href="digitalCampus.portal" target="_blank" v-for="app in digitalCampus.apps" :key="app" class="dc-tag">{{ app }}</a>
        </div>
      </div>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-fire"></i> 热门服务</div>
        <div class="dc-tag-grid">
          <a :href="digitalCampus.affairHall" target="_blank" v-for="s in digitalCampus.hotServices" :key="s" class="dc-tag dc-tag-hot">{{ s }}</a>
        </div>
      </div>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-address-book"></i> 部门服务</div>
        <div class="dc-dept-list">
          <div v-for="dept in digitalCampus.departments" :key="dept.name" class="dc-dept-card">
            <div class="dc-dept-name">{{ dept.name }}</div>
            <div class="dc-dept-meta">
              <span v-if="dept.addr"><i class="fa-solid fa-location-dot"></i> {{ dept.addr }}</span>
              <span v-if="dept.tel"><i class="fa-solid fa-phone"></i> {{ dept.tel }}</span>
              <span v-if="dept.email"><i class="fa-solid fa-envelope"></i> {{ dept.email }}</span>
              <a v-if="dept.web" :href="dept.web" target="_blank"><i class="fa-solid fa-globe"></i> 网站</a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ======== 教务系统 ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'edu'" class="dc-overlay-body">
      <a :href="digitalCampus.eduSystem" target="_blank" class="dc-portal-link">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开教务系统
      </a>
      <div v-if="digitalCampus.eduSystemMenu">
        <div v-for="sec in digitalCampus.eduSystemMenu.sections" :key="sec.name" class="edu-card">
          <div class="edu-card-header">
            <span class="edu-card-icon">
              <i :class="sec.icon || 'fa-solid fa-circle'"></i>
            </span>
            <span class="edu-card-title">{{ sec.name }}</span>
            <span class="edu-card-count">{{ sec.items.length }} 项</span>
          </div>
          <div class="menu-tag-grid">
            <span v-for="item in sec.items" :key="item" class="menu-tag">{{ item }}</span>
          </div>
        </div>
      </div>
      <p v-else style="margin-top:14px;font-size:13px;color:var(--fg-muted);">选课 · 成绩查询 · 网上评教 · 我的课表 · 等级考试报名</p>
    </div>

    <!-- ======== 学生管理系统 ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'stu'" class="dc-overlay-body">
      <a :href="digitalCampus.stuSystem" target="_blank" class="dc-portal-link">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开学生管理系统
      </a>
      <div v-if="digitalCampus.stuSystemMenu">
        <div v-for="group in digitalCampus.stuSystemMenu.groups" :key="group.name" class="edu-card">
          <div class="edu-card-header">
            <span class="edu-card-icon">
              <i :class="group.icon || 'fa-solid fa-circle'"></i>
            </span>
            <span class="edu-card-title">{{ group.name }}</span>
            <span class="edu-card-count">{{ group.items.length }} 项</span>
          </div>
          <div class="menu-tag-grid">
            <span v-for="item in group.items" :key="item" class="menu-tag">{{ item }}</span>
          </div>
        </div>
      </div>
      <p v-else style="margin-top:14px;font-size:13px;color:var(--fg-muted);">日常请假 · 假期去向 · 评优申请 · 助学金/奖学金申请 · 德育档案</p>
    </div>

    <!-- ======== 办事大厅 ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'booking'" class="dc-overlay-body">
      <a :href="digitalCampus.affairHall" target="_blank" class="dc-portal-link">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开办事大厅
      </a>
      <div class="hall-section" style="margin-top:16px;">
        <div class="hall-header">
          <i class="fa-solid fa-list-check"></i>
          <span>服务大厅</span>
          <a :href="digitalCampus.serviceHall" target="_blank" class="hall-link">进入 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>
        <div v-if="digitalCampus.serviceHallItems" class="dc-link-list">
          <div v-for="s in digitalCampus.serviceHallItems" :key="s.name" class="dc-link-item dc-link-plain">
            <i class="fa-solid fa-chevron-right"></i><span>{{ s.name }}</span><span class="dc-url-hint">{{ s.dept }}</span>
          </div>
        </div>
      </div>
      <div class="hall-section">
        <div class="hall-header">
          <i class="fa-solid fa-calendar-check"></i>
          <span>预约大厅</span>
          <a :href="digitalCampus.bookingHall" target="_blank" class="hall-link">进入 <i class="fa-solid fa-arrow-up-right-from-square"></i></a>
        </div>
        <div v-if="digitalCampus.bookingHallItems" class="dc-link-list">
          <div v-for="s in digitalCampus.bookingHallItems" :key="s.name" class="dc-link-item dc-link-plain">
            <i class="fa-solid fa-chevron-right"></i><span>{{ s.name }}</span><span class="dc-url-hint">{{ s.dept }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ======== 部门信息 ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'depts'" class="dc-overlay-body">
      <div class="dc-dept-list">
        <div v-for="dept in digitalCampus.departments" :key="dept.name" class="dc-dept-card">
          <div class="dc-dept-name">{{ dept.name }}</div>
          <div class="dc-dept-meta">
            <span v-if="dept.addr"><i class="fa-solid fa-location-dot"></i> {{ dept.addr }}</span>
            <span v-if="dept.tel"><i class="fa-solid fa-phone"></i> {{ dept.tel }}</span>
            <span v-if="dept.email"><i class="fa-solid fa-envelope"></i> {{ dept.email }}</span>
            <a v-if="dept.web" :href="dept.web" target="_blank"><i class="fa-solid fa-globe"></i> 网站</a>
          </div>
        </div>
      </div>
    </div>

    <!-- ======== VPN ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'vpn'" class="dc-overlay-body">
      <a :href="digitalCampus.webvpn" target="_blank" class="dc-portal-link">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开 WEBvpn
      </a>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-network-wired"></i> 业务系统</div>
        <div class="dc-link-list">
          <a v-for="sys in digitalCampus.vpnBusiness" :key="sys.name" :href="'http://'+sys.url" target="_blank" class="dc-link-item">
            <i class="fa-solid fa-server"></i><span>{{ sys.name }}</span><i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </div>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-book"></i> 图书资源</div>
        <div class="dc-link-list">
          <a v-for="res in digitalCampus.vpnLibrary" :key="res.name" :href="'http://'+res.url" target="_blank" class="dc-link-item">
            <i class="fa-solid fa-database"></i><span>{{ res.name }}</span><i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </div>
    </div>

    <!-- ======== 其他服务 ======== -->
    <div v-if="selectedFeature && selectedFeature.id === 'other' && !subFeature" class="dc-overlay-body">
      <div class="dc-feature-grid">
        <button v-for="svc in otherServices" :key="svc.id" class="dc-feature-card" @click="subFeature = svc.id">
          <div class="dc-feature-icon" :style="{ background: svc.bgColor, color: svc.color }">
            <i :class="svc.icon"></i>
          </div>
          <div class="dc-feature-name">{{ svc.name }}</div>
          <div class="dc-feature-desc">{{ svc.desc }}</div>
          <div class="dc-feature-arrow"><i class="fa-solid fa-chevron-right"></i></div>
        </button>
      </div>
    </div>

    <!-- ======== 网费服务 ======== -->
    <div v-if="(selectedFeature && selectedFeature.id === 'netfee') || (selectedFeature && selectedFeature.id === 'other' && subFeature === 'netfee')" class="dc-overlay-body">
      <a :href="digitalCampus.netFee.url" target="_blank" class="dc-portal-link">
        <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开网费服务
      </a>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-calculator"></i> 计费标准</div>
        <p style="padding:14px 18px;font-size:13px;color:var(--fg);line-height:1.7;">{{ digitalCampus.netFee.calc }}</p>
      </div>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-lightbulb"></i> 充值贴士</div>
        <div style="padding:10px 18px;">
          <div v-for="t in digitalCampus.netFee.tips" :key="t" style="padding:8px 0;font-size:13px;color:var(--fg);border-bottom:1px solid var(--bg-deep);display:flex;align-items:flex-start;gap:8px;">
            <i class="fa-solid fa-circle-check" style="color:var(--primary-light);margin-top:2px;flex-shrink:0;"></i>
            <span>{{ t }}</span>
          </div>
        </div>
      </div>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-clock"></i> 充值时间</div>
        <p style="padding:14px 18px;font-size:13px;color:var(--fg);">{{ digitalCampus.netFee.rechargeTime }}</p>
      </div>
      <div class="info-card-section">
        <div class="info-card-header"><i class="fa-solid fa-address-book"></i> 联系方式</div>
        <div style="padding:10px 18px;">
          <div v-for="c in digitalCampus.netFee.contacts" :key="c" style="padding:8px 0;font-size:13px;color:var(--fg);border-bottom:1px solid var(--bg-deep);">{{ c }}</div>
        </div>
      </div>
      <div class="info-card-section" style="background:#FFF8E1;border-color:#FFE082;">
        <div class="info-card-header" style="background:#FFF8E1;color:#F57F17;"><i class="fa-solid fa-triangle-exclamation"></i> 注意</div>
        <p style="padding:14px 18px;font-size:12px;color:#827717;line-height:1.6;">{{ digitalCampus.netFee.note }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  calendar: Object,
  digitalCampus: Object
})
defineEmits(['close', 'navigate'])

const selectedFeature = ref(null)
const subFeature = ref(null)
const filterQuery = ref('')

const filteredFeatures = computed(() => {
  if (!filterQuery.value.trim()) return features
  const q = filterQuery.value.trim().toLowerCase()
  return features.filter(f => {
    if (f.name.toLowerCase().includes(q)) return true
    if (f.desc.toLowerCase().includes(q)) return true
    // search inside sub-items
    if (f.id === 'portal') {
      if (props.digitalCampus.apps.some(a => a.toLowerCase().includes(q))) return true
      if (props.digitalCampus.hotServices.some(s => s.toLowerCase().includes(q))) return true
      if (props.digitalCampus.departments.some(d => d.name.toLowerCase().includes(q) || (d.addr||'').toLowerCase().includes(q) || (d.tel||'').includes(q))) return true
    }
    if (f.id === 'edu') {
      const menu = props.digitalCampus.eduSystemMenu
      if (menu) for (const sec of menu.sections) { if (sec.name.toLowerCase().includes(q)) return true; if (sec.items.some(i => i.toLowerCase().includes(q))) return true }
    }
    if (f.id === 'stu') {
      const menu = props.digitalCampus.stuSystemMenu
      if (menu) for (const g of menu.groups) { if (g.name.toLowerCase().includes(q)) return true; if (g.items.some(i => i.toLowerCase().includes(q))) return true }
    }
    if (f.id === 'booking') {
      if (props.digitalCampus.serviceHallItems?.some(s => s.name.toLowerCase().includes(q) || (s.dept||'').toLowerCase().includes(q))) return true
      if (props.digitalCampus.bookingHallItems?.some(s => s.name.toLowerCase().includes(q) || (s.dept||'').toLowerCase().includes(q))) return true
      if (props.digitalCampus.hotServices.some(s => s.toLowerCase().includes(q))) return true
    }
    if (f.id === 'depts') {
      if (props.digitalCampus.departments.some(d => d.name.toLowerCase().includes(q) || (d.addr||'').toLowerCase().includes(q) || (d.tel||'').includes(q))) return true
    }
    if (f.id === 'other') {
      if (otherServices.some(s => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))) return true
    }
    if (f.id === 'netfee') {
      const nf = props.digitalCampus.netFee
      if (nf && (nf.calc.toLowerCase().includes(q) || nf.tips.some(t => t.toLowerCase().includes(q)) || nf.rechargeTime.toLowerCase().includes(q) || nf.contacts.some(c => c.toLowerCase().includes(q)) || nf.note.toLowerCase().includes(q))) return true
    }
    if (f.id === 'vpn') {
      if (props.digitalCampus.vpnBusiness?.some(v => v.name.toLowerCase().includes(q) || v.url.toLowerCase().includes(q))) return true
      if (props.digitalCampus.vpnLibrary?.some(v => v.name.toLowerCase().includes(q) || v.url.toLowerCase().includes(q))) return true
    }
    return false
  })
})

const features = [
  { id: 'calendar', name: '校历', desc: '查看学期安排与关键日期', icon: 'fa-solid fa-calendar-days', bgColor: '#D8F3DC', color: '#1B4332', title: '校历' },
  { id: 'portal', name: '统一信息门户', desc: '应用中心 · 部门服务 · 热门服务', icon: 'fa-solid fa-building-columns', bgColor: '#D6EAF8', color: '#1A5276', title: '统一信息门户' },
  { id: 'edu', name: '教务系统', desc: '选课 · 成绩 · 评教 · 课表', icon: 'fa-solid fa-graduation-cap', bgColor: '#FDEBD0', color: '#935116', title: '教务系统' },
  { id: 'stu', name: '学生管理系统', desc: '请假 · 评优 · 资助 · 档案', icon: 'fa-solid fa-user-graduate', bgColor: '#FADBD8', color: '#943126', title: '学生管理系统' },
  { id: 'booking', name: '办事大厅', desc: '宿舍报修 · 寒暑假留校 · 调换退宿', icon: 'fa-solid fa-clipboard-list', bgColor: '#F9E79F', color: '#7D6608', title: '办事大厅' },
  { id: 'vpn', name: 'WebVPN', desc: '校外访问校内系统与资源', icon: 'fa-solid fa-shield-halved', bgColor: '#D5F5E3', color: '#145A32', title: 'WebVPN' },
  { id: 'depts', name: '部门信息', desc: '各部门地址·电话·网站', icon: 'fa-solid fa-address-book', bgColor: '#EDE7F6', color: '#301934', title: '部门信息' },
  { id: 'other', name: '其他服务', desc: '网费充值等更多服务', icon: 'fa-solid fa-ellipsis', bgColor: '#ECEFF1', color: '#546E7A', title: '其他服务' }
]

const otherServices = [
  { id: 'netfee', name: '网费服务', desc: '充值 · 计费标准 · 常见问题', icon: 'fa-solid fa-wifi', bgColor: '#E0F7FA', color: '#006064', title: '网费服务' }
]

function handleEsc() {
  if (subFeature.value) { subFeature.value = null; return }
  if (selectedFeature.value) selectedFeature.value = null
}
</script>

<style scoped>
.dc-overlay { position:fixed; inset:0; z-index:195; display:flex; flex-direction:column; background:var(--bg); overflow-y:auto; padding-top:56px; animation:overlayEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes overlayEnter { from { opacity:0; transform:scale(0.97); filter:blur(4px); } to { opacity:1; transform:scale(1); filter:blur(0); } }
.dc-overlay-header { display:flex; align-items:center; gap:12px; padding:12px 24px; background:rgba(255,255,255,0.92); backdrop-filter:blur(16px) saturate(1.4); border-bottom:1px solid var(--border); flex-shrink:0; }
.dc-overlay-title { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(14px,3.5vw,20px); color:var(--primary); }
.dc-overlay-sub { font-size:12px; color:var(--fg-muted); }
.dc-back-btn { width:38px; height:38px; border-radius:10px; border:1.5px solid var(--border); background:var(--card); cursor:pointer; font-size:16px; color:var(--primary); display:flex; align-items:center; justify-content:center; transition:all 0.25s; flex-shrink:0; position:relative; overflow:hidden; }
.dc-back-btn:hover { width:60px; background:var(--primary); color:#fff; border-color:var(--primary); }
.dc-back-btn .back-label { font-size:0; font-weight:600; transition:font-size 0.25s; white-space:nowrap; }
.dc-back-btn:hover .back-label { font-size:12px; }
.dc-back-btn:hover i { display:none; }
.content-panel-icon { width:clamp(32px,7vw,48px); height:clamp(32px,7vw,48px); border-radius:clamp(8px,1.8vw,12px); display:flex; align-items:center; justify-content:center; font-size:clamp(14px,3.5vw,21px); flex-shrink:0; }
.dc-overlay-body { padding:clamp(10px,2.5vw,20px); max-width:800px; margin:0 auto; width:100%; }
.dc-search-wrap { position:relative; margin-bottom:20px; }
.dc-search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--fg-muted); font-size:15px; }
.dc-search-input { width:100%; padding:10px 40px; border:2px solid var(--border); border-radius:10px; font-size:14px; font-family:inherit; background:var(--card); color:var(--fg); outline:none; transition:border-color 0.3s,box-shadow 0.3s; }
.dc-search-input:focus { border-color:var(--primary); box-shadow:0 0 0 4px var(--primary-pale); }
.dc-search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--fg-muted); cursor:pointer; font-size:14px; padding:4px; border-radius:4px; }
.dc-search-clear:hover { color:var(--primary); background:var(--bg-deep); }
.dc-no-results { grid-column:1/-1; text-align:center; padding:30px; color:var(--fg-muted); font-size:13px; }
.dc-section-label { font-size:13px; font-weight:700; color:var(--fg-muted); margin-bottom:14px; display:flex; align-items:center; gap:8px; text-transform:uppercase; letter-spacing:0.5px; }

/* 功能卡片 */
.dc-feature-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:400px) { .dc-feature-grid { gap:6px; } }
.dc-feature-card { position:relative; display:flex; flex-direction:column; align-items:flex-start; gap:clamp(3px,0.8vw,6px); padding:clamp(9px,2vw,14px) clamp(9px,2vw,16px); background:var(--card); border:2px solid var(--border); border-radius:var(--radius-sm); cursor:pointer; text-align:left; font-family:inherit; transition:all 0.25s ease; }
.dc-feature-card:hover { border-color:var(--primary); box-shadow:0 8px 24px var(--shadow-strong); transform:translateY(-3px); }
.dc-feature-icon { width:clamp(22px,4.5vw,32px); height:clamp(22px,4.5vw,32px); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:clamp(10px,1.8vw,14px); flex-shrink:0; }
.dc-feature-name { font-weight:700; font-size:clamp(10px,1.8vw,13px); color:var(--primary); }
.dc-feature-desc { font-size:clamp(9px,1.5vw,11px); color:var(--fg-muted); line-height:1.4; }
.dc-feature-arrow { position:absolute; right:12px; bottom:12px; font-size:9px; color:var(--border); transition:all 0.2s; }
.dc-feature-card:hover .dc-feature-arrow { color:var(--primary); right:8px; }

/* 标签网格 */
.dc-tag-grid { display:flex; flex-wrap:wrap; gap:8px; }
.dc-tag { padding:8px 14px; background:var(--card); border:1.5px solid var(--border); border-radius:8px; font-size:13px; color:var(--fg); font-weight:500; transition:all 0.2s ease; text-decoration:none; }
.dc-tag:hover { border-color:var(--primary); background:var(--primary-pale); box-shadow:0 2px 8px var(--shadow-xs); }
a.dc-tag { cursor:pointer; }

/* 门户链接按钮 */
.dc-portal-link { display:inline-flex; align-items:center; gap:6px; padding:10px 18px; background:var(--primary); color:#fff; border-radius:10px; font-size:13px; font-weight:600; text-decoration:none; transition:all 0.25s ease; box-shadow:0 4px 14px rgba(27,67,50,0.25); }
.dc-portal-link:hover { background:var(--primary-light); }
.dc-tag-hot { border-color:var(--primary-light); background:var(--primary-pale); color:var(--primary); }

/* 链接列表 */
.dc-link-list { display:flex; flex-direction:column; gap:6px; }
.dc-link-item { display:flex; align-items:center; gap:10px; padding:12px 14px; background:var(--card); border:1.5px solid var(--border); border-radius:8px; text-decoration:none; color:var(--primary); font-weight:500; font-size:13px; transition:all 0.2s ease; }
a.dc-link-item:hover { border-color:var(--primary); background:var(--primary-pale); box-shadow:0 2px 8px var(--shadow-xs); transform:translateY(-1px); }
a.dc-link-item .fa-arrow-up-right-from-square { margin-left:auto; font-size:10px; color:var(--fg-muted); }
.dc-link-plain { cursor:default; }
.dc-url-hint { margin-left:auto; font-size:11px; color:var(--fg-muted); font-weight:400; }

/* 部门卡片 */
.dc-dept-list { display:flex; flex-direction:column; gap:8px; }
.dc-dept-card { padding:14px 16px; background:var(--card); border:1.5px solid var(--border); border-radius:8px; transition:border-color 0.2s ease; } .dc-dept-card:hover { border-color:var(--primary-light); }
.dc-dept-name { font-weight:700; font-size:14px; color:var(--primary); margin-bottom:6px; }
.dc-dept-meta { display:flex; flex-wrap:wrap; gap:12px; font-size:11px; color:var(--fg-muted); }
.dc-dept-meta span, .dc-dept-meta a { display:inline-flex; align-items:center; gap:3px; }
.dc-dept-meta a { color:var(--primary-light); text-decoration:none; }
.dc-dept-meta a:hover { text-decoration:underline; }

/* 校历 */
.cal-hero { text-align:center; padding:20px 0 30px; }
.cal-year-badge { display:inline-block; background:var(--primary); color:#fff; font-weight:700; font-size:14px; padding:8px 24px; border-radius:20px; }
.cal-timeline { position:relative; padding-left:28px; border-left:2px solid var(--primary-pale); margin-left:10px; }
.cal-event { position:relative; margin-bottom:16px; }
.cal-event-dot { position:absolute; left:-35px; top:8px; width:12px; height:12px; border-radius:50%; background:var(--primary); border:2px solid #fff; box-shadow:0 0 0 2px var(--primary); }
.cal-event-content { background:var(--card); border:1px solid var(--bg-deep); border-radius:var(--radius-sm); padding:14px 18px; transition:border-color 0.2s; }
.cal-event-content:hover { border-color:var(--primary-light); }
.cal-event-name { font-weight:700; font-size:14px; color:var(--primary); margin-bottom:4px; }
.cal-event-date { font-size:12px; color:var(--fg-muted); }
.menu-section { margin-bottom:18px; }
.menu-section-title { font-size:13px; font-weight:700; color:var(--primary); margin-bottom:10px; padding-bottom:6px; border-bottom:2px solid var(--primary-pale); }
.menu-tag-grid { display:flex; flex-wrap:wrap; gap:6px; }
.menu-tag { padding:5px 12px; background:var(--card); border:1px solid var(--border); border-radius:6px; font-size:12px; color:var(--fg); font-weight:500; }
.hall-section { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; margin-bottom:12px; }
.hall-header { display:flex; align-items:center; gap:10px; padding:14px 18px; background:var(--primary); font-weight:700; font-size:14px; color:#fff; }
.hall-link { margin-left:auto; font-size:11px; font-weight:600; color:rgba(255,255,255,0.8); text-decoration:none; display:flex; align-items:center; gap:4px; opacity:0.8; transition:opacity 0.2s; }
.hall-link:hover { opacity:1; }
.hall-section .dc-link-list { padding:8px 12px; }
.hall-section .dc-link-item { border:none; background:none; }
.info-card-section { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; margin-top:20px; }
.dc-portal-link + .info-card-section { margin-top:16px; }
.info-card-header { display:flex; align-items:center; gap:10px; padding:14px 18px; background:var(--primary); font-weight:700; font-size:14px; color:#fff; }
.info-card-section .dc-tag-grid { padding:12px; }
.info-card-section .dc-dept-list { padding:8px 12px; }
.info-card-section .dc-link-list { padding:8px 12px; }
.info-card-section .menu-section { margin:0; padding:16px; }
.info-card-section .menu-section + .menu-section { border-top:1px solid var(--bg-deep); }
.edu-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; margin-top:16px; transition:all 0.25s ease; }
.edu-card:hover { border-color:var(--primary-light); box-shadow:0 4px 20px var(--shadow-strong); }
.edu-card-header { display:flex; align-items:center; gap:10px; padding:14px 18px; background:var(--primary); border-bottom:1px solid var(--primary-light); }
.edu-card-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; background:rgba(255,255,255,0.2); color:#fff; }
.edu-card-title { font-weight:700; font-size:14px; color:#fff; }
.edu-card-count { margin-left:auto; font-size:11px; color:rgba(255,255,255,0.7); font-weight:500; }
.edu-card .menu-tag-grid { padding:12px; }
</style>
