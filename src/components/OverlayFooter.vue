<template>
  <div class="overlay-footer">
    <div class="of-inner">
      <span class="of-brand">北京物资学院 · 校园指南</span>
      <div class="of-links">
        <a @click="$emit('go', 'browse')">设施速查</a>
        <a @click="$emit('go', 'dcampus')">数字校园</a>
        <a @click="$emit('go', 'about')">关于</a>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['go'])
</script>

<style scoped>
.overlay-footer { position:fixed; bottom:0; left:0; right:0; z-index:196; background:var(--primary); padding:14px 20px; }
.of-inner { max-width:800px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; gap:16px; }
.of-brand { font-family:'Noto Serif SC',serif; font-weight:700; font-size:13px; color:rgba(255,255,255,0.7); white-space:nowrap; }
.of-links { display:flex; gap:4px; }
.of-links a { padding:6px 12px; border-radius:7px; color:rgba(255,255,255,0.55); font-size:12px; font-weight:500; cursor:pointer; text-decoration:none; white-space:nowrap; transition:all 0.2s; }
.of-links a:hover { color:#fff; background:rgba(255,255,255,0.1); }
@media (max-width:500px) {
  .of-brand { font-size:11px; }
  .of-links a { padding:5px 8px; font-size:11px; }
}
</style>
