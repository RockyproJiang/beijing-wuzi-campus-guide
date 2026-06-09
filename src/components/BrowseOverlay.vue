﻿﻿<template>
  <div class="browse-overlay" @keydown.escape="$emit('close')">
    <div class="browse-overlay-header">
      <button class="browse-back-btn" @click="$emit('close')" title="返回">
        <i class="fa-solid fa-arrow-left"></i>
        <span class="back-label">地图</span>
      </button>
      <div class="content-panel-icon" style="background:var(--primary);color:#fff;">
        <i class="fa-solid fa-magnifying-glass"></i>
      </div>
      <h2 class="browse-overlay-title">设施速查</h2>
    </div>
    <div class="browse-overlay-body">
      <!-- wide: sidebar inline; narrow: sidebar as floating drawer -->
      <div v-if="showSidebar" class="sidebar-backdrop" @click="showSidebar = false"></div>
      <aside class="sidebar" :class="{ 'sidebar-open': showSidebar }">
        <div class="sidebar-drawer-header">
          <span class="sidebar-drawer-title">建筑列表</span>
          <button class="sidebar-close-btn" @click="showSidebar = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div class="sidebar-cats">
          <button
            v-for="cat in browseCategories" :key="cat.id"
            class="sidebar-cat-btn"
            :class="{ active: activeCategoryId === cat.id }"
            @click="$emit('select-category', cat.id)"
          >
            <i :class="cat.icon" style="margin-right:4px;"></i>{{ cat.name }}
          </button>
        </div>
        <div class="sidebar-buildings">
          <template v-for="item in groupedBuildingList" :key="item._type === 'group' ? item.name : item.id">
            <!-- Group header -->
            <div
              v-if="item._type === 'group'"
              class="sidebar-group-header"
              @click="toggleGroup(item.name)"
            >
              <div class="sidebar-group-icon" :style="{ background: item.bgColor, color: item.color }">
                <i :class="item.icon"></i>
              </div>
              <div class="sidebar-group-info">
                <div class="sidebar-group-name">{{ item.name }}</div>
                <div class="sidebar-group-count">{{ item.buildings.length }}个</div>
              </div>
              <i class="fa-solid" :class="expandedGroups[item.name] ? 'fa-chevron-down' : 'fa-chevron-right'" style="color:var(--fg-muted);font-size:10px;"></i>
            </div>
            <!-- Group children -->
            <div
              v-if="item._type === 'group' && expandedGroups[item.name]"
              v-for="bldg in item.buildings" :key="bldg.id"
              class="sidebar-bldg-item sidebar-bldg-child"
              :class="{ active: selectedBldgId === bldg.id }"
              @click="selectAndClose(bldg.id)"
            >
              <div class="sidebar-bldg-icon" :style="{ background: bldg.bgColor, color: bldg.color }">
                <i :class="bldg.icon"></i>
              </div>
              <div class="sidebar-bldg-info">
                <div class="sidebar-bldg-name">{{ bldg.name }}</div>
                <div class="sidebar-bldg-sub">{{ bldg.sub }}</div>
              </div>
            </div>
            <!-- Ungrouped building -->
            <div
              v-if="item._type === 'bldg'"
              class="sidebar-bldg-item"
              :class="{ active: selectedBldgId === item.id }"
              @click="selectAndClose(item.id)"
            >
              <div class="sidebar-bldg-icon" :style="{ background: item.bgColor, color: item.color }">
                <i :class="item.icon"></i>
              </div>
              <div class="sidebar-bldg-info">
                <div class="sidebar-bldg-name">{{ item.name }}</div>
                <div class="sidebar-bldg-sub">{{ item.sub }}</div>
              </div>
              <i class="fa-solid fa-chevron-right" style="color:var(--fg-muted);font-size:10px;"></i>
            </div>
          </template>
          <div v-if="activeCategory.buildings.length === 0" class="sidebar-empty">
            暂无建筑信息
          </div>
        </div>
      </aside>
      <div class="browse-content">
        <div class="browse-search-wrap">
          <i class="fa-solid fa-magnifying-glass browse-search-icon"></i>
          <input class="browse-search-input" type="text" v-model="searchQuery" placeholder="搜索建筑名称..." @focus="searchFocused = true" @blur="onSearchBlur" />
          <button v-if="searchQuery" class="browse-search-clear" @mousedown.prevent="searchQuery = ''; searchFocused = false"><i class="fa-solid fa-xmark"></i></button>
          <div v-if="searchFocused && searchResults.length > 0" class="browse-search-dropdown">
            <div v-for="r in searchResults" :key="r.id" class="browse-search-item" @mousedown.prevent="selectSearchResult(r)">
              <div class="browse-search-item-icon" :style="{ background: r.bgColor, color: r.color }"><i :class="r.icon"></i></div>
              <div><div class="browse-search-item-name">{{ r.name }}</div><div class="browse-search-item-cat">{{ r.catName }}</div></div>
            </div>
          </div>
        </div>
        <div v-if="!selectedBldg" class="empty-state" @click="showSidebar = true">
          <div class="empty-illustration">
            <i class="fa-solid fa-map-location-dot empty-icon-main"></i>
            <i class="fa-solid fa-arrow-pointer empty-icon-accent"></i>
          </div>
          <h3>选择一个建筑查看详情</h3>
          <p>点击下方建筑名称，或回到地图点击标记即可查看详细信息</p>
        </div>
        <DetailOverlayInline
          v-if="selectedBldg"
          :selectedBldg="selectedBldg"
          :activeCategory="activeCategory"
          :l2tab="l2tab"
          @update:l2tab="$emit('update:l2tab', $event)"
        />
        <TipsBox :tips="tips" />
      </div>
    </div>
    <!-- narrow: floating list button bottom-left -->
    <button class="float-list-btn" :class="{ 'attached': showSidebar }" @click="showSidebar = !showSidebar" :title="showSidebar ? '收起列表' : '建筑列表'">
      <i class="fa-solid" :class="showSidebar ? 'fa-xmark' : 'fa-list'"></i>
      <span v-if="!showSidebar">列表</span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import DetailOverlayInline from './DetailOverlayInline.vue'
import TipsBox from './TipsBox.vue'

const props = defineProps({
  browseCategories: Array,
  allBuildings: Array,
  activeCategoryId: String,
  activeCategory: Object,
  selectedBldgId: String,
  selectedBldg: Object,
  l2tab: String,
  tips: Array
})
const emit = defineEmits(['close', 'select-category', 'select-building', 'update:l2tab', 'navigate'])

// Narrow screen: sidebar hidden by default → details visible first
const showSidebar = ref(false)

// Search
const searchQuery = ref('')
const searchFocused = ref(false)
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
  if (b.info) for (const i of b.info) { parts.push(i.label, i.value) }
  if (b.equipment) for (const e of b.equipment) {
    parts.push(e.name)
    if (e.details) for (const d of e.details) { parts.push(d.label, d.value) }
  }
  if (b.floors) for (const f of b.floors) {
    parts.push(f.name, f.desc || '')
    if (f.highlights) parts.push(...f.highlights)
    if (f.layout) parts.push(...Object.values(f.layout))
    if (f.rooms) for (const r of f.rooms) { parts.push(r.number, r.name) }
  }
  if (b.contacts) for (const c of b.contacts) { parts.push(c.label, c.value) }
  if (b.surroundings) for (const s of b.surroundings) { parts.push(s.name, s.desc) }
  if (b.schedule) parts.push(b.schedule)
  return parts.join(' ').toLowerCase()
}

const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const q = searchQuery.value.trim().toLowerCase()
  const all = props.allBuildings || []
  const aliasIds = new Set()
  for (const [keyword, ids] of Object.entries(searchAliases)) {
    if (keyword.includes(q) || q.includes(keyword)) {
      for (const id of ids) aliasIds.add(id)
    }
  }
  const aliasMatches = all.filter(b => aliasIds.has(b.id))
  const textMatches = all.filter(b => {
    if (aliasIds.has(b.id)) return false
    return getSearchText(b).includes(q)
  })
  return [...aliasMatches, ...textMatches].slice(0, 8)
})

function selectSearchResult(r) {
  searchQuery.value = ''
  searchFocused.value = false
  // Select category first (it clears selectedBldgId), then building
  for (const cat of props.browseCategories) {
    if (cat.buildings.find(b => b.id === r.id)) {
      emit('select-category', cat.id)
      break
    }
  }
  nextTick(() => emit('select-building', r.id))
}

function onSearchBlur() { setTimeout(() => { searchFocused.value = false }, 150) }

// Group buildings by `group` field
const groupedBuildingList = computed(() => {
  const list = []
  const grouped = {}
  const ungrouped = []
  for (const b of props.activeCategory.buildings) {
    if (b.group) {
      if (!grouped[b.group]) grouped[b.group] = []
      grouped[b.group].push(b)
    } else {
      ungrouped.push(b)
    }
  }
  // Push groups first
  for (const [name, buildings] of Object.entries(grouped)) {
    list.push({ _type: 'group', name, buildings, icon: buildings[0].icon, bgColor: buildings[0].bgColor, color: buildings[0].color })
  }
  // Then ungrouped
  for (const b of ungrouped) {
    list.push({ _type: 'bldg', ...b })
  }
  return list
})

const expandedGroups = ref({})

function toggleGroup(name) {
  expandedGroups.value[name] = !expandedGroups.value[name]
}

function selectAndClose(bldgId) {
  emit('select-building', bldgId)
  if (window.innerWidth <= 900) {
    showSidebar.value = false
  }
}
</script>

<style scoped>
.browse-overlay { position:fixed; inset:0; z-index:195; display:flex; flex-direction:column; background:var(--bg); overflow:hidden; padding-top:56px; animation:overlayEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes overlayEnter { from { opacity:0; transform:scale(0.97); filter:blur(4px); } to { opacity:1; transform:scale(1); filter:blur(0); } }
.browse-overlay-header { display:flex; align-items:center; gap:12px; padding:12px 24px; background:rgba(255,255,255,0.92); backdrop-filter:blur(16px) saturate(1.4); border-bottom:1px solid var(--border); flex-shrink:0; z-index:5; }
.browse-back-btn { width:38px; height:38px; border-radius:10px; border:1.5px solid var(--border); background:var(--card); cursor:pointer; font-size:16px; color:var(--primary); display:flex; align-items:center; justify-content:center; transition:all 0.25s; flex-shrink:0; position:relative; overflow:hidden; }
.browse-back-btn:hover { width:60px; background:var(--primary); color:#fff; border-color:var(--primary); }
.browse-back-btn .back-label { font-size:0; font-weight:600; transition:font-size 0.25s; white-space:nowrap; }
.browse-back-btn:hover .back-label { font-size:12px; }
.browse-back-btn:hover i { display:none; }
.content-panel-icon { width:clamp(32px,7vw,48px); height:clamp(32px,7vw,48px); border-radius:clamp(8px,1.8vw,12px); display:flex; align-items:center; justify-content:center; font-size:clamp(14px,3.5vw,21px); flex-shrink:0; }
.browse-overlay-title { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(10px,2.5vw,18px); color:var(--primary); flex:1; }

.browse-overlay-body { flex:1; display:flex; gap:20px; padding:16px 24px; overflow:hidden; max-width:1400px; margin:0 auto; width:100%; }

/* ====== SIDEBAR ====== */
.sidebar { width:var(--sidebar-w); flex-shrink:0; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; display:flex; flex-direction:column; box-shadow:0 2px 12px var(--shadow-xs); }
.sidebar-drawer-header { display:none; align-items:center; justify-content:space-between; padding:14px 16px; border-bottom:1px solid var(--bg-deep); }
.sidebar-drawer-title { font-weight:700; font-size:14px; color:var(--primary); }
.sidebar-close-btn { width:32px; height:32px; border-radius:8px; border:none; background:var(--bg); cursor:pointer; font-size:14px; color:var(--fg-muted); display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.sidebar-close-btn:hover { background:var(--primary); color:#fff; }
.sidebar-cats { display:flex; flex-wrap:wrap; gap:6px; padding:14px 12px 10px; border-bottom:1px solid var(--bg-deep); }
.sidebar-cat-btn { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:9px; border:1.5px solid transparent; background:var(--bg); font-size:12px; font-weight:600; color:var(--fg-muted); cursor:pointer; font-family:inherit; transition:all 0.25s ease; white-space:nowrap; position:relative; }
.sidebar-cat-btn:hover { background:var(--primary-pale); color:var(--primary); border-color:var(--primary-pale); transform:translateY(-1px); }
.sidebar-cat-btn.active { background:var(--primary); color:#fff; border-color:var(--primary); box-shadow:0 4px 14px rgba(27,67,50,0.25); }
.sidebar-buildings { flex:1; overflow-y:auto; padding:8px; }
.sidebar-bldg-item { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:12px; cursor:pointer; transition:all 0.25s ease; border:1.5px solid transparent; margin-bottom:6px; background:var(--card); box-shadow:0 1px 3px var(--shadow-xs); }
.sidebar-bldg-item:hover { border-color:var(--primary-light); box-shadow:0 4px 16px var(--shadow); transform:translateY(-1px); }
.sidebar-bldg-item.active { background:var(--primary); border-color:var(--primary); box-shadow:0 4px 16px rgba(27,67,50,0.3); transform:translateY(-1px); }
.sidebar-bldg-item.active .sidebar-bldg-name { color:#fff; }
.sidebar-bldg-item.active .sidebar-bldg-sub { color:rgba(255,255,255,0.7); }
.sidebar-bldg-item.active .fa-chevron-right { color:rgba(255,255,255,0.6); }
.sidebar-bldg-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; box-shadow:0 2px 8px rgba(0,0,0,0.06); }
.sidebar-bldg-info { flex:1; min-width:0; }
.sidebar-bldg-name { font-weight:600; font-size:13px; color:var(--fg); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.3; }
.sidebar-bldg-sub { font-size:11px; color:var(--fg-muted); margin-top:2px; line-height:1.3; }
.sidebar-empty { padding:40px 20px; text-align:center; font-size:13px; color:var(--fg-muted); }

.browse-content { flex:1; min-width:0; overflow-y:auto; padding:0 16px; }

/* ====== Search in browse ====== */
.browse-search-wrap { position:relative; max-width:520px; margin:0 auto 10px; }
.browse-search-input { width:100%; padding:12px 44px; border:2px solid var(--border); border-radius:12px; font-size:14px; font-family:inherit; background:var(--card); color:var(--fg); transition:all 0.3s ease; outline:none; box-shadow:0 1px 4px var(--shadow-xs); }
.browse-search-input:focus { border-color:var(--primary); box-shadow:0 0 0 4px var(--primary-pale), 0 2px 8px var(--shadow-xs); }
.browse-search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--fg-muted); font-size:15px; }
.browse-search-clear { position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--fg-muted); cursor:pointer; font-size:14px; padding:4px; border-radius:6px; }
.browse-search-clear:hover { color:var(--primary); background:var(--bg-deep); }
.browse-search-dropdown { position:absolute; top:100%; left:0; right:0; background:var(--card); border:2px solid var(--border); border-radius:var(--radius-sm); margin-top:4px; max-height:280px; overflow-y:auto; z-index:50; box-shadow:0 12px 36px var(--shadow-strong); }
.browse-search-item { display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer; transition:background 0.15s; }
.browse-search-item:hover { background:var(--primary-pale); }
.browse-search-item-icon { width:30px; height:30px; border-radius:7px; display:flex; align-items:center; justify-content:center; font-size:12px; flex-shrink:0; }
.browse-search-item-name { font-weight:600; font-size:13px; }
.browse-search-item-cat { font-size:11px; color:var(--fg-muted); }

/* ====== FLOATING LIST BUTTON (narrow only) ====== */
.float-list-btn { display:none; align-items:center; gap:6px; position:fixed; bottom:20px; left:0; z-index:220; padding:10px 18px 10px 14px; border-radius:0 24px 24px 0; border:none; background:var(--primary); color:#fff; font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; box-shadow:0 4px 20px var(--shadow-strong); transition:left 0.25s ease; }
.float-list-btn:hover { background:var(--primary-light); }
.float-list-btn.attached { left:min(300px, 82vw); padding:10px 14px 10px 14px; }
@media (max-width:900px) {
  .float-list-btn { display:flex; }
}

/* ====== NARROW SCREEN ====== */
@media (max-width:900px) {
  .float-list-btn { display:flex; }
  .browse-overlay-body { padding:12px; position:relative; }

  .sidebar { position:fixed; top:0; left:0; bottom:0; z-index:210; width:min(300px, 82vw); border-radius:0 var(--radius) var(--radius) 0; transform:translateX(-100%); transition:transform 0.25s ease; }
  .sidebar.sidebar-open { transform:translateX(0); box-shadow:4px 0 30px var(--shadow-strong); }
  .sidebar-drawer-header { display:flex; }
  .sidebar-backdrop { position:fixed; inset:0; z-index:205; background:rgba(0,0,0,0.3); }
}

.empty-state { background:var(--card); border:1.5px solid var(--border); border-radius:var(--radius); padding:60px 30px; text-align:center; cursor:pointer; transition:all 0.25s ease; }
.empty-state:hover { border-color:var(--primary-light); box-shadow:0 8px 24px var(--shadow-strong); transform:translateY(-2px); }
.empty-illustration { position:relative; width:80px; height:80px; margin:0 auto 16px; }
.empty-illustration .empty-icon-main { font-size:56px; color:var(--primary-pale); position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }
.empty-illustration .empty-icon-accent { font-size:22px; color:var(--primary); position:absolute; bottom:0; right:2px; animation:emptyPointer 1.5s ease-in-out infinite; }
@keyframes emptyPointer { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-6px) rotate(10deg); } }
.empty-state i { font-size:48px; color:var(--border); margin-bottom:16px; }
.empty-state h3 { font-family:'Noto Serif SC',serif; font-size:clamp(13px,3vw,18px); color:var(--fg-muted); margin-bottom:8px; }
.empty-state p { font-size:clamp(9px,1.6vw,11px); color:var(--fg-muted); }

/* ====== Group headers ====== */
.sidebar-group-header { display:flex; align-items:center; gap:10px; padding:12px 14px; border-radius:10px; cursor:pointer; transition:all 0.25s ease; border:1.5px solid transparent; margin-bottom:4px; background:var(--bg); }
.sidebar-group-header:hover { background:var(--primary-pale); border-color:var(--primary-light); box-shadow:0 2px 8px var(--shadow-xs); transform:translateY(-1px); }
.sidebar-group-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,0.06); }
.sidebar-group-info { flex:1; min-width:0; }
.sidebar-group-name { font-weight:700; font-size:13px; color:var(--primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sidebar-group-count { font-size:11px; color:var(--fg-muted); }
.sidebar-bldg-child { padding-left:28px; }
</style>





