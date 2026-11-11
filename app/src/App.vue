<template>
  <div class="app-root">
    <NavBar
      :scrolled="scrolled"
      :activeSection="activeSection"
      @scroll-to-top="goHome"
      @scroll-to-map="enterMap"
      @open-browse="openBrowseOverlay"
      @open-dcampus="openOverlay('dcampus')"
      @open-about="openOverlay('about')"
    />

    <section id="hero" class="hero3d" :class="{ 'map-mode': mapMode }">
      <Campus3D
        ref="campusRef"
        :buildings="allBuildings"
        :map-mode="mapMode"
        :filter-category="mapFilter || ''"
        :filter-color="mapFilterColor"
        :selected-id="selectedBldgId || ''"
        @select="on3dSelect"
        @background="on3dBackground"
        @walk="on3dWalk"
      />

      <transition name="heroFade">
        <div v-if="!mapMode" class="hero-content">
          <div class="hero-badge"><i class="fa-solid fa-graduation-cap"></i> 校园生活一点通</div>
          <h1>
            <span
              v-for="(c, i) in heroTitleChars"
              :key="i"
              class="hero-char"
              :style="{ animationDelay: (0.25 + i * 0.055) + 's' }"
            >{{ c }}</span>
          </h1>
          <p class="hero-subtitle">校园指南</p>
          <p class="hero-desc">拖动即可环视三维校园，进入地图后查找教学楼、宿舍、食堂与运动场</p>
          <div class="hero-actions">
            <button class="hero-cta" @click="enterMap">
              <span>开始使用</span>
              <i class="fa-solid fa-arrow-down"></i>
            </button>
            <button class="hero-about-btn" title="关于本项目" @click="openOverlay('about')">
              <i class="fa-solid fa-circle-info"></i>
            </button>
          </div>
          <div class="hero-hint">
            <i class="fa-solid fa-hand-pointer"></i>
            拖动旋转 · 点击建筑查看详情
          </div>
        </div>
      </transition>

      <transition name="uiFade">
        <div v-if="mapMode" class="map-ui">
          <div class="map-toolbar" :class="{ collapsed: mapCardCollapsed }">
            <div ref="mapToolbarRef" class="map-card">
            <div class="map-toolbar-head">
              <span class="map-head-badge"><i class="fa-solid fa-map-location-dot"></i></span>
              <div class="map-head-text">
                <div class="map-title">三维校园地图</div>
                <div class="map-status">{{ mapStatusText }}</div>
              </div>
              <div class="map-head-actions">
                <!-- 常规的绿色圆角文字按钮，落在右上角「×」的左侧 -->
                <button
                  ref="collapseBtnRef"
                  class="map-collapse"
                  :title="mapCardCollapsed ? '展开检索卡片' : '收起检索卡片'"
                  :aria-expanded="!mapCardCollapsed"
                  @click="mapCardCollapsed ? expandMapCard() : collapseMapCard()"
                >
                  <i class="fa-solid" :class="mapCardCollapsed ? 'fa-plus' : 'fa-minus'"></i>
                  <span>{{ mapCardCollapsed ? '展开' : '收起' }}</span>
                </button>
                <button
                  class="map-close"
                  title="返回标题"
                  @click="goHome"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            <div v-show="!mapCardCollapsed" class="map-toolbar-body">
              <div class="map-search-wrap">
                <i class="fa-solid fa-magnifying-glass map-search-icon"></i>
                <input
                  v-model="searchQuery"
                  class="map-search-input"
                  type="text"
                  placeholder="搜索建筑、设施或服务..."
                  @focus="searchFocused = true"
                  @blur="onSearchBlur"
                  @input="onMapSearchInput"
                />
                <button v-if="searchQuery" class="map-search-clear" @mousedown.prevent="clearSearch">
                  <i class="fa-solid fa-xmark"></i>
                </button>
                <div v-if="searchFocused && searchResults.length > 0" class="map-search-dropdown">
                  <button
                    v-for="r in searchResults"
                    :key="r.id"
                    class="map-search-item"
                    @mousedown.prevent="selectSearchResult(r)"
                  >
                    <span class="map-search-item-icon" :style="{ background: r.bgColor, color: r.color }">
                      <i :class="r.icon"></i>
                    </span>
                    <span class="map-search-item-text">
                      <span class="map-search-item-name">{{ r.name }}</span>
                      <span class="map-search-item-cat">{{ r.catName }}</span>
                    </span>
                  </button>
                </div>
              </div>

              <div class="map-filter-row">
                <button
                  class="map-chip"
                  :class="{ active: !mapFilter }"
                  @click="mapFilter = null"
                >全部</button>
                <button
                  v-for="cat in mapCategories"
                  :key="cat.id"
                  class="map-chip"
                  :class="{ active: mapFilter === cat.id }"
                  :style="mapFilter === cat.id ? { background: cat.color, borderColor: cat.color, color: '#fff' } : {}"
                  @click="mapFilter = mapFilter === cat.id ? null : cat.id"
                >
                  <i :class="cat.icon"></i>{{ cat.name }}
                </button>
              </div>

              <div class="map-toolbar-foot">
                <span><i class="fa-solid fa-location-dot"></i> 点击建筑或站点查看详情</span>
                <button v-if="mapFilter" class="map-reset-filter" @click="mapFilter = null">清除筛选</button>
              </div>
            </div>
            </div>

            <!-- 胶囊：常驻在卡片右沿，和右侧工具卡把手完全同款；卡片宽度收到 0 时它留在屏幕左沿 -->
            <button
              class="map-pull"
              :title="mapCardCollapsed ? '展开检索卡片' : '收起检索卡片'"
              :aria-label="mapCardCollapsed ? '展开检索卡片' : '收起检索卡片'"
              @click="mapCardCollapsed ? expandMapCard() : collapseMapCard()"
            >
              <i class="fa-solid" :class="mapCardCollapsed ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
            </button>
          </div>
        </div>
      </transition>
    </section>

    <div class="page-content">
      <div class="home-disclaimer">
        <h4><i class="fa-solid fa-triangle-exclamation"></i> 免责声明</h4>
        <p>本指南为个人整理项目，非学校官方发布，信息可能存在遗漏或误差。部分信息可能因学校安排临时变更，请以现场通知为准。如发现错误请联系维护者修正。</p>
      </div>

      <FooterSection
        @scroll-to-map="enterMap"
        @open-browse="openBrowseOverlay"
        @open-dcampus="openOverlay('dcampus')"
        @open-about="openOverlay('about')"
      />
    </div>

    <!-- Overlay backdrop + panels -->
    <div v-if="showBrowse || showDcampus || showAbout" class="overlay-backdrop">
      <BrowseOverlay
        v-show="showBrowse"
        :key="'browse-' + overlayKeys.browse"
        :browseCategories="facilityCategories"
        :allBuildings="allBuildings"
        :activeCategoryId="activeCategoryId"
        :activeCategory="activeCategory"
        :browseCategoryScopes="browseCategoryScopes"
        :selectedBldgId="selectedBldgId"
        :selectedBldg="selectedBldg"
        :l2tab="l2tab"
        :tips="tips"
        :aliases="aliases"
        :albumPhotos="albumPhotos"
        :groupAlbum="groupAlbum"
        @close="closeBrowse"
        @navigate="openOverlay($event)"
        @select-category="selectCategory"
        @select-building="selectBuilding"
        @update:l2tab="l2tab = $event"
        @locate="onLocate"
      />
      <DcampusOverlay
        v-show="showDcampus"
        :key="'dcampus-' + overlayKeys.dcampus"
        :calendar="calendar"
        :digitalCampus="digitalCampus"
        @close="closeOverlay"
        @navigate="openOverlay($event)"
      />
      <AboutOverlay
        v-show="showAbout"
        :key="'about-' + overlayKeys.about"
        :school-profile="schoolProfile"
        @close="closeOverlay"
        @navigate="openOverlay($event)"
      />
    </div>

    <transition name="locCard">
      <div v-if="located && !showBrowse && !showDcampus && !showAbout" class="loc-card">
        <span class="loc-icon" :style="{ background: located.bgColor, color: located.color }">
          <i :class="located.icon"></i>
        </span>
        <div class="loc-text">
          <div class="loc-name">{{ located.name }}</div>
          <div class="loc-sub">{{ located.sub }} · {{ located.catName }}</div>
        </div>
        <button class="loc-detail" @click="openBuilding(located)">查看详情</button>
        <button class="loc-close" title="关闭" @click="locatedId = null">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </transition>

    <div v-if="picker" class="picker-backdrop" @click.self="picker = null">
      <div class="picker-card">
        <div class="picker-head">
          <div>
            <div class="picker-title">该建筑包含多个条目</div>
            <div class="picker-sub">请选择要查看的内容</div>
          </div>
          <button class="picker-close" @click="picker = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <button v-for="b in picker.items" :key="b.id" class="picker-item" @click="openBuilding(b)">
          <span class="picker-item-icon" :style="{ background: b.bgColor, color: b.color }"><i :class="b.icon"></i></span>
          <span class="picker-item-text">
            <span class="picker-item-name">{{ b.name }}</span>
            <span class="picker-item-sub">{{ b.sub }}</span>
          </span>
          <i class="fa-solid fa-chevron-right picker-item-arrow"></i>
        </button>
      </div>
    </div>

    <div class="toast-stack">
      <div v-for="t in toasts" :key="t.id" class="toast-item">{{ t.msg }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, onUnmounted, ref, watch } from 'vue'
import CAMPUS_DATA from '../data.js'
import NavBar from './components/NavBar.vue'
import Campus3D from './components/Campus3D.vue'
import FooterSection from './components/FooterSection.vue'
import BrowseOverlay from './components/BrowseOverlay.vue'
import DcampusOverlay from './components/DcampusOverlay.vue'
import AboutOverlay from './components/AboutOverlay.vue'

/* ---------------- 数据 ---------------- */
const siteData = ref(CAMPUS_DATA)
const dataSource = ref('fallback')
const categories = computed(() => siteData.value.categories || [])
const calendar = computed(() => siteData.value.calendar || { title: '', items: [] })
const digitalCampus = computed(() => siteData.value.digitalCampus || {})
const schoolProfile = computed(() => siteData.value.schoolProfile || null)
const tips = computed(() => siteData.value.tips || [])
const aliases = computed(() => siteData.value.aliases || [])

const facilityCategories = computed(() => categories.value)
const mapCategories = computed(() => categories.value.filter((c) => c.buildings.length > 0))

/** 当前筛选分类的主题色：光柱用它染色 */
const mapFilterColor = computed(() => {
  if (!mapFilter.value) return '#1B4332'
  const cat = categories.value.find((c) => c.id === mapFilter.value)
  return cat?.color || '#1B4332'
})

// “全部建筑”伪分类：设施速查里可选，但不参与地图筛选与分类栏
const ALL_CAT_ID = '__all__'
const isAllCategory = computed(() => activeCategoryId.value === ALL_CAT_ID)

const allBuildings = computed(() => {
  const list = []
  for (const cat of categories.value) {
    for (const b of cat.buildings) {
      list.push({ ...b, catId: cat.id, catName: cat.name })
    }
  }
  return list
})

const allAsCategory = computed(() => ({
  id: ALL_CAT_ID,
  name: '全部建筑',
  icon: 'fa-solid fa-border-all',
  buildings: allBuildings.value
}))

const browseCategoryScopes = computed(() => {
  if (isAllCategory.value) return allBuildings.value.map((b) => b.catId)
  return [activeCategoryId.value]
})

const buildingById = computed(() => {
  const map = new Map()
  for (const b of allBuildings.value) map.set(b.id, b)
  return map
})

/* ---------------- 楼体相册 ---------------- */
const albumMap = ref({})

async function loadAlbum() {
  try {
    const res = await fetch('/api/album', { headers: { Accept: 'application/json' } })
    if (!res.ok) return
    const data = await res.json()
    // 后端给的是相对路径 path/thumb，转成可直接给 <img> 用的绝对地址
    const toSrc = (p) => (p ? (p.startsWith('/') ? p : `/uploads/album/${p}`) : '')
    const map = {}
    for (const [key, list] of Object.entries(data.buildings || {})) {
      map[key] = (list || []).map((p) => ({
        ...p,
        src: toSrc(p.path),
        thumbSrc: toSrc(p.thumb || p.path),
      }))
    }
    albumMap.value = map
  } catch {
    /* 相册接口不可用时保持为空，不影响主流程 */
  }
}

const albumPhotos = computed(() => (id) => albumMap.value[id] || [])

/** 同分组（分类）下所有建筑的照片，附带楼名，用于「查看全组照片」 */
const groupAlbum = computed(() => (bldg) => {
  if (!bldg) return []
  const catId = bldg.categoryId || bldg.catId
  const out = []
  for (const b of allBuildings.value) {
    if ((b.categoryId || b.catId) !== catId) continue
    const list = albumMap.value[b.id] || []
    for (const p of list) out.push({ ...p, buildingName: b.name, buildingId: b.id })
  }
  return out
})

/* ---------------- 导航 / 视图状态 ---------------- */
const scrolled = ref(false)
const activeSection = ref('home')
const mapMode = ref(false)
const mapCardCollapsed = ref(false)
// 收起后卡片整体左移出屏，屏幕左沿只剩一枚展开胶囊；胶囊竖直位置与展开时的「收起」按钮对齐
const mapToolbarRef = ref(null)
const collapseBtnRef = ref(null)
const pullTop = ref(33)
let toolbarObserver = null

function measureToolbar() {
  const el = mapToolbarRef.value
  if (!el || mapCardCollapsed.value) return
  // 拉手挂在 .map-ui 上（inset:0，但顶部被导航栏顶下来一段），要换算成相对 .map-ui 的坐标
  const host = el.offsetParent?.getBoundingClientRect?.() || { top: 0 }
  const btn = collapseBtnRef.value
  if (btn) {
    // 与「收起」文字按钮严格同一条水平线：胶囊中心 = 按钮中心
    const br = btn.getBoundingClientRect()
    pullTop.value = Math.max(8, Math.round(br.top - host.top + br.height / 2 - 23))
    return
  }
  const r = el.getBoundingClientRect()
  pullTop.value = Math.max(8, Math.round(r.top - host.top + r.height / 2 - 23))
}

function collapseMapCard() {
  // 先量好当前位置再收起，否则卡片折叠后高度变了就对不上
  measureToolbar()
  mapCardCollapsed.value = true
}

function expandMapCard() {
  mapCardCollapsed.value = false
}

onMounted(() => {
  measureToolbar()
  if (typeof ResizeObserver !== 'undefined') {
    toolbarObserver = new ResizeObserver(measureToolbar)
    if (mapToolbarRef.value) toolbarObserver.observe(mapToolbarRef.value)
  }
  window.addEventListener('resize', measureToolbar)
})
onBeforeUnmount(() => {
  toolbarObserver?.disconnect()
  window.removeEventListener('resize', measureToolbar)
})

watch(mapCardCollapsed, (v) => { if (v) measureToolbar() })
watch(mapMode, () => { setTimeout(measureToolbar, 60) })
const campusRef = ref(null)
const searchQuery = ref('')
const searchFocused = ref(false)
const mapFilter = ref(null)
/** 是否处于第一人称漫游：为真时隐藏左右两张地图面板 */
const walkActive = ref(false)
const locatedId = ref('')
const picker = ref(null)

const activeCategoryId = ref('teaching')
const selectedBldgId = ref(null)
const l2tab = ref('info')
const showBrowse = ref(false)
const showDcampus = ref(false)
const showAbout = ref(false)
const overlayKeys = ref({ browse: 0, dcampus: 0, about: 0 })
const toasts = ref([])
let toastSeq = 0

const heroTitleChars = '北京物资学院'.split('')

const located = computed(() => (locatedId.value ? buildingById.value.get(locatedId.value) : null))

const activeCategory = computed(() => {
  if (isAllCategory.value) return allAsCategory.value
  return categories.value.find((c) => c.id === activeCategoryId.value) || categories.value[0]
})

const selectedBldg = computed(() => {
  if (!selectedBldgId.value) return null
  return buildingById.value.get(selectedBldgId.value) || null
})

const mapStatusText = computed(() => {
  if (mapFilter.value) {
    const cat = categories.value.find((c) => c.id === mapFilter.value)
    const n = allBuildings.value.filter((b) => b.catId === mapFilter.value).length
    return `${cat?.name || '筛选'} · ${n} 个建筑`
  }
  return `全部 ${allBuildings.value.length} 个建筑`
})

/* ---------------- 搜索 ---------------- */
function getSearchText(b) {
  const parts = [b.name, b.sub, b.catName, b.intro]
  if (b.aliases && b.aliases.length) parts.push(...b.aliases)
  if (b.info) for (const i of b.info) parts.push(i.label, i.value)
  if (b.equipment) {
    for (const e of b.equipment) {
      parts.push(e.name)
      if (e.details) for (const d of e.details) parts.push(d.label, d.value)
    }
  }
  if (b.floors) {
    for (const f of b.floors) {
      parts.push(f.name, f.desc || '')
      if (f.highlights) parts.push(...f.highlights)
      if (f.layout) parts.push(...Object.values(f.layout))
      if (f.rooms) for (const r of f.rooms) parts.push(r.number, r.name)
    }
  }
  if (b.contacts) for (const c of b.contacts) parts.push(c.label, c.value)
  if (b.surroundings) for (const s of b.surroundings) parts.push(s.name, s.desc || '')
  if (b.schedule) parts.push(b.schedule)
  return parts.filter(Boolean).join(' ').toLowerCase()
}

const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  // 名称命中优先，其余按包含关系
  const nameHits = allBuildings.value.filter((b) => String(b.name || '').toLowerCase().includes(q))
  const aliasIds = new Set()
  for (const alias of aliases.value) {
    if (!alias.keyword) continue
    if (alias.keyword.includes(q) || q.includes(alias.keyword)) {
      for (const id of alias.ids || []) aliasIds.add(id)
    }
  }
  const aliasMatches = allBuildings.value.filter((b) => aliasIds.has(b.id) && !nameHits.includes(b))
  const textMatches = allBuildings.value.filter(
    (b) => !aliasIds.has(b.id) && !nameHits.includes(b) && getSearchText(b).includes(q)
  )
  return [...nameHits, ...aliasMatches, ...textMatches].slice(0, 8)
})

function clearSearch() {
  searchQuery.value = ''
  searchFocused.value = false
}

function onSearchBlur() {
  setTimeout(() => { searchFocused.value = false }, 150)
}

// 输入时就保持下拉展开（清空后再输入也能立刻弹出结果）
function onMapSearchInput() {
  searchFocused.value = Boolean(searchQuery.value.trim())
}

function selectSearchResult(r) {
  searchQuery.value = ''
  searchFocused.value = false
  mapFilter.value = null
  selectedBldgId.value = r.id
  locatedId.value = r.id
  if (r.catId) activeCategoryId.value = r.catId
  mapMode.value = true
  activeSection.value = 'map'
  nextTick(() => {
    campusRef.value?.flyToBuilding(r.id)
    addToast('已定位到：' + r.name)
  })
}

/* ---------------- 3D 交互 ---------------- */
// 一级界面：点建筑先出一张固定的小卡片，需要看详情再点「查看详情」
function on3dSelect(payload) {
  const items = (payload?.items || [])
    .map((id) => buildingById.value.get(id))
    .filter(Boolean)
  if (!items.length) return
  if (items.length > 1) {
    picker.value = { items }
    return
  }
  locatedId.value = items[0].id
  selectedBldgId.value = items[0].id
}

function on3dBackground() {
  picker.value = null
  if (!showBrowse.value && !showDcampus.value && !showAbout.value) {
    locatedId.value = ''
    selectedBldgId.value = null
  }
}

/** 第一人称进出：左右两张卡片只是收起，不是消失，随时能展开 */
let collapsedBeforeWalk = null
function on3dWalk(on) {
  walkActive.value = Boolean(on)
  if (on) {
    collapsedBeforeWalk = mapCardCollapsed.value
    mapCardCollapsed.value = true
  } else if (collapsedBeforeWalk !== null) {
    mapCardCollapsed.value = collapsedBeforeWalk
    collapsedBeforeWalk = null
  }
}

function openBuilding(b) {
  if (!b) return
  picker.value = null
  locatedId.value = b.id
  selectedBldgId.value = b.id
  if (b.catId && !isAllCategory.value) activeCategoryId.value = b.catId
  l2tab.value = 'info'
  mapMode.value = true
  openOverlay('browse')
}

function onLocate(id) {
  const b = buildingById.value.get(id)
  if (!b) return
  showBrowse.value = false
  showDcampus.value = false
  showAbout.value = false
  mapMode.value = true
  activeSection.value = 'map'
  locatedId.value = id
  selectedBldgId.value = id
  if (b.catId) activeCategoryId.value = b.catId
  window.scrollTo({ top: 0, behavior: 'instant' })
  // 从第一人称点「3D 定位」要回到上帝视角再飞过去，否则会被第一人称相机接管
  if (campusRef.value?.isWalking?.()) campusRef.value.exitWalk()
  nextTick(() => campusRef.value?.flyToBuilding(id))
}

/* ---------------- 页面导航 ---------------- */
function enterMap() {
  showBrowse.value = false
  showDcampus.value = false
  showAbout.value = false
  mapCardCollapsed.value = false
  mapMode.value = true
  activeSection.value = 'map'
  window.scrollTo({ top: 0, behavior: 'instant' })
  nextTick(() => campusRef.value?.enterMap())
}

function goHome() {
  showBrowse.value = false
  showDcampus.value = false
  showAbout.value = false
  mapMode.value = false
  activeSection.value = 'home'
  selectedBldgId.value = null
  locatedId.value = ''
  mapFilter.value = null
  searchQuery.value = ''
  window.scrollTo({ top: 0, behavior: 'instant' })
  nextTick(() => campusRef.value?.exitMap())
}

function scrollToContent() {
  const el = document.querySelector('.page-content')
  if (!el) return
  window.scrollTo({ top: el.offsetTop - 56, behavior: 'smooth' })
}

/* ---------------- 覆盖层 ---------------- */
function openBrowseOverlay() {
  openOverlay('browse')
}

function openOverlay(name) {
  showBrowse.value = name === 'browse'
  showDcampus.value = name === 'dcampus'
  showAbout.value = name === 'about'
  activeSection.value = name
  if (name === 'browse') overlayKeys.value.browse++
  else if (name === 'dcampus') overlayKeys.value.dcampus++
  else if (name === 'about') overlayKeys.value.about++
}

function closeBrowse() {
  showBrowse.value = false
  closeOverlay()
}

function closeOverlay() {
  showBrowse.value = false
  showDcampus.value = false
  showAbout.value = false
  if (locatedId.value) {
    mapMode.value = true
    activeSection.value = 'map'
    nextTick(() => campusRef.value?.flyToBuilding(locatedId.value))
  } else {
    mapMode.value = false
    activeSection.value = 'home'
  }
}

function selectCategory(catId) {
  activeCategoryId.value = catId
  selectedBldgId.value = null
  locatedId.value = ''
  l2tab.value = 'info'
}

function selectBuilding(bldgId) {
  if (selectedBldgId.value === bldgId) {
    selectedBldgId.value = null
    return
  }
  selectedBldgId.value = bldgId
  const b = buildingById.value.get(bldgId)
  if (b && !isAllCategory.value) activeCategoryId.value = b.catId
  l2tab.value = 'info'
  locatedId.value = bldgId
}

/* ---------------- 提示 ---------------- */
function addToast(msg) {
  const id = ++toastSeq
  toasts.value.push({ id, msg })
  setTimeout(() => {
    const i = toasts.value.findIndex((t) => t.id === id)
    if (i > -1) toasts.value.splice(i, 1)
  }, 2400)
}

/* ---------------- 滚动 / 生命周期 ---------------- */
function onScroll() {
  scrolled.value = window.scrollY > 20
  if (showBrowse.value || showDcampus.value || showAbout.value) return
  if (window.scrollY < 120) {
    activeSection.value = mapMode.value ? 'map' : 'home'
  }
}

let mounted = false

onMounted(async () => {
  window.addEventListener('scroll', onScroll, { passive: true })
  mounted = true
  try {
    const res = await fetch('/api/site', { headers: { Accept: 'application/json' } })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    if (Array.isArray(data.categories) && data.categories.length) {
      siteData.value = data
      dataSource.value = 'api'
    }
  } catch (error) {
    console.warn('[site] 使用本地回退数据:', error.message)
    addToast('数据服务未连接，正在使用本地缓存')
  }
  loadAlbum()
  setTimeout(() => {
    if (mounted && !mapMode.value) addToast('点击“开始使用”，进入三维校园地图')
  }, 1600)
})

onUnmounted(() => {
  mounted = false
  window.removeEventListener('scroll', onScroll)
})
</script>

<style>
:root {
  --bg: #F5F0E8;
  --bg-deep: #EDE6D8;
  --fg: #1A1A2E;
  --fg-muted: #6B6B80;
  --primary: #1B4332;
  --primary-light: #2D6A4F;
  --primary-pale: #D8F3DC;
  --accent: #D4A853;
  --accent-glow: #E8C56D;
  --card: #FFFFFF;
  --border: #D5CEBC;
  --shadow: rgba(27, 67, 50, 0.08);
  --shadow-strong: rgba(27, 67, 50, 0.16);
  --radius: 16px;
  --radius-sm: 10px;
  --sidebar-w: 300px;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Noto Sans SC', sans-serif;
  background: linear-gradient(180deg, #F8F4EC, #EDE8DC, #F2EDE3);
  color: var(--fg);
  overflow-x: hidden;
  line-height: 1.6;
}
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: -1;
  background:
    radial-gradient(ellipse 80% 50% at 20% 30%, rgba(27, 67, 50, 0.04) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 75% 60%, rgba(212, 168, 83, 0.05) 0%, transparent 50%),
    radial-gradient(ellipse 50% 30% at 50% 80%, rgba(27, 67, 50, 0.03) 0%, transparent 50%);
}
button { font-family: inherit; }

/* ====== 3D Hero ====== */
.hero3d {
  position: relative;
  height: calc(100vh - 56px);
  margin-top: 56px;
  overflow: hidden;
  background: #f1ebdd;
  isolation: isolate;
}
.hero3d::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 2;
  background:
    linear-gradient(180deg, rgba(248, 244, 236, 0.5) 0%, rgba(248, 244, 236, 0.14) 20%, transparent 34%),
    linear-gradient(0deg, rgba(245, 240, 232, 0.45) 0%, transparent 14%);
}
.hero-content {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8vh 24px 0;
  text-align: center;
  pointer-events: none;
}
.hero-content::before {
  content: '';
  position: absolute;
  top: -14%;
  left: 50%;
  transform: translateX(-50%);
  width: min(1040px, 124vw);
  height: 660px;
  /* 底板更实一点：3D 建筑不会顶到字上，保证标题与说明可读 */
  background:
    radial-gradient(ellipse 62% 58% at center 46%, rgba(250, 247, 240, 0.97) 0%, rgba(250, 247, 240, 0.9) 52%, rgba(250, 247, 240, 0.5) 76%, transparent 90%),
    radial-gradient(ellipse at center, rgba(250, 247, 240, 0.6) 0%, transparent 72%);
  filter: blur(14px);
  z-index: -1;
}
.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 18px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(216, 243, 220, 0.95), rgba(232, 245, 233, 0.9));
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 10px;
  border: 1px solid rgba(27, 67, 50, 0.12);
  animation: badgeIn 0.6s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes badgeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.hero-content h1 {
  font-family: 'Noto Serif SC', serif;
  font-weight: 900;
  font-size: clamp(38px, 7.6vw, 72px);
  color: var(--primary);
  line-height: 1.1;
  letter-spacing: 0.03em;
  text-shadow: 0 2px 26px rgba(250, 247, 240, 0.9);
}
.hero-char {
  display: inline-block;
  animation: charIn 0.55s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes charIn {
  from { opacity: 0; transform: translateY(34px) scale(0.92); filter: blur(5px); }
  to { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
}
.hero-subtitle {
  font-family: 'Noto Serif SC', serif;
  font-weight: 700;
  font-size: clamp(17px, 3.4vw, 25px);
  color: var(--primary-light);
  margin-top: -2px;
  letter-spacing: 0.32em;
  text-indent: 0.32em;
  animation: fadeUp 0.6s 0.75s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.hero-desc {
  color: var(--fg-muted);
  font-size: clamp(13px, 2vw, 15.5px);
  max-width: 560px;
  margin-top: 14px;
  animation: fadeUp 0.6s 0.95s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
@keyframes fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
.hero-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 26px;
  pointer-events: auto;
  animation: fadeUp 0.6s 1.1s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.hero-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 38px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
  box-shadow: 0 8px 30px rgba(27, 67, 50, 0.32);
}
.hero-cta:hover { transform: translateY(-3px); box-shadow: 0 12px 38px rgba(27, 67, 50, 0.42); }
.hero-cta i { font-size: 13px; animation: bounceDown 1.7s ease infinite; }
@keyframes bounceDown { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(5px); } }
.hero-about-btn {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 1.5px solid var(--border);
  background: rgba(255, 253, 247, 0.85);
  color: var(--fg-muted);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}
.hero-about-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-pale); transform: rotate(-12deg) scale(1.04); }
.hero-hint {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-top: 18px;
  font-size: 12px;
  color: rgba(107, 107, 128, 0.85);
  animation: fadeUp 0.6s 1.35s cubic-bezier(0.22, 0.61, 0.36, 1) both;
}
.hero-hint i { color: var(--accent); }

.heroFade-leave-active { transition: opacity 0.45s ease, transform 0.45s ease, filter 0.45s ease; }
.heroFade-leave-to { opacity: 0; transform: translateY(-18px) scale(1.02); filter: blur(8px); }

/* ====== 地图 UI ====== */
/* 地图界面的两张卡片样式在 src/styles/map-panels.css 里统一定义 */

.uiFade-enter-active { transition: opacity 0.4s ease, transform 0.4s ease; }
.uiFade-enter-from { opacity: 0; transform: translateY(8px); }
.uiFade-leave-active { transition: opacity 0.25s ease; }
.uiFade-leave-to { opacity: 0; }

/* ====== 内容区 ====== */
.page-content { position: relative; z-index: 2; background: linear-gradient(180deg, #EDE8DC 0%, var(--bg) 34%, #F2EDE3 100%); }
.content-strip {
  max-width: 1200px; margin: 0 auto; padding: 34px 24px 10px;
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
}
.content-strip-item {
  display: flex; align-items: flex-start; gap: 12px; padding: 16px 18px;
  background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(27, 67, 50, 0.08);
  border-radius: 14px;
}
.content-strip-item > i { font-size: 18px; color: var(--primary); margin-top: 2px; }
.content-strip-item strong { display: block; font-size: 13px; color: var(--primary); font-family: 'Noto Serif SC', serif; }
.content-strip-item span { font-size: 11.5px; color: var(--fg-muted); line-height: 1.5; }
.home-disclaimer { max-width: 1200px; margin: 8px auto 0; padding: 0 24px 12px; }
.home-disclaimer h4 { font-size: 12px; color: #F57F17; margin-bottom: 4px; font-weight: 600; }
.home-disclaimer p { font-size: 11px; color: var(--fg-muted); line-height: 1.6; }

/* ====== 定位卡片 ====== */
.loc-card {
  position: fixed; left: 50%; bottom: 58px; transform: translateX(-50%);
  z-index: 190; width: min(430px, calc(100vw - 24px));
  display: flex; align-items: center; gap: 11px; padding: 11px 13px;
  border-radius: 15px; background: rgba(255, 253, 247, 0.96);
  border: 1px solid rgba(27, 67, 50, 0.14); box-shadow: 0 18px 46px rgba(27, 67, 50, 0.22);
  backdrop-filter: blur(14px);
}
.loc-icon { width: 40px; height: 40px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.loc-text { flex: 1; min-width: 0; }
.loc-name { font-weight: 700; font-size: 13.5px; color: var(--primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.loc-sub { font-size: 10.5px; color: var(--fg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.loc-detail {
  flex-shrink: 0; padding: 8px 14px; border-radius: 9px; border: none;
  background: var(--primary); color: #fff; font-size: 11.5px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.loc-detail:hover { background: var(--primary-light); }
.loc-close { flex-shrink: 0; width: 26px; height: 26px; border-radius: 7px; border: none; background: var(--bg); color: var(--fg-muted); cursor: pointer; }
.loc-close:hover { background: var(--bg-deep); color: var(--primary); }
.locCard-enter-active { transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.22, 0.61, 0.36, 1); }
.locCard-enter-from { opacity: 0; transform: translate(-50%, 14px); }
.locCard-leave-active { transition: opacity 0.2s ease; }
.locCard-leave-to { opacity: 0; }

/* ====== 多条目选择 ====== */
.picker-backdrop {
  position: fixed; inset: 0; z-index: 300; display: flex; align-items: center; justify-content: center;
  padding: 20px; background: rgba(20, 32, 25, 0.36); backdrop-filter: blur(5px);
}
.picker-card {
  width: min(430px, 100%); max-height: 80vh; overflow-y: auto;
  background: #fffdf7; border-radius: 18px; padding: 18px;
  border: 1px solid rgba(27, 67, 50, 0.12); box-shadow: 0 30px 80px rgba(20, 32, 25, 0.3);
}
.picker-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.picker-title { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 16px; color: var(--primary); }
.picker-sub { font-size: 11px; color: var(--fg-muted); }
.picker-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: #fff; color: var(--fg-muted); cursor: pointer; }
.picker-item {
  display: flex; align-items: center; gap: 11px; width: 100%; padding: 11px 10px;
  border: 1px solid transparent; border-radius: 11px; background: transparent; cursor: pointer;
  text-align: left; transition: all 0.18s;
}
.picker-item:hover { background: var(--primary-pale); border-color: rgba(27, 67, 50, 0.14); }
.picker-item-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; }
.picker-item-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.picker-item-name { font-size: 13px; font-weight: 700; color: var(--fg); }
.picker-item-sub { font-size: 10.5px; color: var(--fg-muted); }
.picker-item-arrow { color: var(--border); font-size: 10px; }

/* ====== Overlay backdrop ====== */
.overlay-backdrop {
  position: fixed; inset: 0; z-index: 194;
  background: linear-gradient(135deg, rgba(243,238,227,0.62), rgba(216,243,220,0.38));
  backdrop-filter: blur(24px) saturate(1.12);
  -webkit-backdrop-filter: blur(24px) saturate(1.12);
  display: flex; flex-direction: column;
}
.toast-stack { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; pointer-events: none; }
.toast-item {
  background: var(--primary); color: #fff; padding: 10px 18px; border-radius: 10px;
  font-size: 13px; box-shadow: 0 8px 24px var(--shadow-strong); animation: toastIn 0.3s ease;
}
@keyframes toastIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
#hero { scroll-margin-top: 56px; }

/* ====== 响应式 ====== */
@media (max-width: 760px) {
  .hero-content { padding-top: 6vh; }
  .hero-content::before { display: none; }
  .hero-content h1 { font-size: clamp(34px, 10vw, 52px); }
  .hero-desc { max-width: 90%; }
  .hero-actions { margin-top: 20px; }
  .hero-cta { padding: 13px 30px; font-size: 14.5px; }
  .hero-about-btn { width: 42px; height: 42px; font-size: 16px; }
  .map-toolbar { top: 12px; left: 12px; width: calc(100vw - 24px); padding: 12px; }
  .map-toolbar.collapsed { width: auto; max-width: calc(100vw - 24px); padding: 10px 12px; }
  .map-filter-row { max-height: 84px; }
  .content-strip { grid-template-columns: 1fr; padding: 26px 18px 8px; }
  .home-disclaimer { padding: 0 18px 10px; }
  .loc-card { bottom: 54px; }
  .loc-sub { display: none; }
}
</style>
