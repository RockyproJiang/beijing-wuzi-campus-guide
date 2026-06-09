<template>
  <div class="overlay-nav">
    <button :class="{ active: current === 'browse' }" @click="$emit('go', 'browse')">
      <i class="fa-solid fa-magnifying-glass"></i>
      <span>设施速查</span>
    </button>
    <button :class="{ active: current === 'dcampus' }" @click="$emit('go', 'dcampus')">
      <i class="fa-solid fa-graduation-cap"></i>
      <span>数字校园</span>
    </button>
    <button :class="{ active: current === 'about' }" @click="$emit('go', 'about')">
      <i class="fa-solid fa-circle-info"></i>
      <span>关于</span>
    </button>
  </div>
</template>

<script setup>
defineProps({ current: String })
defineEmits(['go'])
</script>

<style scoped>
.overlay-nav { position:fixed; bottom:16px; left:50%; transform:translateX(-50%); z-index:220; display:flex; gap:6px; padding:6px 8px; background:rgba(27,67,50,0.92); backdrop-filter:blur(12px); border-radius:28px; box-shadow:0 4px 24px rgba(0,0,0,0.2); }
.overlay-nav button { display:flex; align-items:center; gap:5px; padding:8px 14px; border:none; border-radius:22px; background:transparent; color:rgba(255,255,255,0.65); font-size:12px; font-weight:500; font-family:inherit; cursor:pointer; transition:all 0.25s; white-space:nowrap; }
.overlay-nav button:hover { color:#fff; background:rgba(255,255,255,0.1); }
.overlay-nav button.active { color:var(--primary); background:#fff; font-weight:700; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
.overlay-nav button i { font-size:13px; }
@media (max-width:400px) {
  .overlay-nav button span { display:none; }
  .overlay-nav button { padding:10px; }
}
</style>
