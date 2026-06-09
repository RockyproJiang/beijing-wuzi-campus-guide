<template>
  <div class="sidebar">
    <div class="sidebar-cats">
      <button
        v-for="cat in categories" :key="cat.id"
        class="sidebar-cat-btn"
        :class="{ active: activeCategoryId === cat.id }"
        @click="$emit('select-category', cat.id)"
      >
        <i :class="cat.icon" style="margin-right:4px;"></i>{{ cat.name }}
      </button>
    </div>
    <div class="sidebar-buildings">
      <div
        v-for="bldg in activeCategory.buildings" :key="bldg.id"
        class="sidebar-bldg-item"
        :class="{ active: selectedBldgId === bldg.id }"
        @click="$emit('select-building', bldg.id)"
      >
        <div class="sidebar-bldg-icon" :style="{ background: bldg.bgColor, color: bldg.color }">
          <i :class="bldg.icon"></i>
        </div>
        <div class="sidebar-bldg-info">
          <div class="sidebar-bldg-name">{{ bldg.name }}</div>
          <div class="sidebar-bldg-sub">{{ bldg.sub }}</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color:var(--fg-muted);font-size:10px;"></i>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  categories: Array,
  activeCategoryId: String,
  activeCategory: Object,
  selectedBldgId: String
})
defineEmits(['select-category', 'select-building'])
</script>

<style scoped>
.sidebar { width:var(--sidebar-w); flex-shrink:0; background:var(--card); border:1px solid var(--border); border-radius:var(--radius); overflow:hidden; align-self:flex-start; position:sticky; top:80px; max-height:calc(100vh - 100px); display:flex; flex-direction:column; }
@media (max-width:900px) { .sidebar { width:100%; position:static; max-height:none; } }
.sidebar-cats { display:flex; flex-wrap:wrap; gap:4px; padding:12px; border-bottom:1px solid var(--bg-deep); }
.sidebar-cat-btn { padding:6px 12px; border-radius:8px; border:none; background:var(--bg); font-size:12px; font-weight:500; color:var(--fg-muted); cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
.sidebar-cat-btn:hover { background:var(--primary-pale); color:var(--primary); }
.sidebar-cat-btn.active { background:var(--primary); color:#fff; }
.sidebar-buildings { flex:1; overflow-y:auto; padding:8px; }
.sidebar-bldg-item { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:var(--radius-sm); cursor:pointer; transition:all 0.2s; border:2px solid transparent; margin-bottom:4px; }
.sidebar-bldg-item:hover { background:var(--bg); border-color:var(--border); }
.sidebar-bldg-item.active { background:var(--primary-pale); border-color:var(--primary-light); }
.sidebar-bldg-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; }
.sidebar-bldg-info { flex:1; min-width:0; }
.sidebar-bldg-name { font-weight:600; font-size:13px; color:var(--fg); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.sidebar-bldg-sub { font-size:11px; color:var(--fg-muted); }
</style>
