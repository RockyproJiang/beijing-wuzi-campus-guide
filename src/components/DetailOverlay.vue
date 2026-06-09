<template>
  <div class="detail-overlay" @keydown.escape="$emit('close')">
    <div class="detail-overlay-header">
      <button class="detail-back-btn" @click="$emit('close')" title="返回">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="content-panel-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">
        <i :class="selectedBldg.icon"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div class="detail-overlay-title">{{ selectedBldg.name }}</div>
        <div class="detail-overlay-sub">{{ selectedBldg.sub }} · {{ activeCategory.name }}</div>
      </div>
      <button v-if="selectedBldg.mapX != null" class="map-pin-btn" @click="showMapPreview = true" title="在地图上查看位置">
        <i class="fa-solid fa-map-pin"></i> 地图位置
      </button>
    </div>
    <!-- 地图预览弹窗 -->
    <div v-if="showMapPreview" class="map-preview-backdrop" @click.self="showMapPreview = false">
      <div class="map-preview-dialog">
        <div class="map-preview-header">
          <span class="map-preview-title"><i class="fa-solid fa-location-dot" style="margin-right:6px;"></i>{{ selectedBldg.name }} · 校园位置</span>
          <button class="map-preview-close" @click="showMapPreview = false"><i class="fa-solid fa-xmark"></i></button>
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
    <div class="detail-overlay-body">
      <div class="l2-tabs">
        <button class="l2-tab-btn" :class="{ active: l2tab === 'info' }" @click="$emit('update:l2tab', 'info')">
          <i class="fa-solid fa-circle-info" style="margin-right:4px;"></i>建筑信息
        </button>
        <button
          v-if="selectedBldg.equipment && selectedBldg.equipment.length > 0"
          class="l2-tab-btn" :class="{ active: l2tab === 'equipment' }"
          @click="$emit('update:l2tab', 'equipment')"
        >
          <i class="fa-solid fa-toolbox" style="margin-right:4px;"></i>设施设备
        </button>
        <button
          v-if="selectedBldg.floors && selectedBldg.floors.length > 0"
          class="l2-tab-btn" :class="{ active: l2tab === 'floors' }"
          @click="$emit('update:l2tab', 'floors')"
        >
          <i class="fa-solid fa-layer-group" style="margin-right:4px;"></i>楼层详情
        </button>
        <button
          v-if="selectedBldg.schedule"
          class="l2-tab-btn" :class="{ active: l2tab === 'schedule' }"
          @click="$emit('update:l2tab', 'schedule')"
        >
          <i class="fa-solid fa-clock" style="margin-right:4px;"></i>上课时间
        </button>
        <button
          v-if="selectedBldg.contacts"
          class="l2-tab-btn" :class="{ active: l2tab === 'contacts' }"
          @click="$emit('update:l2tab', 'contacts')"
        >
          <i class="fa-solid fa-phone" style="margin-right:4px;"></i>联系电话
        </button>
        <button
          v-if="selectedBldg.surroundings && selectedBldg.surroundings.length"
          class="l2-tab-btn" :class="{ active: l2tab === 'surroundings' }"
          @click="$emit('update:l2tab', 'surroundings')"
        >
          <i class="fa-solid fa-map-location-dot" style="margin-right:4px;"></i>周边设施
        </button>
      </div>

      <template v-if="l2tab === 'info'">
        <section v-if="selectedBldg.intro" class="content-section">
          <div class="bldg-intro">
            <p>{{ selectedBldg.intro }}</p>
          </div>
        </section>
        <div class="info-grid">
          <div v-for="item in selectedBldg.info" :key="item.label" class="info-card">
            <div class="info-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }"><i :class="infoIcon(item.label)"></i></div>
            <div class="info-text">
              <div class="info-label">{{ item.label }}</div>
              <div class="info-value">{{ item.value }}</div>
            </div>
          </div>
        </div>
        <div v-if="selectedBldg.timetable" class="timetable-view" style="margin-top:18px;">
          <div v-for="(group, gi) in selectedBldg.timetable.groups" :key="gi" class="tt-group">
            <div class="tt-days">{{ group.days }}</div>
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
      </template>

      <template v-if="l2tab === 'equipment'">
        <div v-for="equip in selectedBldg.equipment" :key="equip.name" class="equip-card">
          <div class="equip-card-header" :style="{ background: selectedBldg.bgColor }">
            <div class="equip-card-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">
              <i :class="equip.icon"></i>
            </div>
            <div class="equip-card-name">{{ equip.name }}</div>
          </div>
          <div class="equip-card-body">
            <div class="info-grid">
              <div v-for="d in equip.details" :key="d.label" class="info-item">
                <div class="ilabel">{{ d.label }}</div>
                <div class="ivalue">{{ d.value }}</div>
              </div>
            </div>
            <div v-if="equip.priceTable" class="price-divider"></div>
            <div v-if="equip.priceTable" class="price-tables">
              <div v-for="(rows, section) in equip.priceTable" :key="section" class="price-section">
                <div class="price-section-title">{{ section }}</div>
                <table class="price-table">
                  <tbody>
                    <template v-for="row in rows" :key="row[0]">
                      <tr>
                        <td class="price-label">{{ row[0] }}</td>
                        <td class="price-value">{{ row[1] }}</td>
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
      </template>

      <template v-if="l2tab === 'floors'">
        <div class="floor-list">
          <div v-for="f in selectedBldg.floors" :key="f.name" class="floor-card">
            <div class="floor-badge" :style="{ background: selectedBldg.color }">{{ f.name }}</div>
            <div class="floor-body">
              <div v-if="f.highlights && f.highlights.length" class="floor-highlights">
                <span v-for="h in f.highlights" :key="h" class="floor-tag" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">{{ h }}</span>
              </div>
              <div v-if="f.rooms && f.rooms.length" class="floor-rooms">
                <div v-for="r in f.rooms" :key="r.number" class="floor-room-item">
                  <span class="floor-room-num">{{ r.number }}</span>
                  <span class="floor-room-name">{{ r.name }}</span>
                </div>
              </div>
              <div v-if="f.layout" class="floor-layout">
                <div v-for="(val, key) in f.layout" :key="key" class="floor-layout-item">
                  <span class="floor-layout-pos">{{ key }}</span>
                  <span class="floor-layout-text">{{ val }}</span>
                </div>
              </div>
              <div v-if="!f.highlights && !f.layout && f.desc" class="floor-desc">
                <span v-for="(part, i) in splitDesc(f.desc)" :key="i" class="floor-desc-item">{{ part }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-if="l2tab === 'schedule'">
        <div class="schedule-wrap">
          <div v-for="(item, i) in parseSchedule(selectedBldg.schedule)" :key="i" class="sched-row" :class="{ 'sched-break': item.isBreak }">
            <template v-if="item.isBreak">
              <span class="sched-break-label">{{ item.label }}</span>
            </template>
            <template v-else>
              <span class="sched-period">{{ item.period }}</span>
              <span class="sched-time">{{ item.time }}</span>
            </template>
          </div>
        </div>
      </template>

      <template v-if="l2tab === 'contacts'">
        <div class="contact-grid">
          <div v-for="c in selectedBldg.contacts" :key="c.label" class="contact-item">
            <div class="clabel">{{ c.label }}</div>
            <div class="cvalue">{{ c.value }}</div>
          </div>
        </div>
      </template>
      <template v-if="l2tab === 'surroundings'">
        <div class="surroundings-list">
          <div v-for="s in selectedBldg.surroundings" :key="s.name" class="surrounding-card">
            <div class="surrounding-dir">{{ s.direction }}</div>
            <div class="surrounding-info">
              <div class="surrounding-name">{{ s.name }}</div>
              <div class="surrounding-desc">{{ s.desc }}</div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
defineProps({
  selectedBldg: Object,
  activeCategory: Object,
  l2tab: String
})
defineEmits(['close', 'update:l2tab'])
const showMapPreview = ref(false)
function splitDesc(desc) { return desc.split(/[；;]/).filter(Boolean) }
function infoIcon(label) {
  const map = { '开门':'fa-solid fa-door-open','关门':'fa-solid fa-door-closed','宵禁':'fa-solid fa-moon','断电':'fa-solid fa-bolt','限电':'fa-solid fa-bolt-lightning','电费':'fa-solid fa-coins','功率':'fa-solid fa-gauge-high','营业':'fa-solid fa-clock','开放':'fa-solid fa-clock','支付':'fa-solid fa-credit-card','外来':'fa-solid fa-user-group','价格':'fa-solid fa-tag','禁止':'fa-solid fa-ban','状态':'fa-solid fa-circle-info','备注':'fa-solid fa-note-sticky','位置':'fa-solid fa-location-dot','电话':'fa-solid fa-phone','楼层':'fa-solid fa-layer-group','充电桩':'fa-solid fa-charging-station','饮水':'fa-solid fa-droplet','设施':'fa-solid fa-toolbox','时间':'fa-solid fa-clock','规格':'fa-solid fa-ruler','封闭':'fa-solid fa-lock','开馆':'fa-solid fa-book-open','入馆':'fa-solid fa-id-card','每周':'fa-solid fa-hourglass-half','免费':'fa-solid fa-gift','监督':'fa-solid fa-shield-halved','小型车':'fa-solid fa-car','大型车':'fa-solid fa-truck','夜间':'fa-solid fa-moon','方式':'fa-solid fa-qrcode','电费标准':'fa-solid fa-bolt' }
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
.detail-overlay { position:fixed; inset:0; z-index:200; display:flex; flex-direction:column; background:var(--card); overflow-y:auto; animation:detailIn 0.28s ease; }
@keyframes detailIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
.detail-overlay-header { position:sticky; top:0; z-index:10; display:flex; align-items:center; gap:14px; padding:14px 24px; background:rgba(255,255,255,0.95); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); }
.detail-back-btn { width:38px; height:38px; border-radius:10px; border:1.5px solid var(--border); background:var(--card); cursor:pointer; font-size:16px; color:var(--primary); display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; }
.detail-back-btn:hover { background:var(--primary); color:#fff; border-color:var(--primary); }
.detail-overlay-title { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(13px,3.5vw,18px); color:var(--primary); }
.detail-overlay-sub { font-size:12px; color:var(--fg-muted); }
.detail-overlay-body { padding:clamp(10px,2.5vw,18px) clamp(10px,2.5vw,20px) 40px; max-width:900px; margin:0 auto; width:100%; }
.detail-overlay-body .l2-tabs { padding:0; margin-bottom:18px; }
.detail-overlay-body .info-grid { margin-bottom:10px; }
.l2-tabs { display:flex; gap:0; border-bottom:2px solid var(--bg-deep); flex-wrap:wrap; }
.l2-tab-btn { padding:8px 12px; border:none; background:none; font-size:clamp(9px,1.6vw,11px); font-weight:500; color:var(--fg-muted); cursor:pointer; position:relative; transition:all 0.25s; font-family:inherit; white-space:nowrap; }
.l2-tab-btn:hover { color:var(--primary); }
.l2-tab-btn.active { color:var(--primary); font-weight:700; }
.l2-tab-btn.active::after { content:''; position:absolute; bottom:-2px; left:0; right:0; height:3px; background:var(--primary); border-radius:3px 3px 0 0; }
.bldg-intro {
  background:linear-gradient(135deg, var(--primary-pale), transparent 80%);
  border-radius:12px;
  padding:18px 20px;
  margin-bottom:16px;
  border:1px solid var(--border);
  transition:border-color 0.2s;
}
.bldg-intro:hover { border-color:var(--primary-light); }
.bldg-intro p {
  font-size:13px;
  line-height:1.8;
  color:var(--fg);
  margin:0;
}

.info-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
@media (max-width:600px) { .info-grid { grid-template-columns:1fr; } }
.info-card { background:var(--card); border:1px solid var(--bg-deep); border-radius:var(--radius-sm); padding:14px 16px; display:flex; gap:12px; align-items:flex-start; transition:border-color 0.2s,box-shadow 0.2s; }
.info-card:hover { border-color:var(--primary); box-shadow:0 2px 12px var(--shadow-strong); }
.info-icon { width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
.info-text { flex:1; min-width:0; }
.info-label { font-size:10px; font-weight:600; color:var(--fg-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px; }
.info-value { font-weight:700; font-size:14px; color:var(--primary); white-space:pre-line; line-height:1.5; word-break:break-word; }
.ilabel { font-size:10px; font-weight:700; color:var(--fg-muted); text-transform:uppercase; letter-spacing:0.5px; margin-bottom:3px; }
.ivalue { font-weight:600; font-size:13px; color:var(--primary); white-space:pre-line; line-height:1.5; }
.equip-card { background:var(--bg); border-radius:var(--radius-sm); margin-bottom:12px; overflow:hidden; border:1.5px solid var(--bg-deep); }
.equip-card-header { display:flex; align-items:center; gap:10px; padding:14px 16px; background:var(--primary-pale); }
.equip-card-icon { width:34px; height:34px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:14px; flex-shrink:0; }
.equip-card-name { font-weight:700; font-size:14px; color:var(--primary); }
.equip-card-body { padding:14px 16px; }
.equip-card-body .info-grid { margin:0; }
.equip-info-section { margin-bottom:6px; }
.equip-info-section:last-child { margin-bottom:0; }
.price-divider { height:1px; background:var(--border); margin:16px 0 14px; }
.price-tables { display:flex; flex-direction:column; gap:14px; }
.price-section { background:#f8faf7; border-radius:8px; overflow:hidden; }
.price-section-title { font-size:12px; font-weight:700; color:var(--primary); padding:8px 14px; background:var(--primary-pale); }
.price-table { width:100%; border-collapse:collapse; }
.price-table td { padding:7px 14px; font-size:13px; border-bottom:1px solid var(--bg-deep); }
.price-table tr:last-child td { border-bottom:none; }
.price-label { color:var(--fg); font-weight:500; }
.price-value { color:var(--primary); font-weight:600; text-align:right; white-space:nowrap; }
.price-note-row td { border-bottom:none; padding-top:0; }
.price-note { font-size:11px; color:var(--fg-muted); font-style:italic; padding-left:14px; }
.floor-list { display:flex; flex-direction:column; gap:14px; }
.floor-card { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; }
.floor-badge { color:#fff; font-weight:700; font-size:14px; padding:8px 16px; display:inline-block; border-radius:0 0 var(--radius-sm) 0; }
.floor-body { padding:14px 16px; }
.floor-highlights { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:10px; }
.floor-tag { font-size:12px; font-weight:600; padding:4px 10px; border-radius:6px; }
.floor-layout { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
@media (max-width:500px) { .floor-layout { grid-template-columns:1fr; } }
.floor-layout-item { background:var(--bg); border-radius:6px; padding:8px 10px; display:flex; gap:6px; align-items:flex-start; }
.floor-layout-pos { font-size:10px; font-weight:700; color:#fff; background:var(--primary); padding:2px 6px; border-radius:4px; white-space:nowrap; flex-shrink:0; }
.floor-layout-text { font-size:12px; color:var(--fg); line-height:1.5; }
.floor-desc { display:flex; flex-direction:column; gap:8px; }
.floor-rooms { display:flex; flex-direction:column; gap:2px; }
.floor-room-item { display:flex; align-items:center; gap:10px; padding:6px 10px; border-radius:4px; transition:background 0.1s; }
.floor-room-item:hover { background:var(--bg); }
.floor-room-num { font-size:12px; font-weight:700; color:var(--primary); background:var(--primary-pale); padding:2px 8px; border-radius:4px; min-width:42px; text-align:center; flex-shrink:0; }
.floor-room-name { font-size:13px; color:var(--fg); line-height:1.4; }
.floor-desc-item { background:var(--bg); padding:10px 14px; border-radius:6px; font-size:13px; color:var(--fg); line-height:1.6; border-left:3px solid var(--primary); }
.schedule-wrap { max-width:420px; margin:0 auto; display:flex; flex-direction:column; gap:2px; }
.sched-row { display:flex; align-items:center; padding:10px 20px; border-radius:8px; transition:background 0.15s; }
.sched-row:not(.sched-break):hover { background:rgba(27,67,50,0.06); }
.sched-period { flex:1; font-weight:600; font-size:14px; color:var(--primary); }
.sched-time { font-size:13px; color:var(--fg-muted); font-variant-numeric:tabular-nums; }
.sched-break { justify-content:center; padding:8px 20px; }
.sched-break-label { font-size:12px; font-weight:600; color:var(--primary); background:var(--primary-pale); padding:6px 16px; border-radius:20px; }
.contact-grid { display:flex; flex-direction:column; gap:6px; }
.contact-item { display:flex; gap:12px; padding:8px 12px; background:var(--bg); border-radius:var(--radius-sm); align-items:center; }
.contact-item .clabel { font-size:11px; color:var(--fg-muted); flex-shrink:0; min-width:80px; }
.contact-item .cvalue { font-size:13px; color:var(--primary); font-weight:500; }
.surroundings-list { display:flex; flex-direction:column; gap:8px; }
.surrounding-card { display:flex; gap:12px; align-items:center; background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:12px 16px; transition:border-color 0.2s; }
.surrounding-card:hover { border-color:var(--primary-light); }
.surrounding-dir { width:36px; height:36px; border-radius:50%; background:var(--primary); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0; }
.surrounding-info { flex:1; }
.surrounding-name { font-weight:700; font-size:14px; color:var(--primary); margin-bottom:2px; }
.surrounding-desc { font-size:12px; color:var(--fg-muted); }
.content-panel-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:21px; flex-shrink:0; }

/* ====== 地图位置按钮 ====== */
.map-pin-btn { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; border:1.5px solid var(--border); background:var(--card); font-size:12px; font-weight:600; color:var(--primary); cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; flex-shrink:0; }
.map-pin-btn:hover { background:var(--primary); color:#fff; border-color:var(--primary); box-shadow:0 2px 8px rgba(27,67,50,0.25); }

/* ====== 地图预览弹窗 ====== */
.map-preview-backdrop { position:fixed; inset:0; z-index:250; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.45); backdrop-filter:blur(4px); animation:fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
.map-preview-dialog { background:var(--card); border-radius:var(--radius); box-shadow:0 16px 48px rgba(0,0,0,0.25); width:min(90vw, 620px); max-height:85vh; overflow:hidden; animation:scaleIn 0.25s ease; }
@keyframes scaleIn { from { opacity:0; transform:scale(0.92) translateY(12px); } to { opacity:1; transform:scale(1) translateY(0); } }
.map-preview-header { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--border); }
.map-preview-title { font-weight:700; font-size:15px; color:var(--primary); display:flex; align-items:center; }
.map-preview-close { width:32px; height:32px; border-radius:8px; border:none; background:var(--bg); color:var(--fg-muted); cursor:pointer; font-size:15px; display:flex; align-items:center; justify-content:center; transition:all 0.2s; }
.map-preview-close:hover { background:var(--primary); color:#fff; }
.map-preview-body { position:relative; padding:12px; }
.map-preview-img { width:100%; display:block; border-radius:8px; border:1px solid var(--border); }
.map-preview-marker { position:absolute; transform:translate(-50%,-50%); z-index:2; pointer-events:none; }
.map-preview-dot { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; color:#fff; box-shadow:0 2px 8px rgba(0,0,0,0.25); border:3px solid #fff; }
.map-preview-label { position:absolute; top:26px; left:50%; transform:translateX(-50%); font-size:11px; font-weight:700; color:var(--primary); white-space:nowrap; background:rgba(255,255,255,0.95); padding:3px 8px; border-radius:5px; box-shadow:0 1px 4px rgba(0,0,0,0.12); }
.map-preview-ripple { position:absolute; top:12px; left:12px; width:20px; height:20px; border-radius:50%; border:3px solid var(--accent); animation:ripplePulse 1.8s ease-out infinite; transform:translate(-50%,-50%); }
@keyframes ripplePulse { 0% { transform:translate(-50%,-50%) scale(1); opacity:0.7; } 100% { transform:translate(-50%,-50%) scale(3.2); opacity:0; } }

/* ====== 开放时间 时间线 ====== */
.timetable-view { display:flex; flex-direction:column; gap:20px; }
.tt-group { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); overflow:hidden; }
.tt-days { font-weight:700; font-size:13px; color:#fff; background:var(--primary); padding:10px 16px; display:flex; align-items:center; gap:6px; }
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
</style>
