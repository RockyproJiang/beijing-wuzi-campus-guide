<template>
  <div class="cal-overlay" @keydown.escape="$emit('close')" @click.self="$emit('close')">
    <div class="cal-overlay-header">
      <button class="cal-back-btn" @click="$emit('close')" title="返回">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="content-panel-icon" style="background:var(--primary-pale);color:var(--primary);">
        <i class="fa-solid fa-calendar-days"></i>
      </div>
      <div>
        <div class="cal-overlay-title">校历</div>
        <div class="cal-overlay-sub">{{ calendar.title }}</div>
      </div>
    </div>
    <div class="cal-overlay-body" @click.self="$emit('close')">
      <div class="cal-hero">
        <div class="cal-year-badge">{{ calendar.title }}</div>
      </div>
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
  </div>
</template>

<script setup>
defineProps({ calendar: Object })
defineEmits(['close'])
</script>

<style scoped>
.cal-overlay { position:fixed; inset:0; z-index:195; display:flex; flex-direction:column; background:var(--bg); overflow-y:auto; padding-top:56px; }
.cal-overlay-header { display:flex; align-items:center; gap:12px; padding:12px 24px; background:rgba(255,255,255,0.95); backdrop-filter:blur(12px); border-bottom:1px solid var(--border); flex-shrink:0; }

.cal-overlay-title { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(10px,2.5vw,18px); color:var(--primary); }
.cal-overlay-sub { font-size:12px; color:var(--fg-muted); }
.cal-back-btn { width:38px; height:38px; border-radius:10px; border:1.5px solid var(--border); background:var(--card); cursor:pointer; font-size:16px; color:var(--primary); display:flex; align-items:center; justify-content:center; transition:all 0.2s; flex-shrink:0; }
.cal-back-btn:hover { background:var(--primary); color:#fff; border-color:var(--primary); }
.cal-overlay-body { padding:24px; max-width:700px; margin:0 auto; width:100%; }
.content-panel-icon { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:21px; flex-shrink:0; }

.cal-hero { text-align:center; padding:20px 0 30px; }
.cal-year-badge { display:inline-block; background:var(--primary); color:#fff; font-weight:700; font-size:14px; padding:8px 24px; border-radius:20px; }

.cal-timeline { position:relative; padding-left:28px; border-left:2px solid var(--primary-pale); margin-left:10px; }
.cal-event { position:relative; margin-bottom:16px; }
.cal-event-dot { position:absolute; left:-35px; top:8px; width:12px; height:12px; border-radius:50%; background:var(--primary); border:2px solid #fff; box-shadow:0 0 0 2px var(--primary); }
.cal-event-content { background:var(--card); border:1px solid var(--bg-deep); border-radius:var(--radius-sm); padding:14px 18px; transition:border-color 0.2s; }
.cal-event-content:hover { border-color:var(--primary-light); }
.cal-event-name { font-weight:700; font-size:clamp(10px,2vw,13px); color:var(--primary); margin-bottom:4px; }
.cal-event-date { font-size:clamp(9px,1.6vw,11px); color:var(--fg-muted); }
</style>
