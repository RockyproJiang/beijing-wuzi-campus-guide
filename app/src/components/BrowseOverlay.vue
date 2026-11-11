<template>
  <div class="browse-overlay" :class="{ 'is-narrow': isNarrow }" @keydown.escape="$emit('close')">
    <div class="browse-overlay-header">
      <button class="browse-back-btn" @click="$emit('close')" title="返回">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="browse-head-brand">
        <div class="browse-head-icon"><i class="fa-solid fa-map-location-dot"></i></div>
        <div class="browse-head-text">
          <h2 class="browse-overlay-title">设施速查</h2>
          <div class="browse-overlay-sub">{{ scopeLabel }}</div>
        </div>
      </div>
      <button class="browse-submit-btn" @click="submissionOpen = true">
        <i class="fa-solid fa-location-dot"></i>
        <span>位置投稿</span>
      </button>
    </div>

    <div class="browse-overlay-body">
      <!-- 电脑端：左侧列表 -->
      <aside v-if="!isNarrow" class="browse-rail">
        <div class="rail-search">
          <i class="fa-solid fa-magnifying-glass"></i>
          <input
            class="rail-search-input"
            type="text"
            v-model="searchQuery"
            placeholder="搜索名称 / 门牌 / 设施…"
            @focus="searchFocused = true"
            @blur="onSearchBlur"
          />
          <button v-if="searchQuery" class="rail-search-clear" @mousedown.prevent="searchQuery = ''; searchFocused = false">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- 搜索下拉：留在输入框下方，不覆盖输入框 -->
        <div v-if="searchFocused && searchResults.length > 0" class="browse-search-dropdown">
          <div class="browse-search-tip">找到 {{ searchResults.length }} 个结果</div>
          <div v-for="r in searchResults" :key="r.id" class="browse-search-item" @mousedown.prevent="selectSearchResult(r)">
            <div class="browse-search-item-icon" :style="{ background: r.bgColor, color: r.color }"><i :class="r.icon"></i></div>
            <div class="browse-search-item-main">
              <div class="browse-search-item-name">{{ r.name }}</div>
              <div class="browse-search-item-cat">{{ r.catName }}</div>
            </div>
          </div>
        </div>

        <div class="rail-cats">
          <button
            class="rail-cat-btn"
            :class="{ active: isAll }"
            @click="pickCategory('__all__')"
          >
            <i class="fa-solid fa-border-all"></i>
            <span>全部建筑</span>
            <em>{{ totalCount }}</em>
          </button>
          <button
            v-for="cat in browseCategories" :key="cat.id"
            class="rail-cat-btn"
            :class="{ active: !isAll && activeCategoryId === cat.id }"
            @click="pickCategory(cat.id)"
          >
            <i :class="cat.icon"></i>
            <span>{{ cat.name }}</span>
            <em>{{ cat.buildings.length }}</em>
          </button>
        </div>

        <div class="rail-divider">
          <span>{{ isAll ? '全部建筑' : activeCategory?.name }}</span>
          <small>{{ railBldgCount }}</small>
        </div>

        <div class="rail-list">
          <template v-for="item in railList" :key="item._type === 'group' ? 'g-' + item.name : item.id">
            <button
              v-if="item._type === 'group'"
              class="rail-group"
              :class="{ open: isGroupOpen(item.name) }"
              @click="toggleGroup(item.name)"
            >
              <span class="rail-group-icon" :style="{ background: item.bgColor, color: item.color }"><i :class="item.icon"></i></span>
              <span class="rail-group-name">{{ item.name }}</span>
              <span class="rail-group-count">{{ item.buildings.length }}</span>
              <i class="fa-solid fa-chevron-down rail-group-arrow"></i>
            </button>
            <template v-if="item._type === 'group' && isGroupOpen(item.name)">
              <button
                v-for="bldg in item.buildings" :key="bldg.id"
                class="rail-item rail-item-child"
                :class="{ active: selectedBldgId === bldg.id }"
                @click="emit('select-building', bldg.id)"
              >
                <span class="rail-item-icon" :style="{ background: bldg.bgColor, color: bldg.color }"><i :class="bldg.icon"></i></span>
                <span class="rail-item-text">
                  <span class="rail-item-name">{{ bldg.name }}</span>
                  <span class="rail-item-sub">{{ bldg.sub }}</span>
                </span>
                <i class="fa-solid fa-chevron-right rail-item-arrow"></i>
              </button>
            </template>
            <button
              v-if="item._type === 'bldg'"
              class="rail-item"
              :class="{ active: selectedBldgId === item.id }"
              @click="emit('select-building', item.id)"
            >
              <span class="rail-item-icon" :style="{ background: item.bgColor, color: item.color }"><i :class="item.icon"></i></span>
              <span class="rail-item-text">
                <span class="rail-item-name">{{ item.name }}</span>
                <span class="rail-item-sub">{{ item.sub }}</span>
              </span>
              <i class="fa-solid fa-chevron-right rail-item-arrow"></i>
            </button>
          </template>
          <div v-if="railList.length === 0" class="rail-empty">
            <i class="fa-solid fa-inbox"></i>
            <span>暂无建筑信息</span>
          </div>
        </div>
      </aside>

      <div class="browse-content" :class="{ 'browse-content-detail': !isNarrow && selectedBldg }">
        <!-- 手机端：搜索 + 分类胶囊 -->
        <div v-if="isNarrow" class="m-search">
          <div class="rail-search">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input
              class="rail-search-input"
              type="text"
              v-model="searchQuery"
              placeholder="搜索名称 / 门牌 / 设施…"
              @focus="searchFocused = true"
              @blur="onSearchBlur"
            />
            <button v-if="searchQuery" class="rail-search-clear" @mousedown.prevent="searchQuery = ''; searchFocused = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>

          <!-- 手机端搜索下拉：紧贴输入框下方 -->
          <div v-if="searchFocused && searchResults.length > 0" class="browse-search-dropdown">
            <div class="browse-search-tip">找到 {{ searchResults.length }} 个结果</div>
            <div v-for="r in searchResults" :key="r.id" class="browse-search-item" @mousedown.prevent="selectSearchResult(r)">
              <div class="browse-search-item-icon" :style="{ background: r.bgColor, color: r.color }"><i :class="r.icon"></i></div>
              <div class="browse-search-item-main">
                <div class="browse-search-item-name">{{ r.name }}</div>
                <div class="browse-search-item-cat">{{ r.catName }}</div>
              </div>
            </div>
          </div>

          <!-- 手机端：分类选择面板（默认收起成一条，点开是分模块选择） -->
          <div class="m-picker" :class="{ open: mCatsOpen }">
            <button class="m-picker-head" :aria-expanded="mCatsOpen" @click="mCatsOpen = !mCatsOpen">
              <span class="m-picker-icon" :style="{ background: activeCategory?.buildings?.[0]?.bgColor || 'var(--primary-pale)', color: activeCategory?.buildings?.[0]?.color || 'var(--primary)' }">
                <i :class="isAll ? 'fa-solid fa-border-all' : (activeCategory?.icon || 'fa-solid fa-layer-group')"></i>
              </span>
              <span class="m-picker-text">
                <span class="m-picker-title">{{ isAll ? '全部建筑' : (activeCategory?.name || '选择分类') }}</span>
                <span class="m-picker-sub">{{ isAll ? '按分类找更方便' : (mobileBldgCount + ' 个地点') }}</span>
              </span>
              <span class="m-picker-switch">{{ mCatsOpen ? '收起' : '换分类' }}</span>
              <i class="fa-solid m-picker-caret" :class="mCatsOpen ? 'fa-chevron-up' : 'fa-chevron-down'"></i>
            </button>

            <div v-show="mCatsOpen" class="m-picker-body">
              <button class="m-mod" :class="{ active: isAll }" @click="pickCategory('__all__')">
                <span class="m-mod-icon"><i class="fa-solid fa-border-all"></i></span>
                <span class="m-mod-name">全部建筑</span>
                <span class="m-mod-count">{{ totalCount }}</span>
              </button>
              <button
                v-for="cat in browseCategories" :key="cat.id"
                class="m-mod"
                :class="{ active: !isAll && activeCategoryId === cat.id }"
                @click="pickCategory(cat.id)"
              >
                <span class="m-mod-icon" :style="{ background: cat.buildings[0]?.bgColor || 'var(--primary-pale)', color: cat.buildings[0]?.color || 'var(--primary)' }">
                  <i :class="cat.icon"></i>
                </span>
                <span class="m-mod-name">{{ cat.name }}</span>
                <span class="m-mod-count">{{ cat.buildings.length }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 手机端：卡片列表 -->
        <template v-if="isNarrow && !selectedBldg">
          <div class="m-list-head">
            <span>{{ isAll ? '全部建筑' : activeCategory?.name }}</span>
            <small>{{ mobileBldgCount }} 个地点</small>
          </div>
          <div class="m-card-grid">
            <template v-for="bldg in mobileList" :key="bldg.id">
              <div v-if="bldg._isGroupHead" class="m-group-head">
                <span>{{ bldg._groupName }}</span>
              </div>
              <button
                v-else
                class="m-card"
                :class="{ active: selectedBldgId === bldg.id }"
                @click="emit('select-building', bldg.id)"
              >
                <span class="m-card-icon" :style="{ background: bldg.bgColor, color: bldg.color }"><i :class="bldg.icon"></i></span>
                <span class="m-card-text">
                  <span class="m-card-name">{{ bldg.name }}</span>
                  <span class="m-card-sub">{{ bldg.sub || bldg.catName || '' }}</span>
                </span>
                <i class="fa-solid fa-chevron-right m-card-arrow"></i>
              </button>
            </template>
          </div>
          <div v-if="mobileList.length === 0" class="m-empty">
            <i class="fa-solid fa-inbox"></i>
            <span>暂无建筑信息</span>
          </div>
        </template>

        <!-- 电脑端：未选中时的引导 -->
        <div v-if="!isNarrow && !selectedBldg" class="browse-welcome">
          <div class="welcome-hero">
            <div class="welcome-eyebrow">CAMPUS FACILITY INDEX</div>
            <h3>从左侧列表找到你想去的地方</h3>
            <p>按分类浏览，或直接搜索名称、门牌号。点击条目即可查看开放时间、设备、楼层与联系电话。</p>
          </div>
          <div class="welcome-grid">
            <button
              v-for="cat in quickCats" :key="cat.id"
              class="welcome-card"
              @click="pickCategory(cat.id)"
            >
              <span class="welcome-card-icon" :style="{ background: cat.buildings[0]?.bgColor || 'var(--primary-pale)', color: cat.buildings[0]?.color || 'var(--primary)' }">
                <i :class="cat.icon"></i>
              </span>
              <span class="welcome-card-name">{{ cat.name }}</span>
              <span class="welcome-card-count">{{ cat.buildings.length }} 个地点</span>
            </button>
          </div>
          <div v-if="welcomePicks.length" class="welcome-extra">
            <div class="welcome-sub"><span>不妨先看看</span></div>
            <div class="welcome-picks">
              <button
                v-for="bldg in welcomePicks" :key="bldg.id"
                class="welcome-card welcome-pick"
                @click="emit('select-building', bldg.id)"
              >
                <span class="welcome-card-icon" :style="{ background: bldg.bgColor, color: bldg.color }"><i :class="bldg.icon"></i></span>
                <span class="welcome-card-name">{{ bldg.name }}</span>
                <span class="welcome-card-count">{{ bldg.sub || bldg.catName }}</span>
              </button>
            </div>
          </div>
          <TipsBox :tips="tips" />
        </div>

        <!-- 电脑端：选中后的详情（放在主体列，与左侧列表顶对齐） -->
        <template v-if="!isNarrow && selectedBldg">
          <DetailOverlayInline
            :selectedBldg="selectedBldg"
            :activeCategory="activeCategory"
            :l2tab="l2tab"
            :albumPhotos="albumPhotos(selectedBldg.id)"
        :groupPhotos="groupAlbum(selectedBldg)"
        :allBuildings="allBuildings"
            @update:l2tab="$emit('update:l2tab', $event)"
            @locate="$emit('locate', $event)"
            @submit-photo="openSubmission"
      @open-building="emit('select-building', $event)"
          />
        </template>

        <div v-if="isNarrow && !selectedBldg && tips.length" class="m-tips">
          <TipsBox :tips="tips" />
        </div>

        <template v-if="selectedBldg">
          <template v-if="isNarrow">
            <div class="m-detail-bar">
              <button class="m-detail-back" @click="emit('select-building', selectedBldg.id)">
                <i class="fa-solid fa-arrow-left"></i>
                <span>返回列表</span>
              </button>
              <span class="m-detail-cat">{{ selectedBldg.catName }}</span>
            </div>
          </template>
          <template v-if="isNarrow">
            <DetailOverlayInline
              :selectedBldg="selectedBldg"
              :activeCategory="activeCategory"
              :l2tab="l2tab"
              :albumPhotos="albumPhotos(selectedBldg.id)"
        :groupPhotos="groupAlbum(selectedBldg)"
        :allBuildings="allBuildings"
              @update:l2tab="$emit('update:l2tab', $event)"
              @locate="$emit('locate', $event)"
              @submit-photo="openSubmission"
      @open-building="emit('select-building', $event)"
            />
          </template>
          <template v-if="isNarrow">
            <div class="m-list-head m-list-head-more">
              <span>同分类地点</span>
              <small>{{ siblingList.length }} 个</small>
            </div>
            <div class="m-card-grid m-card-grid-compact">
              <button
                v-for="bldg in siblingList" :key="bldg.id"
                class="m-card m-card-sm"
                :class="{ active: selectedBldgId === bldg.id }"
                @click="emit('select-building', bldg.id)"
              >
                <span class="m-card-icon" :style="{ background: bldg.bgColor, color: bldg.color }"><i :class="bldg.icon"></i></span>
                <span class="m-card-name">{{ bldg.name }}</span>
              </button>
            </div>
          </template>
        </template>
      </div>
    </div>

    <SubmissionModal
      v-if="submissionOpen"
      :buildings="allBuildings"
      :current="selectedBldg"
      @close="submissionOpen = false"
      @submitted="onSubmitted"
    />
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import DetailOverlayInline from './DetailOverlayInline.vue'
import SubmissionModal from './SubmissionModal.vue'
import TipsBox from './TipsBox.vue'

const props = defineProps({
  browseCategories: Array,
  allBuildings: Array,
  activeCategoryId: String,
  activeCategory: Object,
  selectedBldgId: String,
  selectedBldg: Object,
  l2tab: String,
  tips: Array,
  browseCategoryScopes: { type: Array, default: null },
  aliases: { type: Array, default: () => [] },
  /** (buildingId) => photo[] */
  albumPhotos: { type: Function, default: () => () => [] },
  groupAlbum: { type: Function, default: () => () => [] }
})
const emit = defineEmits(['close', 'select-category', 'select-building', 'update:l2tab', 'navigate', 'locate', 'submitted'])

const ALL_ID = '__all__'

/* ---------------- 响应式断点 ---------------- */
const NARROW_QUERY = '(max-width: 900px)'
const isNarrow = ref(false)
// 手机端分类面板默认收起，只显示当前分类一条
const mCatsOpen = ref(false)
let mql = null
function syncNarrow(e) { isNarrow.value = e ? e.matches : window.matchMedia(NARROW_QUERY).matches }
onMounted(() => {
  mql = window.matchMedia(NARROW_QUERY)
  syncNarrow(mql)
  if (mql.addEventListener) mql.addEventListener('change', syncNarrow)
  else if (mql.addListener) mql.addListener(syncNarrow)
})
onBeforeUnmount(() => {
  if (!mql) return
  if (mql.removeEventListener) mql.removeEventListener('change', syncNarrow)
  else if (mql.removeListener) mql.removeListener(syncNarrow)
})

const submissionOpen = ref(false)

/** 打开位置投稿弹窗（会带上当前建筑） */
function openSubmission() {
  submissionOpen.value = true
}

function onSubmitted() {
  emit('submitted')
}

/* ---------------- 范围（全部 / 分类） ---------------- */
const isAll = computed(() => !props.browseCategories?.some((c) => c.id === props.activeCategoryId))

const scopeLabel = computed(() => {
  if (isAll.value) return `全部建筑 · 共 ${totalCount.value} 处`
  return `${props.activeCategory?.name || ''} · ${props.activeCategory?.buildings?.length || 0} 处`
})

// 去重后的地点总数（同一地点可能挂在多条分类下）
const totalCount = computed(() => new Set((props.allBuildings || []).map((b) => b.id)).size)

const scopeBuildings = computed(() => {
  if (isAll.value) return props.allBuildings || []
  return props.activeCategory?.buildings || []
})

const quickCats = computed(() => (props.browseCategories || []).filter((c) => c.buildings.length > 0).slice(0, 8))

// 引导页的“不妨先看看”：取各分类的第一个地点，最多 8 个
const welcomePicks = computed(() => {
  const picks = []
  const seen = new Set()
  for (const c of props.browseCategories || []) {
    for (const b of c.buildings) {
      if (seen.has(b.id)) continue
      seen.add(b.id)
      picks.push(b)
      break
    }
  }
  return picks.slice(0, 4)
})

function pickCategory(catId) {
  // 手机上选完分类就自动收起，把屏幕让给列表
  mCatsOpen.value = false
  if (catId === ALL_ID) {
    if (!isAll.value) emit('select-category', ALL_ID)
    return
  }
  emit('select-category', catId)
}

const siblingList = computed(() => {
  const catId = props.selectedBldg?.catId
  const pool = isAll.value
    ? (props.allBuildings || []).filter((b) => b.catId === catId)
    : (props.activeCategory?.buildings || [])
  return pool.filter((b) => b.id !== props.selectedBldg?.id)
})

/* 手机端：平铺所有地点，分组标题作为分隔标题（按 id 去重，分组头不计入条目数） */
const mobileList = computed(() => {
  const out = []
  const seenGroup = new Set()
  const seenId = new Set()
  for (const b of scopeBuildings.value) {
    if (seenId.has(b.id)) continue
    seenId.add(b.id)
    if (b.group && !seenGroup.has(b.group)) {
      seenGroup.add(b.group)
      out.push({ ...b, _isGroupHead: true, _groupName: b.group })
    }
    out.push(b)
  }
  return out
})

// 实际地点数（不含分组标题）
const mobileBldgCount = computed(() => mobileList.value.filter((x) => !x._isGroupHead).length)

/* ---------------- 搜索 ---------------- */
const searchQuery = ref('')
const searchFocused = ref(false)

function getSearchText(b) {
  const parts = [b.name, b.sub, b.catName, b.intro]
  // 别称：后台为每栋楼单独填的其它叫法
  if (b.aliases && b.aliases.length) parts.push(...b.aliases)
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
  return parts.filter(Boolean).join(' ').toLowerCase()
}

/** 关键词拆词：空格 / 逗号 / 顿号都当分隔符，"a b" 要求两个都命中 */
function searchTokens(q) {
  return String(q || '')
    .toLowerCase()
    .split(/[\s,，、]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

/** 粗略相似度：完全包含 > 前缀 > 逐字出现（允许中间夹字，如「图书管」→「图书馆」）
 *  两个字的词不做跳字匹配——中文里两字词绝大多数就是精确搜索，
 *  否则「一教」会把「实验教学中心」这类只沾一个字的全捞进来。
 */
function looseHit(text, token) {
  if (!token) return 0
  if (text.includes(token)) return 1
  if (token.length < 3) return 0
  // 允许跳字：token 的每个字符按顺序出现在 text 里
  let i = 0
  for (const ch of text) {
    if (ch === token[i]) i++
    if (i === token.length) return 0.5
  }
  return 0
}

const searchResults = computed(() => {
  const raw = searchQuery.value.trim()
  if (!raw) return []
  const q = raw.toLowerCase()
  const tokens = searchTokens(q)
  const all = props.allBuildings || []

  // 跨楼关键词（原来的 aliases 表）
  const aliasIds = new Set()
  for (const alias of props.aliases || []) {
    if (!alias.keyword) continue
    const kw = String(alias.keyword).toLowerCase()
    if (kw.includes(q) || q.includes(kw)) {
      for (const id of alias.ids || []) aliasIds.add(id)
    }
  }

  const scored = []
  for (const b of all) {
    const text = getSearchText(b)
    const name = String(b.name || '').toLowerCase()
    let score = 0
    let hitCount = 0
    for (const t of tokens) {
      const s = looseHit(text, t)
      if (s > 0) { hitCount++; score += s }
    }
    const allHit = hitCount === tokens.length
    if (!allHit) continue
    // 排序优先级：楼名完全命中 > 别称完全命中 > 楼名分词全中 > 只在正文里出现
    const aliasList = (b.aliases || []).map((a) => String(a).toLowerCase())
    if (name.includes(q)) score += 6
    else if (aliasList.some((a) => a === q || a.includes(q))) score += 5
    else if (tokens.every((t) => name.includes(t))) score += 3
    if (aliasIds.has(b.id)) score += 1.5
    scored.push({ b, score })
  }

  scored.sort((x, y) => y.score - x.score)
  return scored.slice(0, 10).map((x) => x.b)
})

function selectSearchResult(r) {
  searchQuery.value = ''
  searchFocused.value = false
  // 先切到结果所属分类（会清空选中），再选中建筑
  const cat = (props.browseCategories || []).find((c) => c.buildings.some((b) => b.id === r.id))
  if (cat) emit('select-category', cat.id)
  nextTick(() => emit('select-building', r.id))
}

function onSearchBlur() { setTimeout(() => { searchFocused.value = false }, 150) }

/* ---------------- 电脑端分组列表 ---------------- */
// 同一地点可能同时挂在多条分类下，列表只保留一份
const uniqueScope = computed(() => {
  const seen = new Set()
  const out = []
  for (const b of scopeBuildings.value) {
    if (seen.has(b.id)) continue
    seen.add(b.id)
    out.push(b)
  }
  return out
})

const railList = computed(() => {
  const list = []
  const grouped = {}
  const ungrouped = []
  for (const b of uniqueScope.value) {
    if (b.group) {
      if (!grouped[b.group]) grouped[b.group] = []
      grouped[b.group].push(b)
    } else {
      ungrouped.push(b)
    }
  }
  for (const [name, buildings] of Object.entries(grouped)) {
    list.push({ _type: 'group', name, buildings, icon: buildings[0].icon, bgColor: buildings[0].bgColor, color: buildings[0].color })
  }
  for (const b of ungrouped) list.push({ _type: 'bldg', ...b })
  return list
})

// 列表条数按“建筑”计，组标题不计入
const railBldgCount = computed(() => uniqueScope.value.length)

const expandedGroups = ref({})
function isGroupOpen(name) {
  return expandedGroups.value[name] !== false
}
function toggleGroup(name) {
  expandedGroups.value[name] = !isGroupOpen(name)
}
</script>

<style scoped>
.browse-overlay {
  position: fixed; inset: 0; z-index: 195;
  display: flex; flex-direction: column;
  background: transparent; overflow: hidden; padding-top: 56px;
  animation: overlayEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes overlayEnter { from { opacity:0; transform:scale(0.985); filter:blur(4px); } to { opacity:1; transform:scale(1); filter:blur(0); } }

/* ====== 顶栏（与数字校园顶栏同规格） ====== */
.browse-overlay-header {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 24px;
  background: rgba(255,253,248,0.82);
  border-bottom: 1px solid rgba(27,67,50,0.12);
  backdrop-filter: blur(20px) saturate(1.15);
  flex-shrink: 0; z-index: 5;
}
.browse-back-btn {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  border: 1.5px solid var(--border); background: var(--card); color: var(--primary);
  font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.browse-back-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
.browse-head-brand { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.browse-head-icon {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  background: var(--primary); color: var(--accent);
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.browse-head-text { min-width: 0; }
.browse-overlay-title { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 17px; color: var(--primary); line-height: 1.2; }
.browse-overlay-sub { font-size: 10.5px; color: var(--fg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.browse-submit-btn {
  display: inline-flex; align-items: center; gap: 6px; flex-shrink: 0;
  padding: 9px 14px; border-radius: 9px; border: 1px solid rgba(27,67,50,0.16);
  background: rgba(255,253,248,0.9); color: var(--primary);
  font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.browse-submit-btn i { color: var(--accent); font-size: 12px; }
.browse-submit-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

/* ====== 主体：与数字校园同宽同间距 ====== */
.browse-overlay-body {
  flex: 1; display: flex; align-items: stretch; gap: 18px;
  width: 100%; max-width: 1320px; margin: 0 auto;
  /* 左右留足边距，卡片不贴屏幕边缘；窄屏自动收窄 */
  padding: 18px clamp(16px, 3vw, 40px) 26px;
  overflow: hidden; min-height: 0;
}

/* ====== 左侧列表 ====== */
.browse-rail {
  width: 300px; flex-shrink: 0; display: flex; flex-direction: column; min-height: 0;
  border-radius: 15px; overflow: hidden;
  background: rgba(255,253,248,0.82);
  border: 1px solid rgba(27,67,50,0.12);
  backdrop-filter: blur(18px) saturate(1.1);
  box-shadow: 0 14px 36px rgba(27,67,50,0.08);
}
.rail-search { position: relative; padding: 12px 12px 8px; }
.rail-search > i { position: absolute; left: 24px; top: 50%; transform: translateY(-50%); font-size: 12px; color: var(--fg-muted); pointer-events: none; }
.rail-search-input {
  width: 100%; padding: 9px 32px 9px 34px; border-radius: 10px;
  border: 1.5px solid var(--border); background: rgba(255,255,255,0.9);
  font-size: 12.5px; font-family: inherit; color: var(--fg); outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.rail-search-input::placeholder { color: var(--fg-muted); }
.rail-search-input:focus { border-color: var(--primary-light); box-shadow: 0 0 0 4px rgba(216,243,220,0.65); }
.rail-search-clear { position: absolute; right: 20px; top: 50%; transform: translateY(-50%); border: none; background: none; color: var(--fg-muted); cursor: pointer; font-size: 12px; padding: 4px; border-radius: 6px; }
.rail-search-clear:hover { color: var(--primary); background: var(--bg-deep); }

.rail-cats { display: flex; flex-wrap: wrap; gap: 4px; padding: 4px 12px 12px; border-bottom: 1px solid rgba(27,67,50,0.08); }
.rail-cat-btn {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 5px 9px; border-radius: 8px; border: 1px solid transparent;
  background: rgba(255,255,255,0.5); color: var(--fg-muted);
  font-size: 10.5px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.18s;
}
.rail-cat-btn i { font-size: 10px; opacity: 0.85; }
.rail-cat-btn em { font-style: normal; font-size: 9px; opacity: 0.7; font-variant-numeric: tabular-nums; }
.rail-cat-btn:hover { background: rgba(216,243,220,0.6); color: var(--primary); border-color: rgba(45,106,79,0.22); }
.rail-cat-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.rail-cat-btn.active i { color: var(--accent); opacity: 1; }
.rail-cat-btn.active em { opacity: 0.75; }

.rail-divider { display: flex; align-items: center; gap: 8px; padding: 11px 14px 8px; }
.rail-divider span { font-family: 'Noto Serif SC', serif; font-size: 12px; font-weight: 900; color: var(--primary); }
.rail-divider small { margin-left: auto; font-size: 10px; color: var(--fg-muted); }

.rail-list { flex: 1; overflow-y: auto; padding: 0 8px 10px; min-height: 0; padding-bottom: 40px; }
.rail-list::-webkit-scrollbar { width: 6px; }
.rail-list::-webkit-scrollbar-thumb { background: rgba(27,67,50,0.16); border-radius: 3px; }

.rail-group {
  display: flex; align-items: center; gap: 8px; width: 100%;
  padding: 7px 8px; margin: 2px 0; border: none; border-radius: 8px;
  background: none; cursor: pointer; text-align: left; transition: background 0.18s;
}
.rail-group:hover { background: rgba(216,243,220,0.45); }
.rail-group-icon { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
.rail-group-name { flex: 1; min-width: 0; font-size: 12px; font-weight: 700; color: var(--primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-group-count { font-size: 9.5px; color: var(--fg-muted); background: var(--bg); padding: 1px 6px; border-radius: 20px; }
.rail-group-arrow { font-size: 9px; color: var(--fg-muted); transition: transform 0.2s; }
.rail-group.open .rail-group-arrow { transform: rotate(180deg); }

.rail-item {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 8px 9px; margin-bottom: 2px; border: 1px solid transparent; border-radius: 9px;
  background: var(--card); background: rgba(255,255,255,0.55); cursor: pointer; text-align: left;
  transition: background 0.16s, border-color 0.16s, transform 0.16s;
}
.rail-item:hover { background: #fff; border-color: rgba(45,106,79,0.28); transform: translateX(2px); }
.rail-item-child { margin-left: 12px; width: calc(100% - 12px); }
.rail-item-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.rail-item-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.rail-item-name { font-size: 12px; font-weight: 600; color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-item-sub { font-size: 10px; color: var(--fg-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rail-item-arrow { font-size: 8px; color: var(--border); }
.rail-item.active { background: var(--primary); border-color: var(--primary); }
.rail-item.active .rail-item-name { color: #fff; }
.rail-item.active .rail-item-sub, .rail-item.active .rail-item-arrow { color: rgba(255,255,255,0.7); }
.rail-empty { padding: 32px 16px; text-align: center; font-size: 11.5px; color: var(--fg-muted); display: flex; flex-direction: column; gap: 8px; align-items: center; }
.rail-empty i { font-size: 20px; opacity: 0.4; }

/* ====== 右侧内容 ====== */
.browse-content { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; gap: 14px; }
/* 电脑端详情列：卡片吸顶、自带滚动，左栏再长也不会把详情挤到屏幕外 */
.browse-content-detail { overflow: hidden; padding: 2px 8px 8px 2px; }
.browse-content-detail > .inline-panel { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; border-radius: 15px; }

/* 搜索下拉：桌面端贴在输入框下方（占住列表位置，不浮层遮挡） */
.browse-search-dropdown {
  position: relative; z-index: 5; margin: 0 12px 8px;
  width: auto; max-width: none;
  background: rgba(255,253,248,0.98); border: 1px solid rgba(27,67,50,0.14);
  border-radius: 12px; box-shadow: 0 10px 28px rgba(27,67,50,0.13);
  overflow: hidden; max-height: 340px; overflow-y: auto;
}
.browse-search-tip {
  padding: 7px 12px 6px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em;
  color: rgba(27,67,50,0.45); background: rgba(246,236,214,0.45);
  border-bottom: 1px solid rgba(27,67,50,0.07); position: sticky; top: 0; z-index: 1;
}
.browse-search-item { display: flex; align-items: center; gap: 9px; padding: 9px 12px; cursor: pointer; }
.browse-search-item:hover { background: rgba(216,243,220,0.55); }
.browse-search-item-main { min-width: 0; }
.browse-search-item-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.browse-search-item-name { font-size: 12px; font-weight: 600; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.browse-search-item-cat { font-size: 10px; color: var(--fg-muted); }

/* 空状态：导航卡片 */
.browse-welcome { display: flex; flex-direction: column; gap: 14px; }
.welcome-hero {
  padding: 22px 24px; border-radius: 18px;
  background: linear-gradient(120deg, rgba(255,253,248,0.94), rgba(216,243,220,0.66)),
              radial-gradient(ellipse at 82% 18%, rgba(212,168,83,0.18), transparent 60%);
  border: 1px solid rgba(27,67,50,0.12);
  box-shadow: 0 18px 50px rgba(27,67,50,0.1);
  backdrop-filter: blur(18px);
}
.welcome-eyebrow { font-size: 9.5px; letter-spacing: 0.2em; font-weight: 700; color: #9a7a3c; }
.welcome-hero h3 { margin: 5px 0 6px; font-family: 'Noto Serif SC', serif; font-size: 22px; color: var(--primary); }
.welcome-hero p { margin: 0; font-size: 12px; line-height: 1.7; color: var(--fg-muted); max-width: 640px; }

.welcome-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }
.welcome-card {
  display: flex; flex-direction: column; align-items: flex-start; gap: 5px;
  padding: 13px 13px 12px; border-radius: 13px; text-align: left; cursor: pointer;
  background: rgba(255,253,248,0.9); border: 1px solid rgba(27,67,50,0.1);
  backdrop-filter: blur(10px); transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.welcome-card:hover { transform: translateY(-2px); border-color: rgba(45,106,79,0.35); box-shadow: 0 10px 26px rgba(27,67,50,0.12); }
.welcome-card-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
.welcome-card-name { font-size: 12px; font-weight: 700; color: var(--primary); }
.welcome-card-count { font-size: 10px; color: var(--fg-muted); }

.welcome-extra { margin-top: 2px; }
.welcome-sub { display: flex; align-items: center; gap: 8px; margin: 2px 0 9px; }
.welcome-sub span { font-family: 'Noto Serif SC', serif; font-size: 12px; font-weight: 900; color: var(--primary); }
.welcome-sub::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(27,67,50,0.14), transparent); }
.welcome-picks { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; }
.welcome-pick { padding: 11px 12px; }
.welcome-pick .welcome-card-icon { width: 28px; height: 28px; border-radius: 8px; font-size: 12px; }

/* ====== 手机端 ====== */
.m-search { display: flex; flex-direction: column; gap: 8px; position: relative; }
.m-search .rail-search { padding: 0; }
.m-search .rail-search > i { left: 12px; }
.m-search .rail-search-clear { right: 8px; }
.browse-search-dropdown { position: relative; top: auto; left: auto; margin: 0; box-shadow: 0 8px 20px rgba(27,67,50,0.12); }
.m-chips { display: flex; gap: 6px; overflow-x: auto; padding-bottom: 2px; scrollbar-width: none; }
.m-chips::-webkit-scrollbar { display: none; }

/* 手机端分类面板：头部一条 + 展开的多模块网格 */
.m-picker {
  border-radius: 13px;
  border: 1px solid rgba(27, 67, 50, 0.12);
  background: rgba(255, 253, 247, 0.9);
  overflow: hidden;
}
.m-picker-head {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: none;
  cursor: pointer;
  text-align: left;
}
.m-picker-icon {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 12.5px;
}
.m-picker-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.m-picker-title { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 13.5px; color: var(--primary); }
.m-picker-sub { font-size: 10px; color: var(--fg-muted); }
.m-picker-switch { font-size: 10.5px; font-weight: 700; color: var(--primary-light); flex-shrink: 0; }
.m-picker-caret { font-size: 9px; color: var(--fg-muted); flex-shrink: 0; }
.m-picker-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  padding: 0 10px 11px;
  border-top: 1px dashed rgba(27, 67, 50, 0.1);
  padding-top: 10px;
}
.m-mod {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 9px;
  border-radius: 10px;
  border: 1px solid rgba(27, 67, 50, 0.09);
  background: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  text-align: left;
  transition: background 0.16s, border-color 0.16s;
}
.m-mod.active { border-color: var(--primary); background: rgba(216, 243, 220, 0.62); }
.m-mod-icon {
  width: 24px; height: 24px; border-radius: 7px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; background: var(--primary-pale); color: var(--primary);
}
.m-mod-name { flex: 1; min-width: 0; font-size: 11.5px; font-weight: 600; color: var(--primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.m-mod-count { font-size: 9.5px; color: var(--fg-muted); flex-shrink: 0; }
.m-chip {
  display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  padding: 6px 11px; border-radius: 20px; border: 1px solid rgba(27,67,50,0.12);
  background: rgba(255,253,248,0.9); color: var(--fg-muted);
  font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.18s;
}
.m-chip i { font-size: 10px; }
.m-chip em { font-style: normal; font-size: 9px; opacity: 0.65; }
.m-chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.m-chip.active i { color: var(--accent); }

.m-list-head { display: flex; align-items: baseline; gap: 8px; padding: 2px 2px 0; }
.m-list-head span { font-family: 'Noto Serif SC', serif; font-size: 14px; font-weight: 900; color: var(--primary); }
.m-list-head small { font-size: 10px; color: var(--fg-muted); }
.m-list-head-more { margin-top: 4px; }

.m-card-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.m-group-head { grid-column: 1 / -1; display: flex; align-items: center; gap: 8px; padding: 8px 2px 1px; }
.m-group-head span { font-family: 'Noto Serif SC', serif; font-size: 12px; font-weight: 900; color: var(--primary); }
.m-group-head::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(27,67,50,0.14), transparent); }
.m-card {
  display: flex; align-items: center; gap: 9px; padding: 11px 11px;
  min-width: 0; overflow: hidden;
  border-radius: 13px; border: 1px solid rgba(27,67,50,0.1);
  background: rgba(255,253,248,0.92); cursor: pointer; text-align: left;
  transition: transform 0.16s, border-color 0.16s;
}
.m-card:active { transform: scale(0.98); }
.m-card-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.m-card-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.m-card-name { font-size: 12px; font-weight: 600; color: var(--fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.m-card-sub { font-size: 10px; color: var(--fg-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.m-card-arrow { font-size: 8px; color: var(--border); }
.m-card.active { background: var(--primary); border-color: var(--primary); }
.m-card.active .m-card-name { color: #fff; }
.m-card.active .m-card-sub, .m-card.active .m-card-arrow { color: rgba(255,255,255,0.7); }
.m-card-sm { flex-direction: column; align-items: flex-start; gap: 5px; padding: 10px; }
.m-card-sm .m-card-name { white-space: normal; line-height: 1.35; font-size: 11.5px; }
.m-card-grid-compact { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.m-empty { padding: 40px 16px; text-align: center; font-size: 12px; color: var(--fg-muted); display: flex; flex-direction: column; gap: 8px; align-items: center; }
.m-empty i { font-size: 22px; opacity: 0.4; }
.m-tips { margin-top: 4px; }

.m-detail-bar { display: flex; align-items: center; gap: 10px; }
.m-detail-back {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 13px;
  border-radius: 20px; border: 1px solid rgba(27,67,50,0.14); background: rgba(255,253,248,0.95);
  color: var(--primary); font-size: 11.5px; font-weight: 600; cursor: pointer;
}
.m-detail-back i { font-size: 10px; }
.m-detail-cat { font-size: 10.5px; color: var(--fg-muted); }

/* ====== 窄屏 / 宽屏 ====== */
@media (max-width: 1180px) {
  .welcome-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .welcome-picks { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 900px) {
  .browse-overlay-header { padding: 8px 12px; gap: 8px; }
  .browse-head-icon { width: 34px; height: 34px; border-radius: 10px; font-size: 14px; }
  .browse-overlay-title { font-size: 15px; }
  .browse-overlay-sub { font-size: 9.5px; }
  .browse-submit-btn { padding: 8px 10px; font-size: 10.5px; gap: 4px; }
  .browse-submit-btn span { display: inline; font-size: 10.5px; }
  .browse-overlay-body { padding: 12px 12px 22px; gap: 12px; overflow-y: auto; }
  .browse-content { overflow: visible; min-width: 0; }
  /* 窄屏下详情卡要按内容撑开，不能当作可收缩的 flex 项 */
  .browse-content > .inline-panel { flex: none; height: auto; }
  .m-card-grid { gap: 7px; }
  .m-card { padding: 10px 9px; gap: 7px; }
  .m-card-icon { width: 29px; height: 29px; border-radius: 8px; font-size: 12px; }
  .m-card-arrow { display: none; }
  .m-card-grid-compact { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
</style>