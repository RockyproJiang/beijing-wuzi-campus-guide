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
.tips-box { background:var(--card); border:1px solid var(--border); border-radius:var(--radius-sm); padding:16px 18px; border-left:4px solid var(--primary); }
.tips-box h4 { font-size:13px; color:var(--primary); margin-bottom:8px; font-weight:700; }
.tips-box ul { list-style:none; }
.tips-box li { font-size:12px; color:var(--fg); padding:3px 0; }
.tips-box li::before { content:'\f058'; font-family:'Font Awesome 6 Free'; font-weight:900; margin-right:6px; }
</style>
