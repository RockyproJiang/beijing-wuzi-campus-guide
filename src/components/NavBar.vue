﻿<template>
  <nav class="navbar" :class="{ scrolled }">
    <div class="nav-inner">
      <a class="nav-brand" @click="$emit('scroll-to-top')">
        <div class="icon-wrap"><i class="fa-solid fa-graduation-cap"></i></div>
        北京物资学院
      </a>
      <ul class="nav-links" ref="navLinksRef">
        <div class="nav-indicator" :style="indicatorStyle"></div>
        <li><a ref="navHome" href="#" :class="{ active: activeSection === 'home' }" @click.prevent="$emit('scroll-to-top')">首页</a></li>
        <li><a ref="navMap" href="#" :class="{ active: activeSection === 'map' }" @click.prevent="$emit('scroll-to-map')">地图</a></li>
        <li><a ref="navBrowse" href="#" :class="{ active: activeSection === 'browse' }" @click.prevent="$emit('open-browse')">设施速查</a></li>
        <li><button ref="navDcampus" :class="{ active: activeSection === 'dcampus' }" @click="$emit('open-dcampus')">数字校园</button></li>
        <li><a ref="navAbout" href="#" :class="{ active: activeSection === 'about' }" @click.prevent="$emit('open-about')">关于</a></li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  scrolled: Boolean,
  activeSection: String
})
defineEmits(['scroll-to-top', 'scroll-to-map', 'open-browse', 'open-dcampus', 'open-about'])

const navLinksRef = ref(null)
const navHome = ref(null)
const navMap = ref(null)
const navBrowse = ref(null)
const navDcampus = ref(null)
const navAbout = ref(null)

const indicatorStyle = ref({ left: '0px', top: '0px', width: '0px', height: '0px', opacity: '0' })

const sectionRefMap = {
  home: navHome,
  map: navMap,
  browse: navBrowse,
  dcampus: navDcampus,
  about: navAbout
}

function updateIndicator() {
  const key = props.activeSection
  const el = sectionRefMap[key]?.value
  const parent = navLinksRef.value
  if (!el || !parent) {
    indicatorStyle.value = { left: '0px', top: '0px', width: '0px', height: '0px', opacity: '0' }
    return
  }
  const parentRect = parent.getBoundingClientRect()
  const elRect = el.getBoundingClientRect()
  indicatorStyle.value = {
    left: (elRect.left - parentRect.left) + 'px',
    top: (elRect.top - parentRect.top) + 'px',
    width: elRect.width + 'px',
    height: elRect.height + 'px',
    opacity: '1'
  }
}

watch(() => props.activeSection, () => nextTick(updateIndicator))

onMounted(() => {
  // Multiple attempts to catch slow mobile rendering
  nextTick(updateIndicator)
  setTimeout(updateIndicator, 80)
  setTimeout(updateIndicator, 300)
})

// Also update on window resize
if (typeof window !== 'undefined') {
  window.addEventListener('resize', updateIndicator)
}
</script>

<style scoped>
.navbar { position:fixed; top:0; left:0; right:0; z-index:200; background:var(--primary); border-bottom:1px solid rgba(255,255,255,0.1); transition:box-shadow 0.3s; }
.navbar.scrolled { box-shadow:0 4px 30px rgba(0,0,0,0.25); }
.nav-inner { max-width:1400px; margin:0 auto; padding:0 clamp(6px,2.5vw,20px); height:56px; display:flex; align-items:center; justify-content:space-between; }

.nav-brand { display:flex; align-items:center; gap:clamp(2px,0.8vw,8px); font-family:'Noto Serif SC',serif; font-weight:900; font-size:clamp(9px,2.8vw,18px); color:#fff; text-decoration:none; cursor:pointer; white-space:nowrap; }
.nav-brand .icon-wrap { width:clamp(22px,5vw,36px); height:clamp(22px,5vw,36px); background:rgba(255,255,255,0.12); color:#fff; border-radius:clamp(5px,1.5vw,10px); display:flex; align-items:center; justify-content:center; font-size:clamp(10px,2.5vw,17px); flex-shrink:0; }

.nav-links { position:relative; display:flex; align-items:center; gap:clamp(0px,0.3vw,4px); list-style:none; }

/* Sliding indicator pill */
.nav-indicator { position:absolute; border-radius:7px; background:rgba(255,255,255,0.9); transition:left 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), top 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), width 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), height 0.35s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.2s ease; pointer-events:none; z-index:0; }

.nav-links a, .nav-links button { position:relative; z-index:1; padding:clamp(2px,0.5vw,6px) clamp(2px,0.7vw,10px); border-radius:7px; text-decoration:none; color:rgba(255,255,255,0.75); font-size:clamp(6px,1.3vw,11px); font-weight:500; cursor:pointer; border:none; background:none; font-family:inherit; transition:color 0.25s; white-space:nowrap; display:inline-flex; align-items:center; line-height:1.4; }
.nav-links a:hover, .nav-links button:hover { color:#fff; }
.nav-links a.active, .nav-links button.active { color:var(--primary); font-weight:700; }
</style>
