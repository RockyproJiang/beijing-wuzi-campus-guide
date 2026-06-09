<template>
  <div class="inline-panel" :style="{ '--bldg-color': selectedBldg.color, '--bldg-bg': selectedBldg.bgColor }">

    <!-- ====== HERO BANNER ====== -->
    <div class="bldg-hero" :style="{ background: selectedBldg.bgColor }">
      <div class="bldg-hero-decor"></div>
      <div class="bldg-hero-content">
        <div class="bldg-hero-icon-wrap">
          <div class="bldg-hero-icon" :style="{ background: selectedBldg.color, color: '#fff' }">
            <i :class="selectedBldg.icon"></i>
          </div>
        </div>
        <div class="bldg-hero-text">
          <h2 class="bldg-hero-name" :style="{ color: selectedBldg.color }">{{ selectedBldg.name }}</h2>
          <p class="bldg-hero-sub" :style="{ color: selectedBldg.color }">
            {{ selectedBldg.sub }}<span class="bldg-hero-dot">·</span>{{ activeCategory.name }}
          </p>
          <div class="bldg-hero-stats">
            <span class="bldg-hero-stat" v-if="selectedBldg.info && selectedBldg.info.length" :style="{ color: selectedBldg.color }"><i class="fa-solid fa-circle-info"></i> {{ selectedBldg.info.length }}条信息</span>
            <span class="bldg-hero-stat" v-if="selectedBldg.equipment && selectedBldg.equipment.length" :style="{ color: selectedBldg.color }"><i class="fa-solid fa-toolbox"></i> {{ selectedBldg.equipment.length }}项设备</span>
            <span class="bldg-hero-stat" v-if="selectedBldg.floors && selectedBldg.floors.length" :style="{ color: selectedBldg.color }"><i class="fa-solid fa-layer-group"></i> {{ selectedBldg.floors.length }}个楼层</span>
            <span class="bldg-hero-stat" v-if="selectedBldg.surroundings && selectedBldg.surroundings.length" :style="{ color: selectedBldg.color }"><i class="fa-solid fa-map-location-dot"></i> {{ selectedBldg.surroundings.length }}周边</span>
          </div>
        </div>
        <button v-if="selectedBldg.mapX != null" class="bldg-map-btn" :style="{ background: selectedBldg.color }" @click="showMapPreview = true" title="在地图上查看位置">
          <i class="fa-solid fa-map-pin"></i>
        </button>
      </div>
    </div>

    <!-- ====== TAB BAR ====== -->
    <div class="tab-bar">
      <div class="tab-bar-inner">
        <button class="tab-btn" :class="{ active: l2tab === 'info' }" @click="$emit('update:l2tab', 'info')">
          <i class="fa-solid fa-circle-info"></i>
          <span>建筑信息</span>
        </button>
        <button v-if="selectedBldg.equipment && selectedBldg.equipment.length" class="tab-btn" :class="{ active: l2tab === 'equipment' }" @click="$emit('update:l2tab', 'equipment')">
          <i class="fa-solid fa-toolbox"></i>
          <span>设施设备</span>
        </button>
        <button v-if="selectedBldg.floors && selectedBldg.floors.length" class="tab-btn" :class="{ active: l2tab === 'floors' }" @click="$emit('update:l2tab', 'floors')">
          <i class="fa-solid fa-layer-group"></i>
          <span>楼层信息</span>
        </button>
        <button v-if="selectedBldg.schedule" class="tab-btn" :class="{ active: l2tab === 'schedule' }" @click="$emit('update:l2tab', 'schedule')">
          <i class="fa-solid fa-clock"></i>
          <span>上课时间</span>
        </button>
        <button v-if="selectedBldg.contacts" class="tab-btn" :class="{ active: l2tab === 'contacts' }" @click="$emit('update:l2tab', 'contacts')">
          <i class="fa-solid fa-phone"></i>
          <span>联系电话</span>
        </button>
        <button v-if="selectedBldg.surroundings && selectedBldg.surroundings.length" class="tab-btn" :class="{ active: l2tab === 'surroundings' }" @click="$emit('update:l2tab', 'surroundings')">
          <i class="fa-solid fa-map-location-dot"></i>
          <span>周边设施</span>
        </button>
      </div>
    </div>

    <!-- ====== CONTENT BODY ====== -->
    <div class="inline-body">
      <!-- INFO TAB -->
      <template v-if="l2tab === 'info'">
        <section v-if="selectedBldg.intro" class="content-section intro-section">
          <div class="bldg-intro">
            <p>{{ selectedBldg.intro }}</p>
          </div>
        </section>
        <section v-if="selectedBldg.info && selectedBldg.info.length" class="content-section">
          <h3 class="section-label"><i class="fa-solid fa-bolt"></i> 关键信息</h3>
          <div class="info-grid">
            <div v-for="item in selectedBldg.info" :key="item.label" class="info-card">
              <div class="info-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }"><i :class="infoIcon(item.label)"></i></div>
              <div class="info-text">
                <div class="info-label">{{ item.label }}</div>
                <div class="info-value" :style="{ color: selectedBldg.color }">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </section>
        <section v-if="selectedBldg.timetable" class="content-section">
          <h3 class="section-label"><i class="fa-solid fa-calendar-days"></i> 开放时间</h3>
          <div class="timetable-view">
            <div v-for="(group, gi) in selectedBldg.timetable.groups" :key="gi" class="tt-group">
              <div class="tt-days" :style="{ background: selectedBldg.color }">{{ group.days }}</div>
              <div class="tt-blocks">
                <div v-for="(block, bi) in group.blocks" :key="bi" class="tt-block" :class="'tt-' + block.status">
                  <div class="tt-time">{{ block.time }}</div>
                  <div class="tt-label">{{ block.label }}</div>
                  <div class="tt-bar" :class="'tt-bar-' + block.status"></div>
                </div>
              </div>
              <div v-if="group.note" class="tt-note"><i class="fa-solid fa-circle-info"></i> {{ group.note }}</div>
            </div>
          </div>
        </section>
      </template>

      <!-- EQUIPMENT TAB -->
      <template v-if="l2tab === 'equipment'">
        <div class="equip-grid">
          <div v-for="equip in selectedBldg.equipment" :key="equip.name" class="equip-card">
            <div class="equip-card-header" :style="{ background: selectedBldg.bgColor }">
              <div class="equip-card-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">
                <i :class="equip.icon"></i>
              </div>
              <div class="equip-card-name" :style="{ color: selectedBldg.color }">{{ equip.name }}</div>
            </div>
            <div class="equip-card-body">
              <div v-if="equip.details" class="equip-details">
                <div v-for="d in equip.details" :key="d.label" class="equip-detail-item">
                  <span class="equip-detail-label">{{ d.label }}</span>
                  <span class="equip-detail-value" :style="{ color: selectedBldg.color }">{{ d.value }}</span>
                </div>
              </div>
              <div v-if="equip.priceTable" class="price-section-wrap">
                <div v-for="(rows, section) in equip.priceTable" :key="section" class="price-section">
                  <div class="price-section-title" :style="{ background: selectedBldg.color }">{{ section }}</div>
                  <table class="price-table">
                    <tbody>
                      <template v-for="row in rows" :key="row[0]">
                        <tr>
                          <td class="price-label">{{ row[0] }}</td>
                          <td class="price-value" :style="{ color: selectedBldg.color }">{{ row[1] }}</td>
                        </tr>
                        <tr v-if="row[2]" class="price-note-row">
                          <td colspan="2" class="price-note">{{ row[2] }}</td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- FLOORS TAB -->
      <template v-if="l2tab === 'floors'">
        <div class="floor-list">
          <div v-for="f in selectedBldg.floors" :key="f.name" class="floor-card">
            <div class="floor-card-head">
              <span class="floor-badge" :style="{ background: selectedBldg.color }">{{ f.name }}</span>
              <div v-if="f.highlights && f.highlights.length" class="floor-highlights">
                <span v-for="h in f.highlights" :key="h" class="floor-tag" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">{{ h }}</span>
              </div>
            </div>
            <div class="floor-body">
              <div v-if="f.rooms && f.rooms.length" class="floor-rooms">
                <div v-for="r in f.rooms" :key="r.number" class="floor-room-item">
                  <span class="floor-room-num" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">{{ r.number }}</span>
                  <span class="floor-room-name">{{ r.name }}</span>
                </div>
              </div>
              <div v-if="f.layout" class="floor-layout">
                <div v-for="(val, key) in f.layout" :key="key" class="floor-layout-item">
                  <span class="floor-layout-pos" :style="{ background: selectedBldg.color }">{{ key }}</span>
                  <span class="floor-layout-text">{{ val }}</span>
                </div>
              </div>
              <div v-if="!f.highlights && !f.layout && f.desc" class="floor-desc">
                <span v-for="(part, i) in splitDesc(f.desc)" :key="i" class="floor-desc-item" :style="{ borderLeftColor: selectedBldg.color }">{{ part }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- SCHEDULE TAB -->
      <template v-if="l2tab === 'schedule'">
        <div class="schedule-wrap">
          <div v-for="(item, i) in parseSchedule(selectedBldg.schedule)" :key="i" class="sched-row" :class="{ 'sched-break': item.isBreak }">
            <template v-if="item.isBreak">
              <span class="sched-break-label" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">{{ item.label }}</span>
            </template>
            <template v-else>
              <span class="sched-period" :style="{ color: selectedBldg.color }">{{ item.period }}</span>
              <span class="sched-time">{{ item.time }}</span>
              <div class="sched-line" :style="{ background: selectedBldg.bgColor }"></div>
            </template>
          </div>
        </div>
      </template>

      <!-- CONTACTS TAB -->
      <template v-if="l2tab === 'contacts'">
        <div class="contact-grid">
          <div v-for="c in selectedBldg.contacts" :key="c.label" class="contact-item">
            <div class="contact-dot" :style="{ background: selectedBldg.color }"></div>
            <div class="clabel">{{ c.label }}</div>
            <div class="cvalue" :style="{ color: selectedBldg.color }">{{ c.value }}</div>
          </div>
        </div>
      </template>

      <!-- SURROUNDINGS TAB -->
      <template v-if="l2tab === 'surroundings'">
        <div class="surroundings-list">
          <div v-for="s in selectedBldg.surroundings" :key="s.name" class="surrounding-card">
            <div class="surrounding-dir" :style="{ background: selectedBldg.color }">{{ s.direction }}</div>
            <div class="surrounding-info">
              <div class="surrounding-name" :style="{ color: selectedBldg.color }">{{ s.name }}</div>
              <div class="surrounding-desc">{{ s.desc }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- ====== MAP PREVIEW MODAL ====== -->
    <div v-if="showMapPreview" class="map-preview-backdrop" @click.self="showMapPreview = false">
      <div class="map-preview-dialog">
        <div class="map-preview-header">
          <span class="map-preview-title" :style="{ color: selectedBldg.color }"><i class="fa-solid fa-location-dot" style="margin-right:6px;"></i>{{ selectedBldg.name }} · 校园位置</span>
          <button class="map-preview-close" :style="{ color: selectedBldg.color }" @click="showMapPreview = false"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="map-preview-body">
          <img src="/map.png" alt="校园地图" class="map-preview-img" />
          <div class="map-preview-marker" :style="{ left: selectedBldg.mapX + '%', top: selectedBldg.mapY + '%' }">
            <div class="map-preview-dot" :style="{ background: selectedBldg.color }"><i :class="selectedBldg.icon"></i></div>
            <div class="map-preview-label">{{ selectedBldg.name }}</div>
            <div class="map-preview-ripple"></div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps({ selectedBldg: Object, activeCategory: Object, l2tab: String })
defineEmits(['update:l2tab'])
const showMapPreview = ref(false)
function splitDesc(desc) { return desc.split(/[；;]/).filter(Boolean) }
function infoIcon(label) {
  const map = { '开门':'fa-solid fa-door-open','关门':'fa-solid fa-door-closed','宵禁':'fa-solid fa-moon','断电':'fa-solid fa-bolt','限电':'fa-solid fa-bolt-lightning','电费':'fa-solid fa-coins','功率':'fa-solid fa-gauge-high','营业':'fa-solid fa-clock','开放':'fa-solid fa-clock','支付':'fa-solid fa-credit-card','外来':'fa-solid fa-user-group','价格':'fa-solid fa-tag','禁止':'fa-solid fa-ban','状态':'fa-solid fa-circle-info','备注':'fa-solid fa-note-sticky','位置':'fa-solid fa-location-dot','电话':'fa-solid fa-phone','楼层':'fa-solid fa-layer-group','充电桩':'fa-solid fa-charging-station','饮水':'fa-solid fa-droplet','设施':'fa-solid fa-toolbox','时间':'fa-solid fa-clock','规格':'fa-solid fa-ruler','封闭':'fa-solid fa-lock','开馆':'fa-solid fa-book-open','入馆':'fa-solid fa-id-card','每周':'fa-solid fa-hourglass-half','免费':'fa-solid fa-gift','监督':'fa-solid fa-shield-halved','小型车':'fa-solid fa-car','大型车':'fa-solid fa-truck','夜间':'fa-solid fa-moon','方式':'fa-solid fa-qrcode','电费标准':'fa-solid fa-bolt'}
  for (const [k,v] of Object.entries(map)) if (label.includes(k)) return v
  return 'fa-solid fa-circle-info'
}
function parseSchedule(raw) {
  return raw.split('\n').filter(Boolean).map(line => {
    const m = line.match(/^(.+?)\s+(\d{2}:\d{2}[-~]\d{2}:\d{2})$/)
    if (m) return { period: m[1], time: m[2], isBreak: false }
    return { label: line, isBreak: true }
  })
}
</script>

<style scoped>
.inline-panel { background:var(--card); border:1px solid var(--border); border-radius:16px; overflow:hidden; animation:bldgEnter 0.35s cubic-bezier(0.22,0.61,0.36,1); }

/* ====== HERO BANNER ====== */
.bldg-hero { position:relative; padding:36px 32px 28px; overflow:hidden; }
@keyframes bldgEnter { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
.bldg-hero::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:var(--bldg-bg, var(--primary-pale)); z-index:4; opacity:0.5; }
.bldg-hero::after { content:''; position:absolute; bottom:0; left:0; right:0; height:48px; background:linear-gradient(to top, var(--card), transparent); pointer-events:none; z-index:2; }
.bldg-hero-decor { position:absolute; inset:0; opacity:0.12; background-image:radial-gradient(circle at 20% 40%, var(--bldg-color, var(--primary)) 0%, transparent 55%), radial-gradient(circle at 80% 30%, var(--bldg-color, var(--primary)) 0%, transparent 50%), radial-gradient(circle at 50% 90%, var(--bldg-color, var(--primary)) 0%, transparent 40%); pointer-events:none; }
.bldg-hero-content { position:relative; z-index:3; display:flex; align-items:flex-start; gap:20px; }
.bldg-hero-icon-wrap { flex-shrink:0; }
.bldg-hero-icon { width:64px; height:64px; border-radius:18px; display:flex; align-items:center; justify-content:center; font-size:28px; box-shadow:0 4px 20px rgba(0,0,0,0.12); animation:bldgIconPop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
@keyframes bldgIconPop { from { transform:scale(0.6); opacity:0; } to { transform:scale(1); opacity:1; } }
.bldg-hero-text { flex:1; min-width:0; }
.bldg-hero-name { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(16px,3vw,24px); line-height:1.2; margin:0 0 4px; }
.bldg-hero-sub { font-size:clamp(10px,1.8vw,13px); opacity:0.7; margin:0 0 12px; }
.bldg-hero-dot { margin:0 6px; }
.bldg-hero-stats { display:flex; flex-wrap:wrap; gap:6px; }
.bldg-hero-stat { font-size:11px; font-weight:500; opacity:0.7; display:inline-flex; align-items:center; gap:4px; background:rgba(255,255,255,0.35); padding:4px 10px; border-radius:8px; backdrop-filter:blur(4px); }
.bldg-hero-stat i { font-size:10px; }
.bldg-map-btn { width:40px; height:40px; border-radius:12px; border:none; color:#fff; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; box-shadow:0 4px 16px rgba(0,0,0,0.18); transition:all 0.25s ease; animation:bldgIconPop 0.4s 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
.bldg-map-btn:hover { transform:scale(1.1) rotate(-8deg); box-shadow:0 6px 24px rgba(0,0,0,0.25); }
@media (max-width:600px) {
  .bldg-hero { padding:24px 16px 20px; }
@keyframes bldgEnter { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
.bldg-hero::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:var(--bldg-bg, var(--primary-pale)); z-index:4; opacity:0.5; }
  .bldg-hero-icon { width:48px; height:48px; font-size:21px; border-radius:14px; }
  .bldg-hero-content { gap:14px; flex-wrap:wrap; }
  .bldg-hero-stats { gap:4px; }
  .bldg-hero-stat { font-size:10px; padding:3px 8px; }
  .bldg-map-btn { width:36px; height:36px; font-size:14px; }
}

/* ====== TAB BAR ====== */
.tab-bar { background:var(--card); border-bottom:1.5px solid var(--bg-deep); padding:0 24px; position:sticky; top:0; z-index:10; }
.tab-bar-inner { display:flex; gap:4px; overflow-x:auto; scrollbar-width:none; -ms-overflow-style:none; }
.tab-bar-inner::-webkit-scrollbar { display:none; }
.tab-btn { display:inline-flex; align-items:center; gap:5px; padding:12px 14px; border:none; background:none; font-size:13px; font-weight:500; color:var(--fg-muted); cursor:pointer; font-family:inherit; position:relative; transition:all 0.25s; white-space:nowrap; flex-shrink:0; border-bottom:2px solid transparent; margin-bottom:-1.5px; }
.tab-btn i { font-size:12px; }
.tab-btn:hover { color:var(--bldg-color, var(--primary)); }
.tab-btn.active { color:var(--bldg-color, var(--primary)); font-weight:700; border-bottom-color:var(--bldg-color, var(--primary)); }
@media (max-width:600px) {
  .tab-bar { padding:0 12px; }
  .tab-btn { padding:10px 10px; font-size:12px; }
  .tab-btn span { font-size:11px; }
  .tab-btn i { font-size:14px; }
}

/* ====== CONTENT BODY ====== */
.inline-body { padding:20px 24px 32px; }
.content-section { margin-bottom:24px; }
.content-section:last-child { margin-bottom:0; }
.section-label { font-family:'Noto Serif SC',serif; font-weight:700; font-size:14px; color:var(--fg); margin:0 0 12px; display:flex; align-items:center; gap:6px; }
.section-label { padding:6px 12px; background:linear-gradient(135deg, var(--bldg-bg, var(--primary-pale)), transparent); border-radius:8px; margin-left:-8px; }
.section-label i { font-size:12px; color:var(--bldg-color, var(--primary)); }

/* ====== INFO GRID ====== */
.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:600px) { .info-grid { grid-template-columns:1fr; } }
.info-card { background:var(--card); border:1px solid var(--bg-deep); border-radius:12px; padding:16px; display:flex; gap:14px; align-items:flex-start; transition:all 0.25s ease; }
.info-card:hover { border-color:var(--bldg-color, var(--primary)); box-shadow:0 4px 20px var(--shadow); transform:translateY(-2px); }
.info-card { border-left:3px solid var(--bldg-bg, var(--primary-pale)); }
.info-card:hover .info-icon { transform:scale(1.08) rotate(-3deg); }
.info-icon { transition:transform 0.25s ease; }
.info-icon { width:38px; height:38px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.info-text { flex:1; min-width:0; }
.info-label { font-size:10px; font-weight:600; color:var(--fg-muted); text-transform:uppercase; letter-spacing:0.4px; margin-bottom:4px; }
.info-value { font-weight:700; font-size:14px; white-space:pre-line; line-height:1.5; word-break:break-word; }

/* ====== BUILDING INTRO ====== */
.intro-section { margin-bottom:20px; }
.bldg-intro {
  background: linear-gradient(135deg, var(--bldg-bg, var(--primary-pale)), transparent 80%);
  border-radius:14px;
  padding:20px 22px;
  position:relative;
  border:1px solid transparent;
  transition:all 0.3s ease;
}
.bldg-intro:hover { border-color:var(--bldg-color, var(--primary-light)); }
.bldg-intro::before {
  content:"\f0f6";
  font-family:"Font Awesome 6 Free";
  font-weight:900;
  position:absolute;
  top:12px;
  right:14px;
  font-size:28px;
  opacity:0.06;
  color:var(--bldg-color, var(--primary));
}
.bldg-intro p {
  font-size:13px;
  line-height:1.8;
  color:var(--fg);
  margin:0;
  position:relative;
  z-index:1;
  max-width:600px;
}

/* ====== TIMETABLE ====== */
.timetable-view { display:flex; flex-direction:column; gap:16px; }
.tt-group { background:var(--card); border:1px solid var(--bg-deep); border-radius:12px; overflow:hidden; }
.tt-days { font-weight:700; font-size:13px; color:#fff; padding:10px 16px; display:flex; align-items:center; gap:6px; }
.tt-days { background:linear-gradient(135deg, var(--bldg-color, var(--primary)), rgba(0,0,0,0.15)); }
.tt-days::before { content:'\f073'; font-family:'Font Awesome 6 Free'; font-weight:900; font-size:12px; opacity:0.8; }
.tt-blocks { display:flex; flex-wrap:wrap; }
.tt-block { flex:1; min-width:90px; padding:12px 14px; text-align:center; position:relative; overflow:hidden; transition:background 0.2s; }
.tt-block:hover { filter:brightness(0.96); }
.tt-time { font-weight:700; font-size:13px; color:var(--fg); margin-bottom:4px; font-variant-numeric:tabular-nums; }
.tt-label { font-size:11px; font-weight:500; }
.tt-bar { position:absolute; bottom:0; left:0; right:0; height:3px; }
.tt-open { background:#D5F5E3; }
.tt-open .tt-label { color:#145A32; }
.tt-open .tt-bar-open { background:#27AE60; }
.tt-closed { background:#FDEDEC; }
.tt-closed .tt-label { color:#922B21; }
.tt-closed .tt-bar-closed { background:#E74C3C; }
.tt-mixed { background:#FEF9E7; }
.tt-mixed .tt-label { color:#7D6608; }
.tt-mixed .tt-bar-mixed { background:repeating-linear-gradient(90deg, #27AE60 0px, #27AE60 6px, #E74C3C 6px, #E74C3C 12px); }
.tt-note { font-size:11px; color:var(--fg-muted); padding:8px 16px 12px; border-top:1px dashed var(--border); display:flex; align-items:center; gap:4px; }
.tt-note i { color:var(--accent); font-size:12px; }

/* ====== EQUIPMENT ====== */
.equip-grid { display:flex; flex-direction:column; gap:16px; }
.equip-card { background:var(--card); border:1px solid var(--bg-deep); border-radius:12px; overflow:hidden; transition:all 0.3s ease; }
.equip-card:hover { border-color:var(--bldg-color, var(--primary-light)); box-shadow:0 6px 24px var(--shadow); transform:translateY(-2px); }
.equip-card-header { display:flex; align-items:center; gap:12px; padding:16px 18px; border-bottom:1px solid rgba(27,67,50,0.06); }
.equip-card-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.equip-card-name { font-weight:700; font-size:15px; }
.equip-card-body { padding:16px 18px; }
.equip-details { display:flex; flex-direction:column; gap:8px; }
.equip-detail-item { display:flex; gap:10px; padding:10px 14px; background:var(--bg); border-radius:8px; align-items:flex-start; }
.equip-detail-label { font-size:11px; font-weight:600; color:var(--fg-muted); flex-shrink:0; min-width:70px; }
.equip-detail-value { font-size:13px; font-weight:500; white-space:pre-line; line-height:1.5; flex:1; }
.price-section-wrap { margin-top:16px; display:flex; flex-direction:column; gap:14px; }
.price-section { background:var(--card); border:1px solid var(--bg-deep); border-radius:10px; overflow:hidden; box-shadow:0 1px 4px var(--shadow-xs); }
.price-section-title { font-size:13px; font-weight:800; color:#fff; padding:10px 16px; letter-spacing:0.04em; }
.price-table { width:100%; border-collapse:collapse; }
.price-table td { padding:9px 14px; font-size:13px; border-bottom:1px solid var(--bg-deep); }
.price-table tr:nth-child(even) td { background:rgba(27,67,50,0.02); }
.price-table tr:last-child td { border-bottom:none; }
.price-label { color:var(--fg); font-weight:500; }
.price-value { font-weight:700; text-align:right; white-space:nowrap; font-size:14px; }
.price-note-row td { border-bottom:none; padding-top:0; }
.price-note { font-size:11px; color:var(--fg-muted); font-style:italic; padding-left:14px; }

/* ====== FLOORS ====== */
.floor-list { display:flex; flex-direction:column; gap:12px; }
.floor-card { background:var(--card); border:1px solid var(--bg-deep); border-radius:12px; overflow:hidden; transition:all 0.3s ease; }
.floor-card:hover { border-color:var(--bldg-color, var(--primary-light)); box-shadow:0 4px 16px var(--shadow); transform:translateY(-1px); }
.floor-card-head { display:flex; align-items:center; gap:8px; padding:12px 16px; border-bottom:1px solid var(--bg-deep); flex-wrap:wrap; }
.floor-badge { color:#fff; font-weight:800; font-size:14px; padding:6px 14px; border-radius:6px; flex-shrink:0; letter-spacing:0.05em; }
.floor-badge { box-shadow:0 2px 8px rgba(0,0,0,0.1); }
.floor-highlights { display:flex; flex-wrap:wrap; gap:5px; flex:1; }
.floor-tag { font-size:11px; font-weight:600; padding:4px 10px; border-radius:6px; border:1px solid transparent; transition:all 0.2s; }
.floor-tag:hover { border-color:var(--bldg-color, var(--primary-light)); transform:translateY(-1px); }
.floor-body { padding:14px 16px; }
.floor-rooms { display:flex; flex-direction:column; gap:3px; margin-bottom:10px; }
.floor-room-item { display:flex; align-items:center; gap:10px; padding:7px 10px; border-radius:6px; transition:background 0.1s; }
.floor-room-item:hover { background:var(--bg); }
.floor-room-num { font-size:12px; font-weight:700; padding:2px 8px; border-radius:4px; min-width:44px; text-align:center; flex-shrink:0; }
.floor-room-name { font-size:13px; color:var(--fg); line-height:1.4; }
.floor-layout { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
@media (max-width:500px) { .floor-layout { grid-template-columns:1fr; } }
.floor-layout-item { background:var(--bg); border-radius:8px; padding:10px 12px; display:flex; gap:8px; align-items:flex-start; transition:all 0.2s ease; border:1px solid transparent; }
.floor-layout-item:hover { border-color:var(--bldg-color, var(--primary-light)); }
.floor-layout-pos { font-size:10px; font-weight:700; color:#fff; padding:3px 8px; border-radius:5px; white-space:nowrap; flex-shrink:0; letter-spacing:0.05em; }
.floor-layout-text { font-size:12px; color:var(--fg); line-height:1.6; }
.floor-desc { display:flex; flex-direction:column; gap:8px; }
.floor-desc-item { background:var(--bg); padding:10px 14px; border-radius:6px; font-size:13px; color:var(--fg); line-height:1.6; border-left:3px solid; }

/* ====== SCHEDULE ====== */
.schedule-wrap { max-width:480px; margin:0 auto; display:flex; flex-direction:column; gap:4px; position:relative; padding-left:14px; }
.schedule-wrap::before { content:''; position:absolute; left:17px; top:8px; bottom:8px; width:2px; background:var(--bg-deep); border-radius:1px; }
.sched-row { display:flex; align-items:center; padding:10px 20px; transition:background 0.15s; border-radius:8px; position:relative; }
.sched-row:not(.sched-break):hover { background:rgba(27,67,50,0.04); }
.sched-row:not(.sched-break)::before { content:''; position:absolute; left:-13px; top:50%; transform:translateY(-50%); width:10px; height:10px; border-radius:50%; background:var(--bldg-color, var(--primary)); border:2px solid var(--card); z-index:1; box-shadow:0 0 0 2px var(--bldg-bg, transparent); }
.sched-row:not(.sched-break)::before { box-shadow:0 0 0 3px var(--bldg-bg, var(--primary-pale)); }
.sched-period { flex:1; font-weight:600; font-size:14px; display:flex; align-items:center; gap:8px; padding-left:16px; }
.sched-time { font-size:13px; color:var(--fg-muted); font-variant-numeric:tabular-nums; }
.sched-line { width:40px; height:2px; border-radius:1px; margin-left:auto; margin-right:8px; opacity:0.3; }
.sched-break { justify-content:center; padding:6px 20px; }
.sched-break-label { font-size:12px; font-weight:600; padding:6px 18px; border-radius:20px; }

/* ====== CONTACTS ====== */
.contact-grid { display:flex; flex-direction:column; gap:8px; }
.contact-item { display:flex; gap:12px; padding:12px 16px; background:var(--card); border:1px solid var(--bg-deep); border-radius:10px; align-items:center; transition:all 0.2s; }
.contact-item:hover { border-color:var(--bldg-color, var(--primary-light)); box-shadow:0 2px 8px var(--shadow-xs); transform:translateX(3px); }
.contact-item:hover { border-left-color:var(--bldg-color, var(--primary)); }
.contact-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
.contact-item .clabel { font-size:12px; color:var(--fg-muted); flex-shrink:0; min-width:80px; font-weight:500; }
.contact-item .cvalue { font-size:13px; font-weight:600; }

/* ====== SURROUNDINGS ====== */
.surroundings-list { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
@media (max-width:600px) { .surroundings-list { grid-template-columns:1fr; } }
.surrounding-card { display:flex; gap:12px; align-items:center; background:var(--card); border:1px solid var(--bg-deep); border-radius:10px; padding:14px 16px; transition:all 0.25s ease; }
.surrounding-card:hover { border-color:var(--bldg-color, var(--primary-light)); box-shadow:0 4px 16px var(--shadow); transform:translateY(-2px); }
.surrounding-dir { width:34px; height:34px; border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:13px; flex-shrink:0; box-shadow:0 2px 8px rgba(0,0,0,0.1); }
.surrounding-dir { background:linear-gradient(135deg, var(--bldg-color, var(--primary)), rgba(0,0,0,0.2)) !important; }
.surrounding-info { flex:1; }
.surrounding-name { font-weight:700; font-size:14px; margin-bottom:2px; }
.surrounding-desc { font-size:12px; color:var(--fg-muted); line-height:1.4; }

/* ====== MAP PREVIEW MODAL ====== */
.map-preview-backdrop { position:fixed; inset:0; z-index:250; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); animation:fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
.map-preview-dialog { background:var(--card); border-radius:16px; box-shadow:0 16px 48px rgba(0,0,0,0.25); width:min(90vw, 620px); max-height:85vh; overflow:hidden; animation:scaleIn 0.25s ease; }
@keyframes scaleIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
.map-preview-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border); }
.map-preview-title { font-weight:700; font-size:15px; display:flex; align-items:center; }
.map-preview-close { width:32px; height:32px; border-radius:8px; border:none; background:var(--bg); cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.map-preview-close:hover { color:#fff; }
.map-preview-body { position:relative; padding:12px; }
.map-preview-img { width:100%; display:block; border-radius:8px; border:1px solid var(--border); }
.map-preview-marker { position:absolute; transform:translate(-50%,-50%); z-index:2; pointer-events:none; }
.map-preview-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.25); border:3px solid #fff; }
.map-preview-label { position:absolute; top:26px; left:50%; transform:translateX(-50%); font-size:11px; font-weight:700; white-space:nowrap; background:rgba(255,255,255,0.95); padding:3px 8px; border-radius:5px; box-shadow:0 1px 4px rgba(0,0,0,0.12); }
.map-preview-ripple { position:absolute; top:12px; left:12px; width:20px; height:20px; border-radius:50%; border:3px solid var(--accent); animation:ripplePulse 1.8s ease-out infinite; transform:translate(-50%,-50%); }
@keyframes ripplePulse { 0% { transform:translate(-50%,-50%) scale(1); opacity:0.7; } 100% { transform:translate(-50%,-50%) scale(3.2); opacity:0; } }
</style>


