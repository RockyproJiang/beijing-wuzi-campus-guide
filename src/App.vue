<template>
  <div>
    <div class="bg-decor">
      <div class="bg-blob"></div>
      <div class="bg-blob"></div>
      <div class="bg-blob"></div>
    </div>
    <NavBar
      :scrolled="scrolled"
      :activeSection="activeSection"
      @scroll-to-top="scrollToTop"
      @scroll-to-map="scrollToMap"
      @open-browse="openOverlay('browse')"
      @open-dcampus="openOverlay('dcampus')"
      @open-about="openOverlay('about')"
    />

    <section class="hero" id="hero" :key="heroKey" :class="{ 'hero-leaving': heroLeaving }">
      <div class="hero-decor-dots"></div>
      <div class="hero-decor-glow"></div>
      <div class="hero-decor-ring"></div>
      <div class="hero-content">
        <div class="hero-badge"><i class="fa-solid fa-graduation-cap"></i> 校园生活一点通</div>
        <h1>
          <span class="hero-char" v-for="(c,i) in '北京物资学院'.split('')" :key="i" :style="{animationDelay: (0.3 + i*0.06) + 's'}">{{c}}</span>
        </h1>
        <p class="hero-subtitle">校园指南</p>
        <p class="hero-desc">快速查找教学楼、宿舍、食堂、运动场等校园设施信息</p>
        <div class="hero-actions">
          <button class="hero-cta" @click="scrollToMap">
            <span>开始使用</span>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button class="hero-about-btn" @click="openOverlay('about')" title="关于本项目">
            <i class="fa-solid fa-circle-info"></i>
          </button>
        </div>
      </div>
      <div class="hero-icons">
        <i class="fa-solid fa-building-columns" style="--i:0"></i>
        <i class="fa-solid fa-utensils" style="--i:1"></i>
        <i class="fa-solid fa-dumbbell" style="--i:2"></i>
        <i class="fa-solid fa-book-open" style="--i:3"></i>
        <i class="fa-solid fa-flask" style="--i:4"></i>
        <i class="fa-solid fa-tree" style="--i:5"></i>
      </div>
      <div class="hero-wave">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,60 C360,100 720,0 1440,60 L1440,80 L0,80 Z" fill="var(--bg)"/>
        </svg>
      </div>
    </section>

    <div class="page-content" :class="{ 'content-enter': heroLeaving || contentEnter }">

    <MapSection
      :categories="categories"
      :mapAnimKey="mapAnimKey"
      :facilityCategories="facilityCategories"
      :specialCategory="specialCategory"
      :visibleMapBuildings="visibleMapBuildings"
      :searchQuery="searchQuery"
      :searchResults="searchResults"
      :searchFocused="searchFocused"
      :mapFilter="mapFilter"
      :tooltip="tooltip"
      :mapLoading="mapLoading"
      @update:searchQuery="searchQuery = $event"
      @focus-search="searchFocused = true"
      @blur-search="onSearchBlur"
      @clear-search="searchQuery = ''; searchFocused = false"
      @select-result="selectSearchResult"
      @update:mapFilter="mapFilter = $event"
      @marker-click="onMapMarkerClick"
      @show-tooltip="showTooltip"
      @hide-tooltip="hideTooltip"
      @map-loaded="mapLoading = false"
      @map-error="onMapError"
    />

    <div class="home-disclaimer">
      <h4><i class="fa-solid fa-triangle-exclamation"></i> 免责声明</h4>
      <p>本指南为个人整理项目，非学校官方发布，信息可能存在遗漏或误差。部分信息可能因学校安排临时变更，请以现场通知为准。如发现错误请联系维护者修正。</p>
    </div>

    <FooterSection @scroll-to-map="scrollToMap" @open-browse="openOverlay('browse')" @open-dcampus="openOverlay('dcampus')" @open-about="openOverlay('about')" />

    </div><!-- /page-content -->

    <!-- Overlay backdrop + single transition -->
    <div v-if="showBrowse || showDcampus || showAbout" class="overlay-backdrop">
      <BrowseOverlay
        v-show="showBrowse"
        :key="'browse-'+overlayKeys.browse"
        :browseCategories="facilityCategories"
        :allBuildings="allBuildings"
        :activeCategoryId="activeCategoryId"
        :activeCategory="activeCategory"
        :selectedBldgId="selectedBldgId"
        :selectedBldg="selectedBldg"
        :l2tab="l2tab"
        :tips="tips"
        @close="showBrowse = false; selectedBldgId = null; closeOverlay()"
        @navigate="openOverlay($event)"
        @select-category="selectCategory"
        @select-building="id => selectBuilding(id)"
        @update:l2tab="l2tab = $event"
      />
      <DcampusOverlay
        v-show="showDcampus"
        :key="'dcampus-'+overlayKeys.dcampus"
        :calendar="calendar"
        :digitalCampus="digitalCampus"
        @close="showDcampus = false; closeOverlay()"
        @navigate="openOverlay($event)"
      />
      <AboutOverlay
        v-show="showAbout"
        :key="'about-'+overlayKeys.about"
        @close="showAbout = false; closeOverlay()"
        @navigate="openOverlay($event)"
      />
    </div>

    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-item">{{ t.msg }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import CAMPUS_DATA from '../data.js'
import NavBar from './components/NavBar.vue'
import MapSection from './components/MapSection.vue'
import FooterSection from './components/FooterSection.vue'
import BrowseOverlay from './components/BrowseOverlay.vue'
import DcampusOverlay from './components/DcampusOverlay.vue'
import AboutOverlay from './components/AboutOverlay.vue'
import OverlayFooter from './components/OverlayFooter.vue'

const categories = CAMPUS_DATA.categories
const calendar = CAMPUS_DATA.calendar
const digitalCampus = CAMPUS_DATA.digitalCampus
const tips = CAMPUS_DATA.tips

const scrolled = ref(false)
const activeSection = ref('home')
const prevSection = ref('home')
const activeCategoryId = ref('teaching')
const selectedBldgId = ref(null)
const l2tab = ref('info')
const showBrowse = ref(false)
const showDcampus = ref(false)
const showAbout = ref(false)
const overlayKeys = ref({ browse: 0, dcampus: 0, about: 0 })
const heroLeaving = ref(false)
const contentEnter = ref(false)
const mapAnimKey = ref(0)
const heroKey = ref(0)

function closeOverlay() {
  activeSection.value = 'map'
  const el = document.getElementById('map')
  if (el) {
    const top = el.getBoundingClientRect().top + window.scrollY - 74
    window.scrollTo({ top, behavior: 'instant' })
  }
  contentEnter.value = true
  setTimeout(() => { contentEnter.value = false }, 800)
}

function openOverlay(name) {
  prevSection.value = activeSection.value
  showBrowse.value = (name === 'browse')
  showDcampus.value = (name === 'dcampus')
  showAbout.value = (name === 'about')
  activeSection.value = name
  if (name === 'browse') overlayKeys.value.browse++
  else if (name === 'dcampus') overlayKeys.value.dcampus++
  else if (name === 'about') overlayKeys.value.about++
}

const searchQuery = ref('')
const searchFocused = ref(false)
const mapFilter = ref(null)
const mapLoading = ref(true)
const tooltip = ref({ show: false, x: 0, y: 0, text: '' })
const toasts = ref([])
let tc = 0

const facilityCategories = computed(() =>
  categories.filter(c => c.id !== 'special')
)

const specialCategory = computed(() =>
  categories.find(c => c.id === 'special') || null
)

const allBuildings = computed(() => {
  const list = []
  for (const cat of categories)
    for (const b of cat.buildings)
      list.push({ ...b, catName: cat.name, catId: cat.id })
  return list
})

// alias dictionary: keyword → [building ids]
const searchAliases = {
  '打印': ['b1'], '复印': ['b1'], '文印': ['b1'], '证件照': ['b1'], '胶装': ['b1'], '扫描': ['b1'], '塑封': ['b1'], '装订': ['b1'], '彩印': ['b1'], '价格': ['b1'], '价目表': ['b1'], '70g': ['b1'], '双面': ['b1'],
  '健身': ['b26a'], '单杠': ['b26a'], '双杠': ['b26a'], '举重': ['b26a'], '器材': ['b26a'],
  '咖啡': ['b21', 'b22', 'b23', 'b24'], '库迪': ['b21'], '幸运咖': ['b22'], '蜜雪冰城': ['b23'], '瑞幸': ['b23'],
  '火锅': ['b22'], '麻辣烫': ['b22'], '兰州拉面': ['b22'], '牛肉拉面': ['b22'],
  '洗衣机': ['b15'], '吹风机': ['b15'], '微波炉': ['b15'],
  '充电': ['b12', 'b13', 'b14', 'b15'], '充电桩': ['b12', 'b13', 'b14', 'b15'],
  '猫': ['b60'], '猫咪': ['b60'], '小猫': ['b60'], '自然': ['b62'], '景观': ['b62'], '树': ['b62'],
  '洗澡': ['b35', 'b36'], '浴室': ['b35', 'b36'], '澡堂': ['b35', 'b36'], '淋浴': ['b35', 'b36'],
  '理发': ['b37'], '美发': ['b37'], '剪头': ['b37'], '美甲': ['b37'],
  '修手机': ['b40'], '修电脑': ['b40'], '联通': ['b40'], '手机维修': ['b40'],
  '开会': ['b1', 'b2'], '报告厅': ['b2'], '自习': ['b28'], '借书': ['b28'], '图书': ['b28'],
  '补卡': ['b55'], '充值': ['b55'], '校园卡': ['b55'],
  '超市': ['b34'], '购物': ['b34'], '便利店': ['b1', 'b2', 'b15'],
  '取快递': ['b33'], '寄快递': ['b33'], '快递柜': ['b33'], '发货': ['b33'], '顺丰': ['b33'], '京东': ['b33'], '邮政': ['b33'], '中通': ['b33'], '申通': ['b33'],
  '外卖': ['b38', 'b39', 'b59'],
  '篮球': ['b26a'], '排球': ['b26b'], '网球': ['b26c'], '棒球': ['b26d'], '足球': ['b25'], '跑步': ['b25'], '操场': ['b25'],
  '看病': ['b32'], '买药': ['b32'], '急诊': ['b32'], '医院': ['b32'],
  '银行': ['b55'], 'ATM': ['b55'],
  '停车': ['b41', 'b64'], '地下停车': ['b64'],
  '团委': ['b6'], '学生会': ['b6'], '学生处': ['b6', 'b7'], '教务处': ['b7'],
  '外语': ['b7'], '经济': ['b7'], '国贸': ['b7'], '金融': ['b7'],
  '会计': ['b8b'], '商学院': ['b8b'], 'MBA': ['b8b'], '物流': ['b8c'], '供应链': ['b8c'], '智能工程': ['b8c'],
  '计算机': ['b8a'], '人工智能': ['b8a'], '统计': ['b8a'],
  '监控': ['b21t'], '教学监控': ['b21t'],
  '羽毛球': ['b27'], '乒乓球': ['b27'], '瑜伽': ['b27'], '健身': ['b26a', 'b27'], '体能': ['b27'],
  '厕所': ['b63'], '洗手间': ['b63'], '卫生间': ['b63'],
  '高尔夫': ['b49'], '新宿舍': ['b50'], 'golf': ['b49']
}

function getSearchText(b) {
  const parts = [b.name, b.sub, b.catName]
  // info
  if (b.info) for (const i of b.info) { parts.push(i.label, i.value) }
  // equipment
  if (b.equipment) for (const e of b.equipment) {
    parts.push(e.name)
    if (e.details) for (const d of e.details) { parts.push(d.label, d.value) }
  }
  // floors
  if (b.floors) for (const f of b.floors) {
    parts.push(f.name, f.desc || '')
    if (f.highlights) parts.push(...f.highlights)
    if (f.layout) parts.push(...Object.values(f.layout))
    if (f.rooms) for (const r of f.rooms) { parts.push(r.number, r.name) }
  }
  // contacts
  if (b.contacts) for (const c of b.contacts) { parts.push(c.label, c.value) }
  // surroundings
  if (b.surroundings) for (const s of b.surroundings) { parts.push(s.name, s.desc) }
  // schedule
  if (b.schedule) parts.push(b.schedule)
  return parts.join(' ').toLowerCase()
}

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const q = searchQuery.value.trim().toLowerCase()

  // 1. alias matches
  const aliasIds = new Set()
  for (const [keyword, ids] of Object.entries(searchAliases)) {
    if (keyword.includes(q) || q.includes(keyword)) {
      for (const id of ids) aliasIds.add(id)
    }
  }
  const aliasMatches = allBuildings.value.filter(b => aliasIds.has(b.id))

  // 2. full-text fuzzy matches (excluding alias matches)
  const textMatches = allBuildings.value.filter(b => {
    if (aliasIds.has(b.id)) return false
    return getSearchText(b).includes(q)
  })

  return [...aliasMatches, ...textMatches].slice(0, 8)
})

const excludeCategories = ['other', 'special']

const visibleMapBuildings = computed(() =>
  allBuildings.value.filter(b => {
    if (mapFilter.value) {
      return b.catId === mapFilter.value
    }
    if (b.mapHidden) return false
    // default: show only facility categories
    return !excludeCategories.includes(b.catId)
  })
)

const activeCategory = computed(() =>
  categories.find(c => c.id === activeCategoryId.value) || categories[0]
)

const selectedBldg = computed(() => {
  if (!selectedBldgId.value) return null
  for (const cat of categories) {
    const b = cat.buildings.find(b => b.id === selectedBldgId.value)
    if (b) return b
  }
  return null
})

function addToast(msg) {
  const id = ++tc
  toasts.value.push({ id, msg })
  setTimeout(() => {
    const i = toasts.value.findIndex(t => t.id === id)
    if (i > -1) toasts.value.splice(i, 1)
  }, 2200)
}

function selectCategory(catId) {
  activeCategoryId.value = catId
  selectedBldgId.value = null
  l2tab.value = 'info'
}

function selectBuilding(bldgId) {
  if (selectedBldgId.value === bldgId) {
    selectedBldgId.value = null
    return
  }
  selectedBldgId.value = bldgId
  for (const cat of categories) {
    if (cat.buildings.find(b => b.id === bldgId)) {
      activeCategoryId.value = cat.id
      break
    }
  }
  l2tab.value = 'info'
}

function selectSearchResult(r) {
  searchQuery.value = ''
  searchFocused.value = false
  selectedBldgId.value = r.id
  for (const cat of categories) {
    if (cat.buildings.find(b => b.id === r.id)) {
      activeCategoryId.value = cat.id
      break
    }
  }
  l2tab.value = 'info'
  openOverlay('browse')
}

function onSearchBlur() { setTimeout(() => { searchFocused.value = false }, 150) }

function onMapMarkerClick(b) {
  selectedBldgId.value = b.id
  for (const cat of categories) {
    if (cat.buildings.find(bx => bx.id === b.id)) {
      activeCategoryId.value = cat.id
      break
    }
  }
  l2tab.value = 'info'
  openOverlay('browse')
  addToast('已定位到：' + b.name)
}

function showTooltip(e, b) {
  const rect = e.target.closest('.map-img-wrap').getBoundingClientRect()
  tooltip.value = { show: true, x: e.clientX - rect.left, y: e.clientY - rect.top, text: b.name + ' · ' + b.catName }
}

function hideTooltip() { tooltip.value.show = false }

function onMapError() {
  mapLoading.value = false
  addToast('地图图片加载失败，请检查 main.png 路径')
}

function scrollToTop() {
  showBrowse.value = false; showDcampus.value = false; showAbout.value = false
  activeSection.value = 'home'
  heroLeaving.value = false
  heroKey.value++
  window.scrollTo({ top: 0, behavior: 'instant' })
}
function scrollToMap() {
  if (activeSection.value === 'map') return // already on map
  showBrowse.value = false; showDcampus.value = false; showAbout.value = false
  activeSection.value = 'map'
  mapAnimKey.value++
  heroLeaving.value = true
  setTimeout(() => {
    const el = document.getElementById('map')
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 74
      window.scrollTo({ top, behavior: 'instant' })
    }
    setTimeout(() => { heroLeaving.value = false }, 400)
  }, 500)
}
const contentKey = ref(0)

function bubbleStyle(i) {
  const seed = (i * 2654435761) >>> 0 // simple hash
  const rand = (n) => ((seed * (n+1) * 1103515245 + 12345) >>> 0) % 1000 / 1000
  const size = (60 + rand(0) * 80) + 'px'
  return {
    left: ((i * 23 + 11) % 100) + '%',
    width: size,
    height: size,
    animationDelay: (i * 2.5 + rand(1) * 6) + 's',
    animationDuration: (20 + rand(2) * 18) + 's',
    opacity: 0.06 + rand(3) * 0.1,
    // start at random vertical position
    '--start-y': (-10 - rand(4) * 100) + '%'
  }
}

function onScroll() {
  scrolled.value = window.scrollY > 20
  if (!showBrowse.value && !showDcampus.value && !showAbout.value) {
    const mapEl = document.getElementById('map')
    if (mapEl && mapEl.offsetTop > 0 && window.scrollY >= mapEl.offsetTop - 200) {
      if (activeSection.value !== 'map') mapAnimKey.value++
      activeSection.value = 'map'
    } else if (window.scrollY < 100) {
      activeSection.value = 'home'
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll)
  // Detect scroll position after browser restores it (bfcache / refresh)
  const checkScroll = () => {
    const mapEl = document.getElementById('map')
    if (mapEl && mapEl.offsetTop > 0 && window.scrollY >= mapEl.offsetTop - 200) {
      if (activeSection.value !== 'map') mapAnimKey.value++
      activeSection.value = 'map'
    }
  }
  setTimeout(checkScroll, 100)
  setTimeout(() => { checkScroll(); if (activeSection.value === 'map') mapAnimKey.value++ }, 500)
  window.addEventListener('pageshow', checkScroll)
  setTimeout(() => addToast('点击地图标记或搜索栏定位建筑'), 1500)
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<style>
:root {
  --bg: #F5F0E8; --bg-deep: #EDE6D8; --fg: #1A1A2E; --fg-muted: #6B6B80;
  --primary: #1B4332; --primary-light: #2D6A4F; --primary-pale: #D8F3DC;
  --accent: #D4A853; --accent-glow: #E8C56D;
  --card: #FFFFFF; --border: #D5CEBC;
  --shadow-xs: rgba(27,67,50,0.04); --shadow-sm: rgba(27,67,50,0.07);
  --shadow: rgba(27,67,50,0.10); --shadow-strong: rgba(27,67,50,0.18);
  --shadow-lg: rgba(27,67,50,0.22); --radius: 16px; --radius-sm: 10px; --radius-xs: 6px;
  --sidebar-w: 300px; --nav-h: 56px;
  --ease-out: cubic-bezier(0.22, 0.61, 0.36, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
* { margin:0; padding:0; box-sizing:border-box; }
html { scroll-behavior:smooth; }
body { font-family:'Noto Sans SC',sans-serif; background:#F5F0E8; color:var(--fg); overflow-x:hidden; line-height:1.6; -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; text-rendering:optimizeLegibility; }
::selection { background:var(--primary-pale); color:var(--primary); }
::-webkit-scrollbar { width:6px; height:6px; }
::-webkit-scrollbar-track { background:transparent; }
::-webkit-scrollbar-thumb { background:var(--border); border-radius:3px; }
::-webkit-scrollbar-thumb:hover { background:var(--fg-muted); }
::focus-visible { outline:2px solid var(--primary-light); outline-offset:2px; border-radius:4px; }
/* ====== 背景装饰 ====== */
.bg-decor { position:fixed; inset:0; pointer-events:none; z-index:0; overflow:hidden; }
.bg-blob { position:absolute; filter:blur(clamp(40px,8vw,70px)); opacity:0.3; animation-timing-function:ease-in-out; animation-iteration-count:infinite; }
.bg-blob:nth-child(1) { width:clamp(280px,50vw,550px); height:clamp(280px,50vw,550px); background:rgba(195,228,205,0.4); top:10%; left:5%; border-radius:60% 40% 55% 45%; animation-name:blob1Path, blobMorph; animation-duration:40s, 12s; }
.bg-blob:nth-child(2) { width:clamp(240px,42vw,460px); height:clamp(240px,42vw,460px); background:rgba(180,220,195,0.35); top:40%; right:10%; border-radius:45% 55% 40% 60%; animation-name:blob2Path, blobMorph; animation-duration:35s, 12s; animation-delay:-10s, -4s; }
.bg-blob:nth-child(3) { width:clamp(260px,45vw,500px); height:clamp(260px,45vw,500px); background:rgba(200,230,210,0.32); bottom:15%; left:30%; border-radius:50% 45% 60% 40%; animation-name:blob3Path, blobMorph; animation-duration:45s, 12s; animation-delay:-20s, -8s; }
@keyframes blob1Path { 0%{top:10%;left:5%} 15%{top:25%;left:35%} 30%{top:8%;left:55%} 45%{top:30%;left:40%} 60%{top:15%;left:20%} 75%{top:5%;left:45%} 90%{top:20%;left:15%} 100%{top:10%;left:5%} }
@keyframes blob2Path { 0%{top:40%;right:10%} 20%{top:20%;right:30%} 40%{top:50%;right:5%} 60%{top:35%;right:25%} 80%{top:10%;right:15%} 100%{top:40%;right:10%} }
@keyframes blob3Path { 0%{bottom:15%;left:30%} 18%{bottom:35%;left:10%} 36%{bottom:10%;left:50%} 54%{bottom:40%;left:25%} 72%{bottom:20%;left:45%} 90%{bottom:30%;left:8%} 100%{bottom:15%;left:30%} }
@keyframes blobMorph { 0%{border-radius:60% 40% 55% 45%} 25%{border-radius:35% 65% 50% 50%} 50%{border-radius:55% 45% 60% 40%} 75%{border-radius:50% 55% 40% 60%} 100%{border-radius:60% 40% 55% 45%} }

/* ====== Hero ====== */
.hero { position:relative; z-index:1; height:calc(100vh - 56px); margin-top:56px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 24px 8vh; overflow:hidden; isolation:isolate; }

/* 装饰圆点 */
.hero-decor-dots { position:absolute; inset:0; pointer-events:none; background-image:radial-gradient(circle, var(--primary-pale) 1.5px, transparent 1.5px), radial-gradient(circle, rgba(27,67,50,0.08) 1px, transparent 1px); background-size:60px 60px, 30px 30px; background-position:0 0, 15px 15px; opacity:0.5; mask-image:radial-gradient(ellipse 70% 60% at 50% 45%, black 35%, transparent 75%); -webkit-mask-image:radial-gradient(ellipse 70% 60% at 50% 45%, black 35%, transparent 75%); }
.hero-decor-glow { position:absolute; inset:0; pointer-events:none; z-index:0; background:radial-gradient(ellipse 60% 45% at 50% 40%, rgba(212,168,83,0.08) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 30% 60%, rgba(45,106,79,0.06) 0%, transparent 60%), radial-gradient(ellipse 40% 30% at 70% 50%, rgba(27,67,50,0.05) 0%, transparent 60%); animation:heroGlowShift 12s ease-in-out infinite alternate; }
@keyframes heroGlowShift { 0% { transform:scale(1) translate(0,0); } 100% { transform:scale(1.05) translate(-2%,-1%); } }
.hero-decor-ring { position:absolute; width:60vmin; height:60vmin; border-radius:50%; border:1px solid rgba(27,67,50,0.06); top:50%; left:50%; transform:translate(-50%,-50%); pointer-events:none; z-index:0; animation:heroRingPulse 6s ease-in-out infinite; }
.hero-decor-ring::before { content:''; position:absolute; inset:-8vmin; border-radius:50%; border:1px solid rgba(212,168,83,0.04); animation:heroRingPulse 6s ease-in-out 2s infinite; }
.hero-decor-ring::after { content:''; position:absolute; inset:-16vmin; border-radius:50%; border:1px solid rgba(27,67,50,0.03); animation:heroRingPulse 6s ease-in-out 4s infinite; }
@keyframes heroRingPulse { 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(1.02); opacity:0.6; } }



.hero-content { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; position:relative; z-index:2; }
.hero-badge { display:inline-flex; align-items:center; gap:6px; padding:7px 18px; border-radius:20px; background:linear-gradient(135deg, var(--primary-pale), #E8F5E9); color:var(--primary); font-size:13px; font-weight:600; margin-bottom:8px; border:1px solid rgba(27,67,50,0.12); animation:badgeIn 0.6s var(--ease-out) both; }
@keyframes badgeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }

/* 逐字动画 */
.hero h1 { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(26px,7vw,56px); color:var(--primary); line-height:1.15; letter-spacing:0.02em; }
.hero-char { display:inline-block; animation:charIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) both; text-shadow:0 2px 12px rgba(27,67,50,0.06); }
@keyframes charIn { from { opacity:0; transform:translateY(30px) scale(0.9); filter:blur(4px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }

.hero-subtitle { font-family:'Noto Serif SC',serif; font-weight:700; font-size:clamp(14px,3.5vw,24px); color:var(--primary-light); margin-top:-4px; animation:fadeUp 0.6s 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.hero-desc { color:var(--fg-muted); font-size:clamp(11px,1.8vw,15px); max-width:500px; margin-top:12px; animation:fadeUp 0.6s 1s cubic-bezier(0.22, 0.61, 0.36, 1) both; line-height:1.7; }
@keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

.hero-actions { display:flex; align-items:center; gap:10px; margin-top:28px; animation:fadeUp 0.6s 1.2s cubic-bezier(0.22, 0.61, 0.36, 1) both; }
.hero-cta { position:relative; display:inline-flex; align-items:center; gap:10px; padding:15px 38px; border-radius:14px; border:none; background:linear-gradient(135deg, var(--primary), var(--primary-light)); color:#fff; font-size:16px; font-weight:700; font-family:inherit; cursor:pointer; transition:all 0.35s cubic-bezier(0.22, 0.61, 0.36, 1); box-shadow:0 4px 24px rgba(27,67,50,0.35), 0 0 0 0 rgba(27,67,50,0.3); overflow:hidden; }
.hero-cta::before { content:""; position:absolute; inset:0; background:linear-gradient(135deg, var(--accent), transparent 60%); opacity:0; transition:opacity 0.4s; }
.hero-cta:hover { transform:translateY(-3px); box-shadow:0 8px 36px rgba(27,67,50,0.45), 0 0 0 8px rgba(27,67,50,0.06), 0 0 30px rgba(212,168,83,0.15); }
.hero-cta:hover::before { opacity:0.12; }
.hero-cta:hover { transform:translateY(-3px); box-shadow:0 8px 36px rgba(27,67,50,0.45), 0 0 0 8px rgba(27,67,50,0.06), 0 0 20px rgba(212,168,83,0.15); }
.hero-cta:active { transform:translateY(-1px); }
.hero-cta i { font-size:14px; animation:bounceDown 1.6s ease infinite; }
@keyframes bounceDown { 0%,100% { transform:translateY(0); } 50% { transform:translateY(5px); } }

.hero-about-btn { width:46px; height:46px; border-radius:50%; border:2px solid var(--border); background:var(--card); color:var(--fg-muted); font-size:18px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.3s; flex-shrink:0; }
.hero-about-btn:hover { border-color:var(--accent); color:var(--accent); background:var(--primary-pale); transform:rotate(-15deg) scale(1.05); box-shadow:0 0 20px rgba(212,168,83,0.2); }

/* ====== Hero 离开动画 ====== */
.hero-leaving { pointer-events:none; }
.hero-leaving .hero-content { animation:heroFadeOut 0.9s cubic-bezier(0.4, 0, 0.2, 1) both; }
.hero-leaving .hero-decor-dots { animation:heroDotsFade 0.9s ease both; }

@keyframes heroFadeOut {
  0% { opacity:1; transform:scale(1); filter:blur(0); }
  100% { opacity:0; transform:scale(1.08); filter:blur(12px); }
}
@keyframes heroDotsFade {
  0% { opacity:0.35; }
  100% { opacity:0; }
}
@keyframes heroBlobsOut {
  0% { opacity:1; }
  100% { opacity:0; }
}

/* ====== 地图区域入场 ====== */
.page-content { position:relative; z-index:2; min-height:50vh; }
.page-content::before { content:''; position:fixed; inset:0; pointer-events:none; z-index:-1;
  background-image: radial-gradient(circle, rgba(27,67,50,0.03) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity:0.6;
}
.page-content.content-enter { animation:contentFadeIn 0.7s 0.3s cubic-bezier(0.4, 0, 0.2, 1) both; }
.hero::after { content:''; position:absolute; bottom:0; left:0; right:0; height:clamp(40px,8vw,80px); background:linear-gradient(to bottom, transparent, var(--bg)); pointer-events:none; z-index:2; }
@keyframes contentFadeIn {
  0% { opacity:0; transform:translateY(30px); filter:blur(6px); }
  100% { opacity:1; transform:translateY(0); filter:blur(0); }
}
.section-title { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(16px,3.5vw,24px); color:var(--primary); margin-bottom:6px; letter-spacing:0.01em; }
.section-sub { font-size:clamp(11px,1.8vw,13px); color:var(--fg-muted); margin-bottom:20px; line-height:1.5; }

.toast-stack { position:fixed; bottom:24px; right:24px; z-index:999; display:flex; flex-direction:column; gap:10px; pointer-events:none; }

/* ====== Overlay backdrop ====== */
.overlay-backdrop { position:fixed; inset:0; z-index:194; background:var(--bg); display:flex; flex-direction:column; }
.overlay-backdrop > .panel-enter-active,
.overlay-backdrop > .panel-leave-active { flex:1; min-height:0; overflow:hidden; }
.overlay-backdrop > .panel-enter-active > *,
.overlay-backdrop > .panel-leave-active > * { height:100%; }

/* ====== Panel transitions ====== */
.panel-enter-active { animation:panelIn 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
.panel-leave-active { animation:panelOut 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes panelIn { from { opacity:0; transform:scale(0.96) translateY(8px); filter:blur(6px); } to { opacity:1; transform:scale(1) translateY(0); filter:blur(0); } }
@keyframes panelOut { from { opacity:1; transform:scale(1); filter:blur(0); } to { opacity:0; transform:scale(0.97); filter:blur(4px); } }
.toast-item { background:var(--primary); color:#fff; padding:12px 20px; border-radius:12px; font-size:13px; box-shadow:0 8px 32px var(--shadow-lg); animation:toastIn 0.35s ease; pointer-events:auto; line-height:1.4; }
@keyframes toastIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
#map { scroll-margin-top: 74px; }
.home-disclaimer { max-width:1200px; margin:0 auto 30px; padding:0 24px; }
.home-disclaimer h4 { font-size:12px; color:#F57F17; margin-bottom:6px; font-weight:600; }
.home-disclaimer p { font-size:11px; color:var(--fg-muted); line-height:1.6; }
/* Hero floating icons */
.hero-icons { position:absolute; inset:0; pointer-events:none; overflow:hidden; z-index:0; }
.hero-icons i { position:absolute; font-size:clamp(18px,3.5vw,30px); color:var(--primary); opacity:0.05; animation:heroIconFloat 18s ease-in-out infinite; }
.hero-icons i:nth-child(1) { top:18%; left:6%; animation-delay:-2s; }
.hero-icons i:nth-child(2) { top:30%; right:8%; animation-delay:-6s; }
.hero-icons i:nth-child(3) { top:55%; left:4%; animation-delay:-10s; }
.hero-icons i:nth-child(4) { top:22%; right:4%; animation-delay:-14s; }
.hero-icons i:nth-child(5) { top:60%; right:15%; animation-delay:-4s; }
.hero-icons i:nth-child(6) { top:70%; left:15%; animation-delay:-8s; }

@keyframes heroIconFloat {
  0%,100% { transform:translateY(0) rotate(0deg); opacity:0.05; }
  25% { transform:translateY(-18px) rotate(6deg); opacity:0.08; }
  50% { transform:translateY(6px) rotate(-4deg); opacity:0.05; }
  75% { transform:translateY(-8px) rotate(3deg); opacity:0.07; }
}

/* Hero wave divider */
.hero-wave { position:absolute; bottom:0; left:0; right:0; height:clamp(30px,5vw,60px); z-index:3; pointer-events:none; }
.hero-wave svg { width:100%; height:100%; display:block; }

/* Rich section titles */
.section-title-wrap { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
.section-title-deco { flex:1; height:1px; background:linear-gradient(90deg, var(--accent), transparent); max-width:60px; }
.section-title { margin-bottom:0; }

/* Empty state enrichment */
.empty-illustration { position:relative; width:80px; height:80px; margin:0 auto 16px; }
.empty-illustration .empty-icon-main { font-size:56px; color:var(--primary-pale); position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }
.empty-illustration .empty-icon-accent { font-size:22px; color:var(--primary); position:absolute; bottom:0; right:2px; animation:emptyPointer 1.5s ease-in-out infinite; }
@keyframes emptyPointer {
  0%,100% { transform:translateY(0) rotate(0deg); }
  50% { transform:translateY(-6px) rotate(10deg); }
}
.empty-hints { display:flex; gap:10px; justify-content:center; margin-top:16px; flex-wrap:wrap; }
.empty-hints span { font-size:11px; color:var(--fg-muted); background:var(--bg); padding:5px 14px; border-radius:20px; display:inline-flex; align-items:center; gap:5px; border:1px solid var(--border); }

/* Disclaimer decorative icon */
.home-disclaimer h4 i { animation:disclaimerPulse 2s ease-in-out infinite; }
@keyframes disclaimerPulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
</style>




