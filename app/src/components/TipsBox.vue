<template>
  <div class="tips-box" style="margin-top:20px;">
    <h4><i class="fa-solid fa-lightbulb"></i> 温馨提示</h4>
    <ul>
      <li v-for="t in tips" :key="t">{{ t }}</li>
    </ul>
  </div>
</template>

<script setup>
defineProps({ tips: Array })
</script>

<style scoped>
.tips-box { background:rgba(255,253,248,0.78); border:1px solid rgba(27,67,50,0.1); border-radius:var(--radius-sm); padding:16px 18px; border-left:4px solid var(--primary); backdrop-filter:blur(14px); box-shadow:0 12px 30px rgba(27,67,50,0.07); }
.tips-box h4 { font-size:13px; color:var(--primary); margin-bottom:8px; font-weight:700; }
.tips-box ul { list-style:none; }
.tips-box li { font-size:12px; color:var(--fg); padding:3px 0; }
.tips-box li::before { content:'\f058'; font-family:'Font Awesome 6 Free'; font-weight:900; margin-right:6px; }
</style>
