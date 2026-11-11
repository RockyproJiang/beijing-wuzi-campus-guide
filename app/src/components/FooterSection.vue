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
footer { position:relative; z-index:1; background:var(--primary); padding:30px 24px 20px; }
.footer-inner { max-width:1200px; margin:0 auto; display:flex; justify-content:space-between; gap:24px; }
.footer-left { max-width:360px; min-width:0; }
.footer-brand { font-family:'Noto Serif SC',serif; font-weight:900; font-size:18px; color:#fff; }
.footer-desc { font-size:12px; color:rgba(255,255,255,0.6); margin-top:4px; }
.footer-title { font-weight:700; font-size:13px; color:rgba(255,255,255,0.9); margin-bottom:8px; }
.footer-links { list-style:none; }
.footer-links li { margin-bottom:4px; }
.footer-links a { color:rgba(255,255,255,0.6); text-decoration:none; font-size:12px; cursor:pointer; }
.footer-links a:hover { color:var(--accent); }
.footer-bottom { font-size:11px; color:rgba(255,255,255,0.45); margin-top:20px; padding-top:16px; border-top:1px solid rgba(255,255,255,0.12); text-align:center; }
</style>
