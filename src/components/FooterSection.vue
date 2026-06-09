<template>
  <footer>
    <div class="footer-inner">
      <div>
        <div class="footer-brand">北京物资学院 · 校园指南</div>
        <p class="footer-desc">帮助你快速了解北京物资学院校园布局，随时查找教学楼、宿舍、食堂等设施信息。</p>
      </div>
      <div>
        <div class="footer-title">快速链接</div>
        <ul class="footer-links">
          <li><a @click="$emit('scroll-to-map')">校园地图</a></li>
          <li><a @click="$emit('open-browse')">设施速查</a></li>
          <li><a @click="$emit('open-dcampus')">数字校园</a></li>
          <li><a @click="$emit('open-about')">关于</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">北京物资学院校园指南 &copy; 2026 — 数据来源：通过实地考察记录 | 邮编：101149</div>
  </footer>
</template>

<script setup>
defineEmits(['scroll-to-map', 'open-browse', 'open-dcampus', 'open-about'])
</script>

<style scoped>
footer { position:relative; z-index:1; background:var(--primary); padding:clamp(20px,4vw,30px) clamp(10px,2.5vw,20px) 20px; }
.footer-inner { max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; gap:clamp(4px,2vw,24px); flex-wrap:nowrap; align-items:flex-start; }
.footer-brand { font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(7px,2vw,16px); color:#fff; white-space:nowrap; }
.footer-desc { font-size:clamp(6px,1.2vw,11px); color:rgba(255,255,255,0.6); margin-top:2px; line-height:1.3; max-width:260px; }
.footer-title { font-weight:700; font-size:clamp(7px,1.6vw,12px); color:rgba(255,255,255,0.9); margin-bottom:3px; white-space:nowrap; }
.footer-links { list-style:none; display:flex; gap:clamp(3px,1.5vw,16px); flex-wrap:nowrap; }
.footer-links li { margin-bottom:0; }
.footer-links a { color:rgba(255,255,255,0.6); text-decoration:none; font-size:clamp(6px,1.3vw,11px); cursor:pointer; white-space:nowrap; }
.footer-links a:hover { color:var(--accent); }
.footer-bottom { font-size:clamp(8px,1.2vw,10px); color:rgba(255,255,255,0.45); margin-top:20px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.12); text-align:center; }
</style>
