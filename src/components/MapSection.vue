<template>
  <section class="map-section" id="map">
    <h2 v-if="!maximized" class="section-title" style="text-align:center;">校园地图</h2>
    <p v-if="!maximized" class="section-sub" style="text-align:center;">点击建筑标记查看详情 · 滚轮缩放 · 拖拽平移</p>

    <div v-if="!maximized" class="map-search-wrap" style="margin:0 auto 16px;">
      <i class="fa-solid fa-magnifying-glass map-search-icon"></i>
      <input class="map-search-input" type="text" :value="searchQuery" placeholder="搜索建筑名称（支持模糊匹配）" @input="$emit('update:searchQuery', $event.target.value)" @focus="$emit('focus-search')" @blur="$emit('blur-search')" />
      <button v-if="searchQuery" class="map-search-clear" @mousedown.prevent="$emit('clear-search')"><i class="fa-solid fa-xmark"></i></button>
      <div v-if="searchFocused && searchResults.length > 0" class="map-search-dropdown">
        <div v-for="r in searchResults" :key="r.id" class="map-search-dropdown-item" @mousedown.prevent="$emit('select-result', r)">
          <div class="map-search-dropdown-item-icon" :style="{ background: r.bgColor, color: r.color }"><i :class="r.icon"></i></div>
          <div><div class="map-search-dropdown-item-name">{{ r.name }}</div><div class="map-search-dropdown-item-cat">{{ r.catName }}</div></div>
        </div>
      </div>
    </div>

    <div v-if="!maximized" class="map-filter-row">
      <div class="filter-tab-group">
        <button class="filter-tab" :class="{ active: showFacilityGroup }" @click="showFacilityGroup = !showFacilityGroup; showSpecialGroup = false">
          <i class="fa-solid fa-building-columns"></i> 设施 <i class="fa-solid" :class="showFacilityGroup ? 'fa-chevron-up' : 'fa-chevron-down'" style="font-size:10px;opacity:0.6;"></i>
        </button>
        <button v-if="specialCategory" class="filter-tab special-tab" :class="{ active: showSpecialGroup }" @click="showSpecialGroup = !showSpecialGroup; showFacilityGroup = false">
          <i class="fa-solid fa-star"></i> 特殊 <i class="fa-solid" :class="showSpecialGroup ? 'fa-chevron-up' : 'fa-chevron-down'" style="font-size:10px;opacity:0.6;"></i>
        </button>
      </div>
      <div v-if="showFacilityGroup" class="filter-group-dropdown">
        <button class="map-filter-chip all-chip" :class="{ active: mapFilter === null }" @click="$emit('update:mapFilter', null)">全部</button>
        <button v-for="cat in facilityCategories" :key="cat.id" class="map-filter-chip" :class="{ active: mapFilter === cat.id }" :style="mapFilter === cat.id ? { background: cat.color, borderColor: cat.color, color: '#fff' } : {}" @click="$emit('update:mapFilter', mapFilter === cat.id ? null : cat.id)"><i :class="cat.icon"></i>{{ cat.name }}</button>
      </div>
      <div v-if="showSpecialGroup && specialCategory" class="filter-group-dropdown">
        <button class="map-filter-chip all-chip special-chip" :class="{ active: mapFilter === specialCategory.id }" @click="$emit('update:mapFilter', specialCategory.id)">全部</button>
        <button v-for="b in specialCategory.buildings" :key="b.id" class="map-filter-chip special-chip" :class="{ active: mapFilter === b.id }" :style="mapFilter === b.id ? { background: b.bgColor, borderColor: b.color, color: b.color } : {}" @click="$emit('update:mapFilter', mapFilter === b.id ? null : b.id)">
          <i :class="b.icon"></i>{{ b.name }}
        </button>
      </div>
    </div>

    <div class="map-container" :class="{ maximized: maximized }">
      <!-- Compass -->
      <div class="map-compass" title="北">
        <span class="compass-label">N</span>
        <svg viewBox="0 0 40 40" class="compass-svg">
          <polygon points="20,4 24,18 20,16 16,18" fill="var(--primary)"/>
          <polygon points="20,36 16,22 20,24 24,22" fill="#ccc"/>
        </svg>
      </div>
      <!-- Maximized: only exit + reset -->
      <button v-if="maximized" class="max-exit-btn" @click="toggleMaximize"><i class="fa-solid fa-arrow-left"></i> 退出</button>

      <div class="map-viewport" ref="viewport" @wheel.prevent="onWheel" @mousedown="onMouseDown">
        <div class="map-img-wrap" ref="imgWrap" :style="{ transform: `translate(${panX}px, ${panY}px) scale(${zoom})`, transformOrigin: '0 0', cursor: dragging ? 'grabbing' : maximized ? 'grab' : 'grab' }">
          <div v-if="mapLoading" class="map-loading"><i class="fa-solid fa-spinner"></i>地图加载中..</div>
          <img src="/map.png" alt="北京物资学院校园地图" @load="$emit('map-loaded')" @error="$emit('map-error')" draggable="false" />
          <div v-if="popKey > 0" :key="popKey" class="markers-layer">
          <div v-for="(b, idx) in visibleMapBuildings" :key="b.id" class="map-marker marker-pop" :style="{ left: b.mapX + '%', top: b.mapY + '%', zIndex: markerZ(b.catId), animationDelay: staggerDelay(idx, visibleMapBuildings.length) }" @click.stop="$emit('marker-click', b)" @mouseenter="hoveredBldg = b" @mouseleave="hoveredBldg = null">
            <div class="map-marker-dot" :style="{ background: b.color }"><i :class="b.icon"></i></div>
          </div>
          <Transition name="label">
          <div v-if="hoveredBldg" class="float-label" :style="{ left: hoveredBldg.mapX + '%', top: hoveredBldg.mapY + '%' }">
            <div class="float-label-name">{{ hoveredBldg.name }}</div>
            <div class="float-label-sub" v-if="hoveredBldg.catName">{{ hoveredBldg.catName }}</div>
          </div>
        </Transition>
          <div class="map-tooltip" :class="{ show: tooltip.show }" :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">{{ tooltip.text }}</div>
        </div>
        </div>
      </div>

      <div v-if="!maximized" class="map-controls">
        <div class="map-legend">
          <span class="legend-group-label">设施</span>
          <div v-for="cat in facilityCategories" :key="cat.id" class="legend-item"><div class="legend-dot" :style="{ background: cat.color }"></div>{{ cat.name }}</div>
          <template v-if="specialCategory">
            <span class="legend-group-label">特殊</span>
            <div v-for="b in specialCategory.buildings" :key="b.id" class="legend-item"><div class="legend-dot" :style="{ background: b.color }"></div>{{ b.name }}</div>
          </template>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'

const hoveredBldg = ref(null)
const props = defineProps({
  categories: Array, visibleMapBuildings: Array, mapAnimKey: Number, facilityCategories: Array, specialCategory: Object,
  searchQuery: String, searchResults: Array, searchFocused: Boolean,
  mapFilter: [String, Object], tooltip: Object, mapLoading: Boolean
})
defineEmits(['update:searchQuery','focus-search','blur-search','clear-search','select-result','update:mapFilter','marker-click','show-tooltip','hide-tooltip','map-loaded','map-error'])

const maximized = ref(false)
const showFacilityGroup = ref(false)
const showSpecialGroup = ref(false)
const popKey = ref(-1)

const markerZLayers = ['teaching','services','dorm','dining','gates','other','sports','security','parking','special']
function markerZ(catId) { return 10 - markerZLayers.indexOf(catId) }

function staggerDelay(i, total) {
  const groupSize = 4
  const g = Math.floor(i / groupSize)
  const totalGroups = Math.ceil(total / groupSize)
  const t = g / Math.max(totalGroups - 1, 1)
  const eased = Math.pow(t, 0.6)
  return (0.03 + eased * 1.6).toFixed(2) + 's'
}

function triggerPop(delay) {
  popKey.value = -1
  setTimeout(() => { popKey.value = Date.now() }, delay + 50)
}
onMounted(() => { triggerPop(400) })
watch(() => props.mapAnimKey, () => { triggerPop(800) })
const zoom = ref(1)
const panX = ref(0)
const panY = ref(0)
const dragging = ref(false)
const dragStart = ref({ x:0, y:0, px:0, py:0 })
const viewport = ref(null)
const imgWrap = ref(null)

function clampView() {
  if (!viewport.value || !imgWrap.value) return
  const vw = viewport.value.clientWidth
  const vh = viewport.value.clientHeight
  const sw = imgWrap.value.offsetWidth * zoom.value
  const sh = imgWrap.value.offsetHeight * zoom.value
  if (sw <= vw) panX.value = (vw - sw) / 2
  else panX.value = Math.min(0, Math.max(vw - sw, panX.value))
  if (sh <= vh) panY.value = (vh - sh) / 2
  else panY.value = Math.min(0, Math.max(vh - sh, panY.value))
}

function toggleMaximize() { maximized.value = !maximized.value; if (!maximized.value) resetView(); else requestAnimationFrame(clampView) }
function resetView() { zoom.value = 1; panX.value = 0; panY.value = 0; requestAnimationFrame(clampView) }

function onWheel(e) {
  const delta = e.deltaY > 0 ? -0.12 : 0.12
  const newZoom = Math.max(1, Math.min(5, zoom.value + delta))
  const rect = viewport.value.getBoundingClientRect()
  const cx = e.clientX - rect.left
  const cy = e.clientY - rect.top
  const ratio = newZoom / zoom.value
  panX.value = cx - ratio * (cx - panX.value)
  panY.value = cy - ratio * (cy - panY.value)
  zoom.value = newZoom
  requestAnimationFrame(clampView)
}

function onMouseDown(e) {
  if (e.button !== 0) return
  dragging.value = true
  dragStart.value = { x: e.clientX, y: e.clientY, px: panX.value, py: panY.value }
  const onMove = (ev) => { if (!dragging.value) return; panX.value = dragStart.value.px + (ev.clientX - dragStart.value.x); panY.value = dragStart.value.py + (ev.clientY - dragStart.value.y); clampView() }
  const onUp = () => { dragging.value = false; clampView(); window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.map-section { position:relative; z-index:1; max-width:1200px; margin:0 auto; padding:16px clamp(6px,2.5vw,20px) clamp(16px,4vw,36px); }
.map-search-wrap { position:relative; max-width:520px; margin-bottom:16px; }
.map-search-input { width:100%; padding:12px 44px; border:2px solid var(--border); border-radius:12px; font-size:14px; font-family:inherit; background:var(--card); color:var(--fg); transition:border-color 0.3s,box-shadow 0.3s; outline:none; }
.map-search-input:focus { border-color:var(--primary-light); box-shadow:0 0 0 4px var(--primary-pale); }
.map-search-icon { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--fg-muted); font-size:16px; }
.map-search-clear { position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--fg-muted); cursor:pointer; font-size:15px; padding:4px; border-radius:6px; }
.map-search-clear:hover { color:var(--primary); background:var(--bg-deep); }
.map-search-dropdown { position:absolute; top:100%; left:0; right:0; background:var(--card); border:2px solid var(--border); border-radius:var(--radius-sm); margin-top:6px; max-height:300px; overflow-y:auto; z-index:50; box-shadow:0 12px 36px var(--shadow-strong); animation:dropIn 0.2s var(--ease-out); }
.map-search-dropdown-item { display:flex; align-items:center; gap:10px; padding:10px 14px; cursor:pointer; transition:background 0.15s; }
.map-search-dropdown-item:hover { background:var(--primary-pale); }
.map-search-dropdown-item-icon { width:32px; height:32px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
.map-search-dropdown-item-name { font-weight:600; font-size:13px; }
.map-search-dropdown-item-cat { font-size:11px; color:var(--fg-muted); }
.map-filter-row { display:flex; flex-direction:column; align-items:center; gap:8px; margin-bottom:16px; }
.filter-tab-group { display:inline-flex; border-radius:10px; overflow:hidden; border:1.5px solid var(--border); }
.filter-tab { padding:7px 18px; border:none; font-size:clamp(9px,1.6vw,11px); font-weight:600; color:var(--fg-muted); background:var(--card); cursor:pointer; font-family:inherit; transition:all 0.2s; display:flex; align-items:center; gap:4px; }
.filter-tab:hover { background:var(--bg); }
.filter-tab.active { background:var(--primary); color:#fff; }
.filter-tab + .filter-tab { border-left:1.5px solid var(--border); }
.special-tab.active { background:#301934; }
.map-filter-chip { padding:6px 14px; border-radius:20px; border:1.5px solid var(--border); background:var(--card); font-size:12px; font-weight:500; color:var(--fg-muted); cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
.map-filter-chip:hover { border-color:var(--primary-light); color:var(--primary); background:var(--primary-pale); }
.map-filter-chip.active { background:var(--primary); color:#fff; border-color:var(--primary); }
.filter-group-dropdown { display:flex; flex-wrap:wrap; gap:6px; padding:10px; background:var(--card); border:1.5px solid var(--border); border-radius:12px; animation:dropIn 0.35s cubic-bezier(0.22, 0.61, 0.36, 1); max-width:min(560px, 80vw); justify-content:center; }
@keyframes dropIn { from { opacity:0; transform:translateY(-6px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
.all-chip { font-weight:600; }
.special-chip { border-color:var(--border); }
.special-chip:hover { border-color:#301934; color:#301934; }
.special-chip.active { border-style:solid; }
.special-chip.all-chip:hover { border-color:#301934; color:#301934; }
.special-chip.all-chip.active { background:#301934; color:#fff; border-color:#301934; }

.map-container { position:relative; background:var(--card); border:2px solid var(--border); border-radius:var(--radius); overflow:hidden; transition:all 0.3s ease; box-shadow:0 4px 24px var(--shadow-xs); }
.map-container.maximized { position:fixed; inset:0; z-index:195; border-radius:0; border:none; display:flex; flex-direction:column; background:#1a1a1a; }
.map-viewport { position:relative; overflow:hidden; }
.map-container.maximized .map-viewport { flex:1; }
.map-img-wrap { position:relative; user-select:none; }
.map-img-wrap img { width:100%; display:block; pointer-events:none; }

.max-exit-btn { display:none; position:absolute; top:16px; left:16px; z-index:196; align-items:center; gap:6px; padding:8px 16px; border-radius:10px; border:none; background:rgba(0,0,0,0.55); color:#fff; font-size:13px; font-weight:600; font-family:inherit; cursor:pointer; backdrop-filter:blur(8px); }
.max-exit-btn:hover { background:rgba(0,0,0,0.75); }
.map-container.maximized .max-exit-btn { display:flex; }
.max-reset-btn { display:none; position:absolute; top:16px; right:16px; z-index:196; width:38px; height:38px; border-radius:10px; border:none; background:rgba(0,0,0,0.55); color:#fff; cursor:pointer; font-size:16px; align-items:center; justify-content:center; }
.max-reset-btn:hover { background:rgba(0,0,0,0.75); }
.map-container.maximized .max-reset-btn { display:flex; }

.map-loading { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:var(--bg-deep); z-index:1; font-size:14px; color:var(--fg-muted); border-radius:var(--radius); }
.map-loading i { margin-right:8px; animation:spin 1s linear infinite; }
.map-loading::after { content:""; position:absolute; inset:0; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent); background-size:200% 100%; animation:shimmer 2.5s ease-in-out infinite; border-radius:var(--radius); pointer-events:none; }
@keyframes spin { to { transform:rotate(360deg); } }
@keyframes shimmer { 0% { background-position:200% 0; } 100% { background-position:-200% 0; } }
.map-marker { position:absolute; transform:translate(-50%,-100%); cursor:pointer; transition:transform 0.2s,filter 0.2s; }
.markers-layer > .map-marker { opacity:0; transform:translate(-50%,-100%) scale(0); }
.marker-pop { animation: markerBounce 0.55s cubic-bezier(0.25, 0.1, 0.25, 1) both; }


.map-marker-dot {
  width: clamp(16px, 3vw, 22px);
  height: clamp(16px, 3vw, 22px);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(7px, 1.3vw, 10px);
  color: #fff;
  position: relative;
  border-radius: 50% 50% 50% 0;
  transform: rotate(-45deg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.map-marker-dot i {
  transform: rotate(45deg);
}

/* Hover pulse ring */
.map-marker-dot::before {
  content: "";
  position: absolute;
  inset: -4px;
  border-radius: 50%;
  border: 2px solid currentColor;
  opacity: 0;
  transform: scale(0.8);
  transition: opacity 0.4s ease, transform 0.4s ease;
  pointer-events: none;
}
.map-marker:hover .map-marker-dot::before {
  opacity: 0.3;
  transform: scale(1.25);
}
.float-label {
  position: absolute;
  transform: translate(-50%, -100%) translateY(-36px);
  z-index: 999999;
  pointer-events: none;
  white-space: nowrap;
  background: #fff;
  border-radius: 8px;
  padding: 5px 12px 4px;
  box-shadow: 0 4px 18px rgba(0,0,0,0.15);
}
.float-label-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary);
  text-align: center;
  line-height: 1.3;
}
.float-label-sub {
  font-size: 9px;
  font-weight: 400;
  color: var(--fg-muted);
  text-align: center;
  line-height: 1.3;
  margin-top: 1px;
}
.float-label::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #fff;
}

/* Transition for floating label */
.label-enter-active { transition: opacity 0.2s ease, transform 0.2s ease; }
.label-leave-active { transition: opacity 0.15s ease, transform 0.15s ease; }
.label-enter-from { opacity: 0; transform: translate(-50%, -100%) translateY(-28px); }
.label-leave-to { opacity: 0; transform: translate(-50%, -100%) translateY(-28px); }.map-marker:hover {
  z-index: 1000 !important;
  filter: drop-shadow(0 6px 24px rgba(0,0,0,0.35));
}
.map-marker:hover .map-marker-dot {
  width: clamp(22px, 3.8vw, 30px);
  height: clamp(22px, 3.8vw, 30px);
  box-shadow: 0 6px 24px rgba(0,0,0,0.30);
}

@keyframes markerBounce {
  0% { transform:translate(-50%,-100%) scale(0) translateY(12px); opacity:0; }
  25% { opacity:0; }
  45% { transform:translate(-50%,-100%) scale(1.12) translateY(-2px); opacity:1; }
  65% { transform:translate(-50%,-100%) scale(0.90) translateY(2px); }
  80% { transform:translate(-50%,-100%) scale(1.04) translateY(-0.5px); }
  100% { transform:translate(-50%,-100%) scale(1) translateY(0); opacity:1; }
}.map-tooltip { position:absolute; pointer-events:none; opacity:0; background:var(--primary); color:#fff; font-size:12px; padding:6px 12px; border-radius:8px; white-space:nowrap; transform:translate(-50%,-130%); z-index:10; transition:opacity 0.15s; box-shadow:0 4px 14px rgba(0,0,0,0.2); }
.map-tooltip.show { opacity:1; }
.map-compass { position:absolute; top:clamp(4px,1.5vw,12px); left:clamp(4px,1.5vw,12px); z-index:3; display:flex; flex-direction:column; align-items:center; background:rgba(255,255,255,0.75); border-radius:clamp(3px,0.8vw,6px); padding:clamp(1px,0.4vw,3px) clamp(2px,0.6vw,6px); box-shadow:0 1px 4px rgba(0,0,0,0.08); }
.compass-svg { width:clamp(12px,3.5vw,24px); height:clamp(12px,3.5vw,24px); }
.compass-label { font-size:clamp(6px,1.5vw,9px); font-weight:700; color:var(--primary); margin-bottom:1px; }
.map-controls { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; background:var(--bg); border-top:1px solid var(--border); }
.map-legend { display:flex; gap:14px; flex-wrap:wrap; }
.legend-item { display:flex; align-items:center; gap:5px; font-size:11px; color:var(--fg-muted); }
.legend-dot { width:10px; height:10px; border-radius:3px; }
.legend-group-label { font-size:10px; font-weight:700; color:var(--fg-muted); text-transform:uppercase; letter-spacing:0.5px; display:flex; align-items:center; }
.legend-group-label::after { content:''; display:inline-block; width:1px; height:10px; background:var(--border); margin-left:8px; }
.fullscreen-btn { background:var(--card); border:1.5px solid var(--border); border-radius:9px; width:34px; height:34px; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:15px; color:var(--primary); transition:all 0.25s; }
.fullscreen-btn:hover { background:var(--primary); color:#fff; }
</style>
