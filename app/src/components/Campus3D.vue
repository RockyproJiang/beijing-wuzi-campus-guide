<template>
  <div
    ref="root"
    class="campus3d"
    :class="{ 'is-map': mapMode, 'is-ready': ready, 'is-hero': !mapMode, 'is-walk': walkMode }"
  >
    <div ref="host" class="c3d-host"></div>

    <transition name="c3d-fade">
      <div v-if="!ready" class="c3d-loading">
        <img class="c3d-poster" :src="POSTER_URL" alt="" draggable="false" />
        <div class="c3d-loading-card">
          <div v-if="!loadError" class="c3d-spinner"></div>
          <div class="c3d-loading-title">{{ loadError ? '3D 场景加载失败' : '正在加载校园模型' }}</div>
          <div v-if="!loadError" class="c3d-loading-sub">{{ progress }}% · 约 2.3 MB</div>
          <div v-else class="c3d-loading-sub">{{ loadError }}</div>
          <button v-if="loadError" class="c3d-retry" @click="retry">重新加载</button>
        </div>
      </div>
    </transition>

    <div v-show="label.show" class="c3d-label" :style="labelStyle">
      <div class="c3d-label-name">{{ label.name }}</div>
      <div v-if="label.sub" class="c3d-label-sub">{{ label.sub }}</div>
    </div>

    <!-- 准星：可以按住拖动到任意位置；只作提示，拾取仍按鼠标/手指落点 -->
    <div
      v-if="ready && mapMode && aimMode && !walkMode"
      class="c3d-crosshair"
      :class="{ dragging: aimDragging }"
      :style="{ left: aimPos.x + 'px', top: aimPos.y + 'px' }"
      role="button"
      aria-label="准星，可拖动"
      @pointerdown.stop.prevent="startAimDrag"
    >
      <span class="c3d-crosshair-ring"></span>
      <span class="c3d-crosshair-dot"></span>
      <span class="c3d-crosshair-grip"><i class="fa-solid fa-up-down-left-right"></i></span>
    </div>

    <!-- 右侧工具卡片：展开时左侧外沿挂一枚胶囊，收起时卡片向右平移、只留下这枚胶囊 -->
    <div v-if="ready" class="c3d-dock" :class="{ open: dockOpen, 'is-hero': !mapMode, 'is-walk': walkMode }">
      <button
        type="button"
        class="c3d-dock-handle"
        :class="{ collapsed: !dockOpen }"
        :title="dockOpen ? '收起工具' : '展开工具'"
        :aria-expanded="dockOpen"
        @click="dockOpen = !dockOpen"
      >
        <i class="fa-solid" :class="dockOpen ? 'fa-chevron-right' : 'fa-chevron-left'"></i>
      </button>

      <div class="c3d-dock-body" :aria-hidden="!dockOpen">
        <div class="c3d-dock-title">地图工具</div>

        <!-- 三个模式：图标在上、文字在下，并排成一条，像工具栏而不是表单 -->
        <div class="c3d-dock-seg">
          <button
            v-if="mapMode"
            type="button"
            class="c3d-seg-btn"
            :class="{ active: walkMode }"
            :title="walkMode ? '回到上帝视角' : '第一人称：从大门走进去'"
            @click="toggleWalkMode"
          >
            <i class="fa-solid" :class="walkMode ? 'fa-mountain-sun' : 'fa-person-walking'"></i>
            <span>{{ walkMode ? '上帝' : '第一人称' }}</span>
          </button>
          <button
            v-if="aimAvailable && mapMode && !walkMode"
            type="button"
            class="c3d-seg-btn"
            :class="{ active: aimMode }"
            :title="aimMode ? '关闭准星' : '打开准星（可拖动）'"
            @click="toggleAimMode"
          >
            <i class="fa-solid fa-crosshairs"></i>
            <span>准星</span>
          </button>
          <button
            v-if="mapMode && !walkMode"
            type="button"
            class="c3d-seg-btn"
            :class="{ active: panOnly }"
            :title="panOnly ? '退出平移模式' : '平移模式：只拖动地图'"
            @click="togglePanMode"
          >
            <i class="fa-solid fa-hand"></i>
            <span>平移</span>
          </button>
        </div>

        <div v-if="!walkMode" class="c3d-dock-row">
          <button type="button" title="放大" :disabled="panOnly" @click="zoomBy(1.25)">
            <i class="fa-solid fa-plus"></i>
          </button>
          <button type="button" title="缩小" :disabled="panOnly" @click="zoomBy(0.8)">
            <i class="fa-solid fa-minus"></i>
          </button>
          <button type="button" title="重置视角" :disabled="panOnly" @click="resetView">
            <i class="fa-solid fa-rotate-left"></i>
          </button>
        </div>

        <!-- 第一人称：放大/缩小/重置没用，改成一个移动速度滑块 -->
        <div v-else class="c3d-speed">
          <div class="c3d-speed-head">
            <span><i class="fa-solid fa-gauge-high"></i> 移动速度</span>
            <em>{{ walkSpeedMul.toFixed(1) }}×</em>
          </div>
          <input
            v-model.number="walkSpeedMul"
            class="c3d-speed-range"
            type="range"
            min="0.5"
            max="4"
            step="0.5"
            aria-label="第一人称移动速度"
          />
          <div class="c3d-speed-ticks"><span>慢</span><span>快</span></div>
        </div>
      </div>
    </div>

    <!-- 第一人称：左上角退出、左下移动键、右下视角键 -->
    <template v-if="ready && walkMode">
      <button type="button" class="c3d-walk-exit" @click="exitWalkMode">
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
        <span>退出第一视角</span>
      </button>

      <!-- 移动：圆角菱形方向盘（蒙一层透明底板，点偏了也不会拖到地图） -->
      <div class="c3d-move-zone" @pointerdown.prevent.stop @pointermove.prevent.stop>
        <div class="c3d-move-label">移动</div>
        <div class="c3d-dpad">
          <span class="c3d-dpad-glow"></span>
          <button
            type="button" class="dp-btn dp-up"
            @pointerdown.prevent="holdKey('w', true)" @pointerup.prevent="holdKey('w', false)"
            @pointerleave="holdKey('w', false)" @pointercancel="holdKey('w', false)"
          ><i class="fa-solid fa-caret-up"></i></button>
          <button
            type="button" class="dp-btn dp-left"
            @pointerdown.prevent="holdKey('a', true)" @pointerup.prevent="holdKey('a', false)"
            @pointerleave="holdKey('a', false)" @pointercancel="holdKey('a', false)"
          ><i class="fa-solid fa-caret-left"></i></button>
          <button
            type="button" class="dp-btn dp-down"
            @pointerdown.prevent="holdKey('s', true)" @pointerup.prevent="holdKey('s', false)"
            @pointerleave="holdKey('s', false)" @pointercancel="holdKey('s', false)"
          ><i class="fa-solid fa-caret-down"></i></button>
          <button
            type="button" class="dp-btn dp-right"
            @pointerdown.prevent="holdKey('d', true)" @pointerup.prevent="holdKey('d', false)"
            @pointerleave="holdKey('d', false)" @pointercancel="holdKey('d', false)"
          ><i class="fa-solid fa-caret-right"></i></button>
        </div>
      </div>

      <!-- 视角：左右两个方向键 -->
      <div class="c3d-look-zone" @pointerdown.prevent.stop @pointermove.prevent.stop>
        <div class="c3d-look-label">视角</div>
        <div class="c3d-look-btns">
          <button
            type="button" class="lk-btn"
            @pointerdown.prevent="holdKey('lookL', true)" @pointerup.prevent="holdKey('lookL', false)"
            @pointerleave="holdKey('lookL', false)" @pointercancel="holdKey('lookL', false)"
          ><i class="fa-solid fa-rotate-left"></i></button>
          <button
            type="button" class="lk-btn"
            @pointerdown.prevent="holdKey('lookR', true)" @pointerup.prevent="holdKey('lookR', false)"
            @pointerleave="holdKey('lookR', false)" @pointercancel="holdKey('lookR', false)"
          ><i class="fa-solid fa-rotate-right"></i></button>
        </div>
      </div>

      <div class="c3d-walk-tip">{{ isNarrow ? '左侧移动 · 右侧转视角' : 'WASD 移动 · J/K 转视角 · E 工具 · Esc 退出' }}</div>
    </template>

    <div v-if="ready && mapMode && !walkMode" class="c3d-hint">
      <i class="fa-solid" :class="panOnly ? 'fa-hand' : aimMode ? 'fa-crosshairs' : 'fa-hand-pointer'"></i>
      {{ panOnly
        ? '平移模式 · 拖动平移地图'
        : aimMode
          ? '准星模式 · 把准星拖到建筑上 · 点一下查看'
          : '拖动旋转 · 双指收缩缩放与平移' }}
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { applySimpleGrass } from '../utils/simpleGrass.js'
import { MODEL_URL, POSTER_URL } from '../modelVersion.js'
import { patchRect } from '../utils/surfacePatch.js'

const props = defineProps({
  buildings: { type: Array, default: () => [] },
  mapMode: { type: Boolean, default: false },
  filterCategory: { type: String, default: '' },
  /** 当前筛选分类的主题色，射线光柱用它 */
  filterColor: { type: String, default: '#1B4332' },
  selectedId: { type: String, default: '' },
})

const emit = defineEmits(['select', 'background', 'ready', 'progress', 'error', 'walk'])

const root = ref(null)
const host = ref(null)
const ready = ref(false)
const progress = ref(0)
const loadError = ref('')
const label = reactive({ show: false, name: '', sub: '', x: 0, y: 0 })

const labelStyle = computed(() => ({
  left: `${label.x}px`,
  top: `${label.y}px`,
}))

const byId = computed(() => {
  const map = new Map()
  for (const b of props.buildings) map.set(b.id, b)
  return map
})

const ACCENT = new THREE.Color('#D4A853')
const BLACK = new THREE.Color(0x000000)
const prefersReduced = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
  : false
const isCoarse = typeof window !== 'undefined' && window.matchMedia
  ? window.matchMedia('(pointer: coarse)').matches
  : false
const isNarrow = typeof window !== 'undefined' ? window.innerWidth <= 760 : false

let renderer
let scene
let camera
let controls
let model
let clock
let raf = 0
let resizeObserver
let intersectionObserver
let visible = true
let destroyed = false

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const pickMeshes = []
// 第一人称碰撞用：只有真正的立体物（楼、墙、树、杆…），不含草地/道路/广场这些薄面
const walkBlockers = []
const pinMeshes = []
const pinById = new Map()
const spatialMeshes = []
const spatialOutlines = []
const buildingBoxes = new Map()
let pinGroup = null
let spatialGroup = null
let locateGlow = null
let hoverSpatialId = ''
let targetPoint = new THREE.Vector3(0, 0, 0)
let modelBox = new THREE.Box3()

const hoverIds = new Set()
let hoverDirty = false
let hoverBuildingId = ''
let lastHoverAt = 0
let userInteracted = false
let pointerDown = null
let activePointers = new Set()
let multiTouch = false
let lastClient = { x: 0, y: 0 }

let fly = null
let focusLabel = null
let labelTimer = 0

const mode = reactive({ entering: false })
const panOnly = ref(false)
const aimMode = ref(false)
const aimAvailable = ref(false)
const dockOpen = ref(false)
// 首次进入地图自动展开一次，之后由用户自己开关
let dockAutoOpened = false
const walkMode = ref(false)

// 准星位置：可以拖动，屏幕坐标（px）。默认居中。
const aimPos = reactive({ x: 0, y: 0 })
const aimDragging = ref(false)
let aimDrag = null

// 校园轮廓约 ±353；允许平移目标到边界外一点点，南门/围栏等边缘对象才不会被截断。
const TARGET_LIMIT = 360

/* ------------------------------------------------------------------ */
/* 初始化                                                              */
/* ------------------------------------------------------------------ */

function initRenderer() {
  const box = host.value.getBoundingClientRect()
  renderer = new THREE.WebGLRenderer({
    antialias: !isCoarse,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.4 : 2))
  renderer.setSize(Math.max(1, box.width), Math.max(1, box.height), false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02
  // 手机上关掉实时阴影：PCFSoft 阴影每帧要多画一遍整个场景，是移动端最大的开销
  renderer.shadowMap.enabled = !isCoarse
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.touchAction = 'none'
  renderer.domElement.setAttribute('aria-label', '北京物资学院三维校园地图')
  renderer.domElement.addEventListener('webglcontextlost', onContextLost, false)
  host.value.appendChild(renderer.domElement)
}

function initScene() {
  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(0xf1ebdd, 1500, 3200)
  clock = new THREE.Clock()

  camera = new THREE.PerspectiveCamera(isNarrow ? 45 : 35, 1, 1, 6000)

  const hemi = new THREE.HemisphereLight(0xfff8ea, 0x76826f, 1.25)
  scene.add(hemi)

  const ambient = new THREE.AmbientLight(0xffffff, 0.18)
  scene.add(ambient)

  const sun = new THREE.DirectionalLight(0xfff2dc, 2.15)
  sun.position.set(460, 760, 360)
  sun.castShadow = true
  sun.shadow.mapSize.set(isCoarse ? 1024 : 2048, isCoarse ? 1024 : 2048)
  sun.shadow.camera.left = -620
  sun.shadow.camera.right = 620
  sun.shadow.camera.top = 620
  sun.shadow.camera.bottom = -620
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 2200
  sun.shadow.bias = -0.0006
  sun.shadow.normalBias = 0.6
  sun.shadow.radius = 2
  scene.add(sun)
  scene.add(sun.target)

  // 模型自带基座与绿化面，不再额外铺大地面，避免出现突兀的灰色方板。
  scene.fog = new THREE.Fog(0xf1ebdd, 1600, 3400)
  // 编辑后台用到的三维区域辅助（不是建筑），供外部脚本 / 控制台调试取用
  window.__C3D_HELPERS__ = {
    THREE,
    getScene: () => scene,
    getRaycaster: () => raycaster,
    getCamera: () => camera,
    getControls: () => controls,
    getModel: () => model,
    // 取一批模型对象的世界包围盒中心（给后台「按模型自动补 pin」用）
    objectCenters: (names) => {
      const out = {}
      for (const name of names || []) {
        const obj = model?.getObjectByName(name)
        if (!obj) continue
        const box = new THREE.Box3().setFromObject(obj)
        if (box.isEmpty()) continue
        const c = box.getCenter(new THREE.Vector3())
        out[name] = { x: c.x, y: c.y, z: c.z, minY: box.min.y, maxY: box.max.y }
      }
      return out
    },
    groundPointAt: (nx, ny) => {
      if (!raycaster || !scene) return null
      pointer.set(nx * 0.5, ny * 0.5)
      raycaster.setFromCamera(pointer, camera)
      raycaster.far = Infinity
      const ground = scene.getObjectByName('__ground')
      const hits = ground ? raycaster.intersectObject(ground, false) : []
      if (!hits.length) return null
      const p = hits[0].point
      return { x: p.x, z: p.z }
    },
  }
}

function initControls() {
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.075
  controls.rotateSpeed = 0.55
  controls.zoomSpeed = 0.85
  controls.panSpeed = 0.7
  // 允许贴到任意建筑外墙（原来 230 只能停在外围），但不允许钻进室内
  controls.minDistance = isNarrow ? 14 : 10
  controls.maxDistance = isNarrow ? 3200 : 2200
  controls.minPolarAngle = THREE.MathUtils.degToRad(6)
  // 俯仰放到接近水平：能平视建筑立面
  controls.maxPolarAngle = THREE.MathUtils.degToRad(89)
  controls.screenSpacePanning = false
  controls.enableZoom = props.mapMode
  controls.autoRotate = false
  controls.target.copy(targetPoint)

  controls.addEventListener('start', () => {
    userInteracted = true
    controls.autoRotate = false
    fly = null
  })
}

function setOverviewCamera(distance = 1120, polarDeg = 56, azimuthDeg = 32) {
  const polar = THREE.MathUtils.degToRad(polarDeg)
  const azimuth = THREE.MathUtils.degToRad(azimuthDeg)
  const offset = new THREE.Vector3(
    Math.sin(polar) * Math.sin(azimuth),
    Math.cos(polar),
    Math.sin(polar) * Math.cos(azimuth)
  ).multiplyScalar(distance)
  camera.position.copy(targetPoint).add(offset)
  controls.target.copy(targetPoint)
  camera.lookAt(targetPoint)
  controls.update()
}

/* ------------------------------------------------------------------ */
/* 模型加载                                                            */
/* ------------------------------------------------------------------ */

function cloneMaterial(material) {
  const m = material.clone()
  m.userData = {
    baseOpacity: m.opacity,
    baseTransparent: m.transparent,
    baseDepthWrite: m.depthWrite,
    baseEmissive: m.emissive ? m.emissive.clone() : null,
    baseEmissiveIntensity: m.emissiveIntensity ?? 1,
    dimmed: false,
  }
  if (m.map) {
    m.map.anisotropy = renderer.capabilities.getMaxAnisotropy()
    m.map.needsUpdate = true
  }
  return m
}

function resolveBuildingIds(obj, objectMap) {
  let node = obj
  let guard = 0
  while (node && guard < 6) {
    const name = node.name || ''
    const direct = objectMap.get(name)
    if (direct && direct.length) return direct
    const base = name.replace(/_\d+$/, '')
    const byBase = objectMap.get(base)
    if (byBase && byBase.length) return byBase
    // Blender 里改过名的对象（如「楼26_南澡堂」）导出后节点名会退回网格名「楼26」，
    // 反向再兜一次：manifest 里以「节点名_」开头的条目也算命中。
    for (const [key, ids] of objectMap) {
      if (key.startsWith(base + '_') && ids.length) return ids
    }
    node = node.parent
    guard += 1
  }
  return null
}

function loadModel() {
  loadError.value = ''
  progress.value = 0
  const loader = new GLTFLoader()
  loader.load(
    MODEL_URL,
    (gltf) => {
      if (destroyed) return
      model = gltf.scene
      model.updateMatrixWorld(true)
      scene.add(model)
      applySimpleGrass(scene, model)

      const objectMap = new Map()
      for (const b of props.buildings) {
        for (const name of b.modelObjects || []) {
          if (!objectMap.has(name)) objectMap.set(name, [])
          objectMap.get(name).push(b.id)
        }
      }

      model.traverse((obj) => {
        if (!obj.isMesh) return
        // 草地/广场/道路/球场都是很大的扁平薄面。让它们接收阴影，
        // 但不参与投射，否则会在大面积地面上产生自阴影 acne，转动时表现为草坪闪烁。
        const shadowName = obj.name.replace(/_\d+$/, '')
        const isGrass = /^绿化/.test(shadowName)
        const isFlatGround = /^(绿化|广场|青蓝广场|车行道|人行道|铺装|道路|湖|校园轮廓|基座|篮球场|排球场|网球场)/.test(shadowName)
        obj.castShadow = !isFlatGround
        // 所有地面层（含草坪）统一接收阴影：草坪层若比铺装低几厘米，摄像机移动时
        // 阴影贴图会在两者之间来回切换，表现为「一块绿色在闪」。
        obj.receiveShadow = true
        // 厚薄面统一用 polygonOffset 往深处压一点，避免与上方铺装/广场共面 z-fighting
        if (isFlatGround) {
          const list = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of list) {
            if (!m) continue
            m.side = THREE.FrontSide
            m.depthWrite = true
          }
        }
        // 草坪再往后退、水面再往前推：两层只差几厘米，靠深度精度分不开，
        // 用更大的 polygonOffset 把「谁在上面」固定下来，相机怎么动都不闪。
        if (/^绿化/.test(shadowName) || obj.userData.grassDepth) {
          const list = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of list) {
            if (!m) continue
            m.side = THREE.DoubleSide
            m.depthWrite = true
            m.depthTest = true
          }
        } else if (/^湖/.test(shadowName) || obj.userData.lakeDepth) {
          const list = Array.isArray(obj.material) ? obj.material : [obj.material]
          for (const m of list) {
            if (!m) continue
            m.side = THREE.DoubleSide
            m.depthWrite = true
          }
        }
        // 第一人称挡墙：所有不是「薄地面」的实体都算障碍（楼、围墙、树、杆、拱门…）
        if (!isFlatGround) walkBlockers.push(obj)
        const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
        for (const m of mats) {
          for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap']) {
            if (m[key]?.isTexture) {
              m[key].anisotropy = renderer.capabilities.getMaxAnisotropy()
              m[key].needsUpdate = true
            }
          }
        }
        // glTF 会把一个多材质对象拆成 楼20_1 / 楼20_2 这样的子网格；
        // 多 primitive 的节点还会生成 Group，子网格名会带上 mesh 数据名的后缀
        // （例如 小建筑04 的子网格叫 小建筑04001），所以这里沿父级一路回溯。
        const ids = resolveBuildingIds(obj, objectMap)
        if (!ids || ids.length === 0) return
        obj.userData.buildingIds = ids
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material]
        const cloned = materials.map(cloneMaterial)
        obj.material = Array.isArray(obj.material) ? cloned : cloned[0]
        obj.userData.materials = cloned
        pickMeshes.push(obj)
        for (const id of ids) {
          if (!buildingBoxes.has(id)) buildingBoxes.set(id, new THREE.Box3())
          buildingBoxes.get(id).expandByObject(obj)
        }
      })

      modelBox = new THREE.Box3().setFromObject(model)
      targetPoint = modelBox.getCenter(new THREE.Vector3())
      targetPoint.y = 0
      targetPoint.z -= 45

      setOverviewCamera(isNarrow ? 1950 : 1120, isNarrow ? 52 : 56, 32)
      rebuildPins()
      rebuildSpatial()
      rebuildBeams()
      resize()
      applyAppearance()
      ready.value = true
      if (import.meta.env.DEV) {
        window.__CAMPUS3D__ = { scene, camera, renderer, model }
        window.__CAMPUS3D_DEBUG__ = { label, hoverIds, camera, controls, panOnly, getFocus: () => focusLabel }
      }
      emit('ready')
      startLoop()
      // 首页：先全景，再缓缓推近做特写并开始极慢自转
      if (!props.mapMode) setTimeout(() => startHeroSpin(), 260)
    },
    (event) => {
      if (!event) return
      if (event.total) {
        progress.value = Math.min(99, Math.round((event.loaded / event.total) * 100))
      } else if (event.loaded) {
        progress.value = Math.min(95, Math.round((event.loaded / 2300000) * 100))
      }
    },
    (error) => {
      console.error('[campus3d] 模型加载失败', error)
      loadError.value = '请检查网络或模型文件（campus.glb）是否完整'
      emit('error', loadError.value)
    }
  )
}

function retry() {
  loadError.value = ''
  if (model) {
    scene.remove(model)
    model = null
  }
  ready.value = false
  loadModel()
}

/* ------------------------------------------------------------------ */
/* 标注点（没有模型对象的建筑）                                         */
/* ------------------------------------------------------------------ */

function clearPins() {
  if (!pinGroup) return
  for (const child of [...pinGroup.children]) {
    child.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material.dispose()
      }
    })
    pinGroup.remove(child)
  }
  pinMeshes.length = 0
  pinById.clear()
}

/**
 * 柔和光斑贴图：中心亮、边缘完全透明，用来做「轮廓小光芒」。
 * 用 canvas 现画，避免额外资源请求。
 */
let glowTexture = null
function getGlowTexture() {
  if (glowTexture) return glowTexture
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,0.95)')
  g.addColorStop(0.28, 'rgba(255,255,255,0.55)')
  g.addColorStop(0.62, 'rgba(255,255,255,0.16)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  glowTexture = tex
  return tex
}

/**
 * 定位效果：让目标楼体本身缓慢「呼吸式发光」，不画地面光圈。
 * 做法：把该楼所有网格的材质 emissive 染成金绿色，按正弦曲线缓慢升落透明度式的亮度，
 * 结束时平滑回落，不会生硬闪断。
 */
const LOCATE_GLOW = new THREE.Color(0x8FD3A8)

function locateMeshesFor(id) {
  const out = []
  if (!id) return out
  for (const mesh of pickMeshes) {
    const ids = mesh.userData.buildingIds || []
    if (ids.includes(id)) out.push(mesh)
  }
  return out
}

/** 开始楼体自发光；无模型时退回 pin 光斑闪烁 */
function playLocateGlow(id, duration = 9000) {
  const meshes = locateMeshesFor(id)
  const now = performance.now()
  if (!meshes.length) {
    locateGlow = null
    return false
  }
  locateGlow = { id, meshes, startedAt: now, duration, last: -1 }
  updateLocateGlow(now)
  return true
}

function stopLocateGlow() {
  if (!locateGlow) return
  for (const mesh of locateGlow.meshes) {
    for (const m of mesh.userData.materials || []) {
      if (!m.emissive) continue
      m.emissive.copy(m.userData.baseEmissive || BLACK)
      m.emissiveIntensity = m.userData.baseEmissiveIntensity ?? 1
    }
  }
  locateGlow = null
}

function updateLocateGlow(now) {
  if (!locateGlow) return
  const elapsed = now - locateGlow.startedAt
  if (elapsed > locateGlow.duration) {
    stopLocateGlow()
    return
  }
  // 前 600ms 淡入，最后 1.6s 淡出
  const fadeIn = Math.min(1, elapsed / 600)
  const fadeOut = Math.min(1, Math.max(0, (locateGlow.duration - elapsed) / 1600))
  const env = fadeIn * fadeOut
  // 呼吸周期 3.2s，亮度在 0.35~1 之间
  const breathe = 0.5 + 0.5 * Math.sin((elapsed / 3200) * Math.PI * 2 - Math.PI / 2)
  const strength = (0.32 + 0.68 * breathe) * env
  for (const mesh of locateGlow.meshes) {
    const ids = mesh.userData.buildingIds || []
    const selected = props.selectedId && ids.includes(props.selectedId)
    for (const m of mesh.userData.materials || []) {
      // 无论原本有没有自发光，都临时染色，结束后按 base 还原
      if (!m.emissive) continue
      m.emissive.copy(LOCATE_GLOW)
      m.emissiveIntensity = (selected ? 0.62 : 0) + strength * 0.85
    }
  }
}

function rebuildPins() {
  if (!scene) return
  if (!pinGroup) {
    pinGroup = new THREE.Group()
    pinGroup.name = '__pins'
    scene.add(pinGroup)
  }
  clearPins()

  const glowTex = getGlowTexture()

  for (const b of props.buildings) {
    if (!b.pin || (b.modelObjects && b.modelObjects.length > 0)) continue
    const color = new THREE.Color(b.color || '#1B4332')
    const group = new THREE.Group()
    group.position.set(Number(b.pin.x) || 0, 0, Number(b.pin.z) || 0)

    // 只保留一个很轻的轮廓环 + 中心点：光斑和地面软盘已按要求去掉
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(4.4, 5.0, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 0.62

    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.9, 18),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
    dot.rotation.x = -Math.PI / 2
    dot.position.y = 0.66

    for (const mesh of [ring, dot]) {
      mesh.userData.isPin = true
      mesh.userData.buildingId = b.id
      pinMeshes.push(mesh)
    }

    group.add(ring, dot)
    group.userData.mainRing = ring
    group.userData.buildingId = b.id
    group.userData.baseScale = 1
    pinGroup.add(group)
    pinById.set(b.id, group)
  }
  void glowTex
  updatePinVisibility()
}

function updatePinVisibility() {
  if (!pinGroup) return
  pinGroup.visible = props.mapMode
  for (const [id, group] of pinById) {
    const b = byId.value.get(id)
    const selected = Boolean(props.selectedId && props.selectedId === id)
    const hovered = hoverIds.has(id)
    const match = !props.filterCategory || (b && b.categoryId === props.filterCategory)
    group.visible = props.mapMode && (match || selected)
    // 只留一个小圆点定位；悬浮/选中时才浮出一圈细环
    const scale = selected ? 1.7 : hovered ? 1.4 : 1
    group.scale.setScalar(scale)
    const ring = group.userData.mainRing
    if (ring?.material) {
      ring.material.color.set(selected ? '#D4A853' : '#ffffff')
      // 静态时不画圆环（用户嫌圈圈难看），只有悬浮/选中才浮出细白边
      ring.material.opacity = selected ? 0.95 : hovered ? 0.75 : 0
    }
  }
}

/* ------------------------------------------------------------------ */
/* 自定义 3D 区域 / 表面位置                                            */
/* ------------------------------------------------------------------ */

function clearSpatial() {
  if (!spatialGroup) return
  while (spatialGroup.children.length) {
    const child = spatialGroup.children[0]
    spatialGroup.remove(child)
    child.traverse?.((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material.dispose()
      }
    })
    if (child.geometry) child.geometry.dispose()
    if (child.material) child.material.dispose()
  }
  spatialMeshes.length = 0
  spatialOutlines.length = 0
}

function shapeFromPoints(points) {
  const shape = new THREE.Shape()
  points.forEach((p, i) => {
    const x = Number(p.x) || 0
    const y = -(Number(p.z) || 0)
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  })
  shape.closePath()
  return shape
}

function addSpatialMesh(mesh, meta, baseOpacity, hotOpacity) {
  mesh.userData.isSpatial = true
  mesh.userData.buildingId = meta.buildingId
  mesh.userData.spatialId = meta.spatialId
  mesh.userData.spatialName = meta.spatialName
  mesh.userData.spatialDesc = meta.spatialDesc
  mesh.userData.spatialKind = meta.spatialKind
  mesh.userData.baseOpacity = baseOpacity
  mesh.userData.hotOpacity = Number.isFinite(hotOpacity) ? hotOpacity : Math.min(1, baseOpacity + 0.28)
  spatialMeshes.push(mesh)
  spatialGroup.add(mesh)
  attachSpatialOutline(mesh, meta)
}

/**
 * 给区域 / 楼面贴片挂一条轮廓线：平时完全透明，鼠标悬浮或该建筑被选中时
 * 沿边界亮起金色高光，让「点到了哪里」一目了然。
 */
const outlineColor = new THREE.Color(0xE8B44A)
function attachSpatialOutline(mesh, meta) {
  let edgeGeo
  try {
    edgeGeo = new THREE.EdgesGeometry(mesh.geometry, 1)
  } catch {
    return
  }
  if (!edgeGeo.attributes.position || edgeGeo.attributes.position.count < 2) {
    edgeGeo.dispose()
    return
  }
  const line = new THREE.LineSegments(
    edgeGeo,
    new THREE.LineBasicMaterial({
      color: outlineColor.clone(),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
  )
  line.position.copy(mesh.position)
  line.quaternion.copy(mesh.quaternion)
  line.scale.copy(mesh.scale)
  line.renderOrder = 6
  line.userData.isSpatialOutline = true
  line.userData.spatialId = meta.spatialId
  line.userData.spatialKind = meta.spatialKind
  line.userData.buildingId = meta.buildingId
  spatialOutlines.push(line)
  spatialGroup.add(line)
}

function rebuildSpatial() {
  if (!scene) return
  if (!spatialGroup) {
    spatialGroup = new THREE.Group()
    spatialGroup.name = '__spatial'
    scene.add(spatialGroup)
  }
  clearSpatial()

  for (const b of props.buildings) {
    for (const region of b.regions || []) {
      if (!Array.isArray(region.points) || region.points.length < 3) continue
      const baseY = Number(region.baseY)
      const y0 = Number.isFinite(baseY) ? baseY : 0.9
      const height = Math.max(0.05, Number(region.height) || 0.6)
      const isBox = region.shape === 'box'
      const geometry = new THREE.ExtrudeGeometry(shapeFromPoints(region.points), {
        depth: height,
        bevelEnabled: false,
        curveSegments: 1,
      })
      geometry.rotateX(-Math.PI / 2)
      // 自定义区域只是「可被点中的透明区域」：平时完全不可见，
      // 鼠标移上去时按建筑原本的悬浮效果亮起，不额外上色、不画边框。
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      )
      mesh.position.y = y0
      mesh.renderOrder = 4
      const meta = {
        buildingId: b.id,
        spatialId: region.id,
        spatialName: region.name || b.name,
        spatialDesc: region.desc || (isBox ? '立体方块' : '3D 区域'),
        spatialKind: 'region',
        spatialBox: isBox,
      }
      addSpatialMesh(mesh, meta, 0, 0)
    }

    for (const point of b.surfacePoints || []) {
      if (!point.position || !point.normal) continue
      if (point.enabled === false) continue
      const pos = new THREE.Vector3(point.position.x, point.position.y, point.position.z)
      const normal = new THREE.Vector3(point.normal.x, point.normal.y, point.normal.z).normalize()
      const radius = Math.max(1, Number(point.radius) || 10)
      const isRect = point.shape === 'rect' || (point.shape !== 'poly' && point.shape !== 'circle') || point.cut
      const polyPoints = Array.isArray(point.points) ? point.points : []
      const isPoly = point.shape === 'poly' && polyPoints.length >= 3 && !point.cut
      const rect = isRect ? patchRect(point) : null
      let geometry
      let quaternion
      if (rect) {
        // 参数化矩形（含半栋刀口）：用面内坐标系直接铺一块形状
        const uv = rect.poly2d || [
          { u: -rect.width / 2, v: -rect.height / 2 },
          { u: rect.width / 2, v: -rect.height / 2 },
          { u: rect.width / 2, v: rect.height / 2 },
          { u: -rect.width / 2, v: rect.height / 2 },
        ]
        const shape = new THREE.Shape()
        uv.forEach((p, i) => {
          if (i === 0) shape.moveTo(p.u, -p.v)
          else shape.lineTo(p.u, -p.v)
        })
        shape.closePath()
        geometry = new THREE.ShapeGeometry(shape)
        const m = new THREE.Matrix4().makeBasis(rect.right, rect.up, new THREE.Vector3().crossVectors(rect.right, rect.up))
        geometry.applyMatrix4(m)
        quaternion = new THREE.Quaternion()
      } else {
        geometry = isPoly
          ? new THREE.ShapeGeometry(shapeFromPoints(polyPoints))
          : new THREE.CircleGeometry(radius, 36)
        quaternion = new THREE.Quaternion()
      }
      // 表面位置和「平地 3D 区域」一样：平时完全透明，鼠标移到上面时
      // 直接把楼体点亮（由 hoverIds 带动 applyAppearance 的发光），本身永远不显色。
      const patch = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      )
      patch.position.copy(pos).addScaledVector(normal, 0.28)
      if (rect) patch.quaternion.copy(quaternion)
      else patch.lookAt(pos.clone().addScaledVector(normal, 1))
      patch.renderOrder = 4
      addSpatialMesh(patch, {
        buildingId: b.id,
        spatialId: point.id,
        spatialName: point.name || b.name,
        spatialDesc: point.desc || '模型表面位置',
        spatialKind: 'surface',
      }, 0, 0)
    }
  }
  // 区域一旦存在就一直显示：它属于建筑本身的内容，不该跟着「地图模式」开关
  spatialGroup.visible = true
  applySpatialHover()
}

function applySpatialHover() {
  for (const mesh of spatialMeshes) {
    if (!mesh.material) continue
    // 自定义区域只是透明命中体，永远不显示颜色；悬浮高亮交给建筑本体
    if (mesh.userData.spatialKind === 'region') {
      mesh.material.opacity = 0
      continue
    }
    const active = mesh.userData.spatialId === hoverSpatialId
    const base = Number(mesh.userData.baseOpacity) || 0.3
    const hot = Number(mesh.userData.hotOpacity) || Math.min(1, base + 0.28)
    const b = byId.value.get(mesh.userData.buildingId)
    const match = !props.filterCategory || (b && b.categoryId === props.filterCategory) || props.selectedId === mesh.userData.buildingId
    mesh.material.opacity = match ? (active ? hot : base) : base * 0.12
  }
  applySpatialOutlineState()
}

/** 轮廓高光：悬浮到区域/贴片，或该区域所属建筑被选中时亮起 */
function applySpatialOutlineState() {
  if (!spatialOutlines.length) return
  for (const line of spatialOutlines) {
    if (!line.material) continue
    const hovered = line.userData.spatialId && line.userData.spatialId === hoverSpatialId
    const selected = props.selectedId && props.selectedId === line.userData.buildingId
    const b = byId.value.get(line.userData.buildingId)
    const filteredOut = props.filterCategory && b && b.categoryId !== props.filterCategory
    let target = 0
    if (hovered) target = 0.95
    else if (selected && !filteredOut) target = 0.5
    line.material.opacity = filteredOut && !hovered ? 0 : target
    line.visible = line.material.opacity > 0.01
  }
}


/* ------------------------------------------------------------------ */
/* 外观：筛选变暗 / 选中高亮                                             */
/* ------------------------------------------------------------------ */

function objectMatchesFilter(ids) {
  if (!props.filterCategory) return true
  return ids.some((id) => {
    const b = byId.value.get(id)
    return b && b.categoryId === props.filterCategory
  })
}

/* 分类筛选时，命中的楼体浮起一圈柔和的白边光。
   做法：沿法线外扩的背面壳（BackSide）叠三层，由内到外从实到虚，
   形成从墙体到背景的柔和过渡 —— 是「发光」而不是「描边」。
   没有用 EdgesGeometry 描线：这些楼是「一个窗带一个面」拼的，
   描线会把每条面片边界都勾出来，看起来像线框。
   几何按 mesh 缓存，切换分类只改 visible / opacity。 */
const FILTER_GLOW = new THREE.Color(0xffffff)
const filterEdgeCache = new Map()
/** 沿法线外扩的柔光壳（BackSide），半径按楼体尺寸给 */
function makeOutlineMaterial(offset, baseOpacity = 0.5) {
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.AdditiveBlending,
  })
  mat.userData = { baseOpacity }
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = { value: offset }
    shader.vertexShader =
      'uniform float uOutline;\n' +
      shader.vertexShader.replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\n\ttransformed += normalize(normal) * uOutline;'
      )
  }
  mat.customProgramCacheKey = () => 'c3d-outline'
  return mat
}

function ensureFilterEdges(mesh) {
  if (filterEdgeCache.has(mesh.uuid)) return filterEdgeCache.get(mesh.uuid)
  let outline = null
  try {
    // 2) 两层 additive 柔光壳 —— 内紧外松，叠出从实到虚的扩散渐变
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
    const bb = mesh.geometry.boundingBox
    const diag = bb ? bb.getSize(new THREE.Vector3()).length() : 20
    const base = Math.min(2.2, Math.max(0.9, diag * 0.009))
    const layers = [
      { scale: 1.0, opacity: 0.62 },
      { scale: 1.9, opacity: 0.3 },
      { scale: 3.2, opacity: 0.14 },
    ]
    for (const layer of layers) {
      const shell = new THREE.Mesh(mesh.geometry, makeOutlineMaterial(base * layer.scale, layer.opacity))
      shell.renderOrder = 2
      shell.userData.isFilterEdge = true
      shell.userData.isFilterShell = true
      shell.userData.filterBaseOpacity = layer.opacity
      shell.visible = false
      mesh.add(shell)
    }
  } catch {
    outline = null
  }
  filterEdgeCache.set(mesh.uuid, outline)
  return outline
}

/** 关掉全部边光（退出筛选时调用） */
function clearFilterEdges() {
  for (const obj of filterEdgeCache.values()) {
    if (obj) obj.visible = false
  }
}

function applyFilterEdges(mesh, active) {
  ensureFilterEdges(mesh)
  for (const child of mesh.children) {
    if (!child.userData?.isFilterEdge) continue
    child.visible = active
    if (!active) continue
    // 粗线接近实白；柔光壳按层各自的浓度
    child.material.opacity = child.userData.isFilterShell
      ? (child.userData.filterBaseOpacity ?? 0.28)
      : 0.82
  }
}

/* ------------------------------------------------------------------ */
/* 分类筛选：竖直光柱                                                    */
/* ------------------------------------------------------------------ */
let beamGroup = null
let beamTexture = null

/** 一条从地面冲上天的光柱：竖直渐变（底部实、顶部虚） */
function getBeamTexture() {
  if (beamTexture) return beamTexture
  const c = document.createElement('canvas')
  c.width = 8
  c.height = 256
  const ctx = c.getContext('2d')
  const g = ctx.createLinearGradient(0, 256, 0, 0) // 下 → 上
  g.addColorStop(0, 'rgba(255,255,255,0.00)')
  g.addColorStop(0.06, 'rgba(255,255,255,0.72)')
  g.addColorStop(0.28, 'rgba(255,255,255,0.42)')
  g.addColorStop(0.62, 'rgba(255,255,255,0.16)')
  g.addColorStop(1, 'rgba(255,255,255,0.00)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, 8, 256)
  beamTexture = new THREE.CanvasTexture(c)
  beamTexture.wrapS = THREE.RepeatWrapping
  beamTexture.wrapT = THREE.ClampToEdgeWrapping
  beamTexture.needsUpdate = true
  return beamTexture
}

function clearBeams() {
  if (!beamGroup) return
  while (beamGroup.children.length) {
    const child = beamGroup.children[0]
    beamGroup.remove(child)
    child.traverse?.((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose())
        else o.material.dispose()
      }
    })
  }
}

/**
 * 按分类筛选重建光柱。
 * 只给「命中的、有位置的」建筑立柱子：优先用模型包围盒中心，
 * 没有模型的（停车场、外卖处之类）退回用 pin 坐标。
 */
function rebuildBeams() {
  if (!scene) return
  if (!beamGroup) {
    beamGroup = new THREE.Group()
    beamGroup.name = '__beams'
    scene.add(beamGroup)
  }
  clearBeams()
  const cat = props.filterCategory
  if (!cat) return

  // 浅色背景上加法混合会被「加」成白色，所以用普通混合直接呈现分类本色；
  // 但教学区 #1B4332、特殊 #301934 太暗会像一根黑柱子，把过暗的色提到能看出色相
  const color = new THREE.Color(props.filterColor || '#1B4332')
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  if (hsl.l < 0.3) color.setHSL(hsl.h, Math.min(1, hsl.s * 1.15 + 0.05), 0.34)
  const tex = getBeamTexture()

  for (const b of props.buildings) {
    if (b.categoryId !== cat) continue
    let x = null
    let z = null
    let top = 0
    const box = buildingBoxes.get(b.id)
    if (box && Number.isFinite(box.min.x) && box.max.x > box.min.x) {
      const c = box.getCenter(new THREE.Vector3())
      x = c.x
      z = c.z
      top = box.max.y
    } else if (b.pin) {
      x = Number(b.pin.x) || 0
      z = Number(b.pin.z) || 0
      top = 8
    }
    if (x === null) continue

    // 从楼顶开始往上冲，不从地面穿楼而过（穿楼会在墙里断成两截）
    const y0 = Math.max(1.2, top - 1)
    const height = 190
    const base = Math.max(1.0, Math.min(1.7, height * 0.0062))

    // 外层柔和光柱
    const outer = new THREE.Mesh(
      new THREE.CylinderGeometry(base * 1.5, base * 2.4, height, 18, 1, true),
      new THREE.MeshBasicMaterial({
        map: tex,
        color,
        transparent: true,
        opacity: 0.42,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    )
    outer.position.set(x, y0 + height / 2, z)
    outer.renderOrder = 6
    outer.raycast = () => {}
    beamGroup.add(outer)

    // 内部亮芯
    const core = new THREE.Mesh(
      new THREE.CylinderGeometry(base * 0.35, base * 0.55, height, 10, 1, true),
      new THREE.MeshBasicMaterial({
        map: tex,
        color,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      })
    )
    core.position.set(x, y0 + height / 2, z)
    core.renderOrder = 7
    core.raycast = () => {}
    beamGroup.add(core)
  }

  beamGroup.visible = props.mapMode && Boolean(cat)
}

function applyAppearance() {
  const filtering = Boolean(props.filterCategory)
  for (const mesh of pickMeshes) {
    const ids = mesh.userData.buildingIds || []
    const selected = props.selectedId && ids.includes(props.selectedId)
    const hovered = [...hoverIds].some((id) => ids.includes(id))
    const matched = objectMatchesFilter(ids)
    const dim = !matched && !selected && !hovered
    const highlight = Boolean(selected || hovered)
    // 分类筛选命中的楼体：一层很淡的自发光 + 轮廓边光，柔和、不闪烁
    const inFilter = filtering && matched && !highlight && !selected
    for (const m of mesh.userData.materials || []) {
      const nextTransparent = dim ? true : m.userData.baseTransparent
      if (m.transparent !== nextTransparent) {
        m.transparent = nextTransparent
        m.needsUpdate = true
      }
      m.opacity = dim ? 0.08 : m.userData.baseOpacity
      m.depthWrite = dim ? false : m.userData.baseDepthWrite
      if (m.emissive && m.userData.baseEmissive) {
        if (highlight) {
          m.emissive.copy(ACCENT)
          m.emissiveIntensity = selected ? 0.62 : 0.35
        } else if (inFilter) {
          // 命中分类：几乎不提亮本体（提亮会让浅色楼发灰），全部靠轮廓光区分
          m.emissive.copy(FILTER_GLOW)
          m.emissiveIntensity = 0.1
        } else {
          m.emissive.copy(m.userData.baseEmissive)
          m.emissiveIntensity = m.userData.baseEmissiveIntensity
        }
      }
    }
    applyFilterEdges(mesh, inFilter)
  }
  updatePinVisibility()
  // 定位发光进行中时，选中/筛选切换会覆盖 emissive，这里立刻叠回去
  if (locateGlow) updateLocateGlow(performance.now())
}

watch(() => props.filterCategory, () => {
  applyAppearance()
  applySpatialHover()
  rebuildBeams()
})

watch(() => props.filterColor, () => {
  if (props.filterCategory) rebuildBeams()
})

watch(() => props.mapMode, (v) => {
  if (beamGroup) beamGroup.visible = Boolean(v && props.filterCategory)
})

watch(() => props.selectedId, (id) => {
  // 切换建筑时先停掉上一栋的定位发光，避免旧楼一直亮着
  if (id && locateGlow && locateGlow.id !== id) stopLocateGlow()
  applyAppearance()
  applySpatialHover()
  if (id) {
    const b = byId.value.get(id)
    if (b) showFocusLabel(b, 6000)
  }
})

watch(() => props.mapMode, (v) => {
  if (!controls) return
  if (v) {
    heroSpin = false
    // 第一次进地图把工具坞打开，让用户知道这里有什么
    if (!dockAutoOpened) {
      dockAutoOpened = true
      setTimeout(() => { dockOpen.value = true }, 700)
    }
  } else {
    // 退回首页：重新做特写自转
    if (walkMode.value) exitWalkMode()
    setTimeout(() => startHeroSpin(), 320)
  }
  if (!v && panOnly.value) {
    panOnly.value = false
    applyInteractionMode()
  }
  controls.enableZoom = v && !panOnly.value
  if (!v) hideFocusLabel()
  updatePinVisibility()
  if (spatialGroup) spatialGroup.visible = true
  applySpatialHover()
})

watch(() => props.buildings, () => {
  if (ready.value) {
    rebuildPins()
    rebuildSpatial()
    applyAppearance()
  }
})

/* ------------------------------------------------------------------ */
/* 交互                                                                */
/* ------------------------------------------------------------------ */

function ndcFromEvent(event) {
  const rect = host.value.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  return { rect }
}

function pickTargets() {
  const visiblePins = props.mapMode
    ? pinMeshes.filter((mesh) => mesh.parent?.visible && mesh.parent?.parent?.visible !== false)
    : []
  return props.mapMode
    ? [...spatialMeshes, ...pickMeshes, ...visiblePins]
    : [...pickMeshes]
}

function pickAtNdc(ndcX, ndcY) {
  pointer.set(ndcX, ndcY)
  raycaster.setFromCamera(pointer, camera)
  raycaster.far = Infinity
  const hits = raycaster.intersectObjects(pickTargets(), false)
  return hits.length ? hits[0].object : null
}

function pickAt(event) {
  const rect = ndcFromEvent(event)
  return { hit: pickAtNdc(pointer.x, pointer.y), rect }
}

/* ------------------------------------------------------------------ */
/* 准星模式（触屏 / 窄屏 免悬浮拾取）                                   */
/* ------------------------------------------------------------------ */

let aimHit = null
let lastAimAt = 0

function applyAimHit(hit) {
  const isSpatial = Boolean(hit?.userData.isSpatial)
  const id = hit
    ? hit.userData.isPin || isSpatial
      ? hit.userData.buildingId
      : hit.userData.buildingIds?.[0]
    : ''
  const next = id ? [id] : []
  const changed = next.length !== hoverIds.size || next.some((x) => !hoverIds.has(x))
  if (changed) {
    hoverIds.clear()
    for (const x of next) hoverIds.add(x)
    hoverBuildingId = id || ''
    applyAppearance()
  }
  const nextSpatial = isSpatial ? hit.userData.spatialId : ''
  if (nextSpatial !== hoverSpatialId) {
    hoverSpatialId = nextSpatial
    applySpatialHover()
  }
  const rect = host.value?.getBoundingClientRect()
  if (!rect || !hit) {
    if (!focusLabel) hideLabel()
    return
  }
  const cx = aimPos.x + 18
  const cy = aimPos.y - 20
  if (isSpatial) {
    showSpatialLabel(hit, cx, cy)
  } else {
    const b = byId.value.get(id)
    if (b) showLabel(b, cx, cy)
    else if (!focusLabel) hideLabel()
  }
}

function aimNdc() {
  const rect = host.value?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return [0, 0]
  return [(aimPos.x / rect.width) * 2 - 1, -(aimPos.y / rect.height) * 2 + 1]
}

function centerAim() {
  const rect = host.value?.getBoundingClientRect()
  if (!rect) return
  aimPos.x = rect.width * 0.5
  aimPos.y = rect.height * 0.5
}

function startAimDrag(event) {
  const rect = host.value?.getBoundingClientRect()
  if (!rect) return
  aimDragging.value = true
  aimDrag = { id: event.pointerId, dx: aimPos.x - (event.clientX - rect.left), dy: aimPos.y - (event.clientY - rect.top) }
  const move = (e) => {
    if (!aimDrag || e.pointerId !== aimDrag.id) return
    const r = host.value?.getBoundingClientRect()
    if (!r) return
    aimPos.x = Math.min(Math.max(8, e.clientX - r.left + aimDrag.dx), r.width - 8)
    aimPos.y = Math.min(Math.max(8, e.clientY - r.top + aimDrag.dy), r.height - 8)
    lastAimAt = 0
  }
  const up = (e) => {
    if (aimDrag && e.pointerId !== aimDrag.id) return
    aimDragging.value = false
    aimDrag = null
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}

function updateAim(now) {
  if (!aimMode.value || !props.mapMode || !ready.value || walkMode.value) return
  if (now - lastAimAt < 70) return
  lastAimAt = now
  const [ax, ay] = aimNdc()
  aimHit = pickAtNdc(ax, ay)
  applyAimHit(aimHit)
  if (aimHit) labelTimer = now + 1200
}

function clearAim() {
  aimHit = null
  if (hoverIds.size) {
    hoverIds.clear()
    hoverBuildingId = ''
    applyAppearance()
  }
  if (hoverSpatialId) {
    hoverSpatialId = ''
    applySpatialHover()
  }
  if (!focusLabel) hideLabel()
}

function toggleAimMode() {
  aimMode.value = !aimMode.value
  if (aimMode.value) {
    panOnly.value = false
    centerAim()
    lastAimAt = 0
  } else {
    clearAim()
  }
}

function onPointerDown(event) {
  if (event.button !== undefined && event.button !== 0 && event.pointerType === 'mouse') return
  // 首页只做展示：不响应拖动/点选，避免和「开始使用」抢操作
  if (!props.mapMode) return
  userInteracted = true
  if (controls) controls.autoRotate = false
  activePointers.add(event.pointerId)
  if (activePointers.size > 1) multiTouch = true
  pointerDown = { x: event.clientX, y: event.clientY, t: performance.now(), moved: false }
}

function onPointerMove(event) {
  lastClient = { x: event.clientX, y: event.clientY }
  if (pointerDown && Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 5) {
    pointerDown.moved = true
  }
  // 首页只做展示：不显示悬浮提示，避免文字压在大标题上
  if (!props.mapMode) return
  if (event.pointerType === 'touch') return
  if (aimMode.value) return
  if (pointerDown?.moved) {
    hideLabel()
    return
  }
  const now = performance.now()
  if (now - lastHoverAt < 45) return
  lastHoverAt = now
  const { hit } = pickAt(event)
  const isSpatial = Boolean(hit?.userData.isSpatial)
  const ids = hit
    ? hit.userData.isPin
      ? [hit.userData.buildingId]
      : isSpatial
        ? [hit.userData.buildingId]
        : hit.userData.buildingIds
    : []
  const next = new Set(ids || [])
  const changed = next.size !== hoverIds.size || [...next].some((id) => !hoverIds.has(id))
  if (changed) {
    hoverIds.clear()
    for (const id of next) hoverIds.add(id)
    hoverBuildingId = ids?.[0] || ''
    applyAppearance()
  }
  const nextSpatial = isSpatial ? hit.userData.spatialId : ''
  if (nextSpatial !== hoverSpatialId) {
    hoverSpatialId = nextSpatial
    applySpatialHover()
  }
  if (hit) {
    const rect = host.value.getBoundingClientRect()
    if (isSpatial) {
      showSpatialLabel(hit, event.clientX - rect.left + 16, event.clientY - rect.top - 12)
    } else {
      const b = byId.value.get(ids?.[0])
      if (b) showLabel(b, event.clientX - rect.left + 16, event.clientY - rect.top - 12)
    }
    renderer.domElement.style.cursor = panOnly.value ? 'grab' : 'pointer'
  } else {
    if (!focusLabel) hideLabel()
    renderer.domElement.style.cursor = pointerDown ? 'grabbing' : 'grab'
  }
}

function onPointerUp(event) {
  activePointers.delete(event.pointerId)
  const down = pointerDown
  pointerDown = null
  if (activePointers.size > 0) return
  if (multiTouch) {
    multiTouch = false
    return
  }
  if (!props.mapMode) return
  if (!down || down.moved) return
  if (performance.now() - down.t > 700) return
  if (panOnly.value) return
  // 准星只是提示，拾取一律按点击落点算
  const { hit } = pickAt(event)
  if (!hit) {
    emit('background')
    return
  }
  if (hit.userData.isSpatial) {
    emit('select', { items: [hit.userData.buildingId], x: event.clientX, y: event.clientY })
    return
  }
  if (hit.userData.isPin) {
    emit('select', { items: [hit.userData.buildingId], x: event.clientX, y: event.clientY })
    return
  }
  const ids = hit.userData.buildingIds || []
  if (!ids.length) return
  emit('select', { items: [...ids], x: event.clientX, y: event.clientY })
}

function onPointerLeave() {
  if (!pointerDown) {
    hoverIds.clear()
    hoverBuildingId = ''
    hoverSpatialId = ''
    applyAppearance()
    applySpatialHover()
    if (!focusLabel) hideLabel()
  }
}

function onWheel(event) {
  if (panOnly.value) event.preventDefault()
  userInteracted = true
  if (controls) controls.autoRotate = false
}

/* ------------------------------------------------------------------ */
/* 标签                                                                */
/* ------------------------------------------------------------------ */

function showLabel(b, x, y) {
  const rect = host.value.getBoundingClientRect()
  label.name = b.name
  label.sub = [b.sub, b.catName].filter(Boolean).join(' · ')
  label.x = Math.min(Math.max(12, x), rect.width - 12)
  label.y = Math.min(Math.max(12, y), rect.height - 12)
  label.show = true
  labelTimer = performance.now() + 2600
}

function showSpatialLabel(hit, x, y) {
  const rect = host.value.getBoundingClientRect()
  // 自定义区域：提示就是「这栋建筑」，和直接悬浮在建筑上完全一致
  if (hit.userData.spatialKind === 'region') {
    const b = byId.value.get(hit.userData.buildingId)
    if (b) {
      label.name = b.name
      label.sub = [b.sub, b.catName].filter(Boolean).join(' · ')
      label.x = Math.min(Math.max(12, x), rect.width - 12)
      label.y = Math.min(Math.max(12, y), rect.height - 12)
      label.show = true
      labelTimer = performance.now() + 2600
      return
    }
  }
  label.name = hit.userData.spatialName || '3D 区域'
  label.sub = hit.userData.spatialDesc || (hit.userData.spatialKind === 'surface' ? '模型表面位置' : '3D 区域')
  label.x = Math.min(Math.max(12, x), rect.width - 12)
  label.y = Math.min(Math.max(12, y), rect.height - 12)
  label.show = true
  labelTimer = performance.now() + 2600
}

function hideLabel() {
  label.show = false
}

function showFocusLabel(b, duration = 5000) {
  const points = []
  for (const name of b.modelObjects || []) {
    const obj = model?.getObjectByName(name)
    if (obj) {
      const box = new THREE.Box3().setFromObject(obj)
      const c = box.getCenter(new THREE.Vector3())
      c.y = box.max.y + 8
      points.push(c)
    }
  }
  if (!points.length && b.pin) points.push(new THREE.Vector3(b.pin.x, 30, b.pin.z))
  if (!points.length) return
  const point = points[0]
  const until = performance.now() + duration
  focusLabel = { b, point, until }
  labelTimer = 0
  // 飞行途中先显示在画面上方，随后每帧按投影位置修正
  const rect = host.value.getBoundingClientRect()
  label.name = b.name
  label.sub = [b.sub, b.catName].filter(Boolean).join(' · ')
  label.x = rect.width * 0.5
  label.y = rect.height * 0.34
  label.show = true
}

function hideFocusLabel() {
  focusLabel = null
  if (!hoverIds.size) hideLabel()
}

function updateFocusLabel() {
  if (!focusLabel) return
  if (performance.now() > focusLabel.until) {
    focusLabel = null
    if (!hoverIds.size) hideLabel()
    return
  }
  if (hoverIds.size) return
  const v = focusLabel.point.clone().project(camera)
  if (v.z > 1) {
    label.show = false
    return
  }
  const rect = host.value.getBoundingClientRect()
  label.name = focusLabel.b.name
  label.sub = [focusLabel.b.sub, focusLabel.b.catName].filter(Boolean).join(' · ')
  label.x = Math.min(Math.max(12, (v.x * 0.5 + 0.5) * rect.width), rect.width - 12)
  label.y = Math.min(Math.max(12, (-v.y * 0.5 + 0.5) * rect.height), rect.height - 12)
  label.show = true
}

/* ------------------------------------------------------------------ */
/* 相机约束 / 飞行                                                     */
/* ------------------------------------------------------------------ */

function clampTarget() {
  if (!controls) return
  const t = controls.target
  // 用模型实际包围盒决定可平移范围（原来写死 ±360，只能在最外围活动）
  const lim = targetLimit()
  t.x = THREE.MathUtils.clamp(t.x, -lim, lim)
  t.z = THREE.MathUtils.clamp(t.z, -lim, lim)
  t.y = THREE.MathUtils.clamp(t.y, 0, 40)
}

let _targetLimit = 0
function targetLimit() {
  if (_targetLimit) return _targetLimit
  if (!modelBox || modelBox.isEmpty()) return 520
  const size = modelBox.getSize(new THREE.Vector3())
  _targetLimit = Math.max(360, Math.max(size.x, size.z) * 0.62)
  return _targetLimit
}

const tmpDir = new THREE.Vector3()

/**
 * 只约束相机“点”不能进入建筑体块内部，而不是用视线射线去截断相机。
 * 后者会在建筑密集区把相机硬拉到墙边，视角会突然贴脸。
 */
function enforceCameraVolume() {
  if (!camera) return
  // 贴地高度：允许低到 2.2 m（平视一层门窗），不再强制抬到 7 m
  if (camera.position.y < 2.2) camera.position.y = 2.2
  const p = camera.position
  for (let pass = 0; pass < 3; pass++) {
    let moved = false
    for (const box of buildingBoxes.values()) {
      if (box.isEmpty()) continue
      if (
        p.x > box.min.x - 1.2 && p.x < box.max.x + 1.2 &&
        p.z > box.min.z - 1.2 && p.z < box.max.z + 1.2 &&
        p.y > box.min.y - 1.2 && p.y < box.max.y + 1.2
      ) {
        // 只把相机顶到最近的那个面上，而不是一律拉到屋顶
        const opt = [
          { axis: 'y', v: box.max.y + 2, d: Math.abs(box.max.y + 2 - p.y) },
          { axis: 'x', v: box.min.x - 1.6, d: Math.abs(p.x - (box.min.x - 1.6)) },
          { axis: 'x2', v: box.max.x + 1.6, d: Math.abs(box.max.x + 1.6 - p.x) },
          { axis: 'z', v: box.min.z - 1.6, d: Math.abs(p.z - (box.min.z - 1.6)) },
          { axis: 'z2', v: box.max.z + 1.6, d: Math.abs(box.max.z + 1.6 - p.z) },
        ].sort((a, b) => a.d - b.d)[0]
        if (opt.axis === 'y') p.y = opt.v
        else if (opt.axis === 'x') p.x = opt.v
        else if (opt.axis === 'x2') p.x = opt.v
        else if (opt.axis === 'z') p.z = opt.v
        else p.z = opt.v
        moved = true
      }
    }
    if (!moved) break
  }
  // 靠近时把近裁剪面调小，否则 50 以外才看得见、贴脸会整栋消失
  const dist = camera.position.distanceTo(controls.target)
  const nearWant = THREE.MathUtils.clamp(dist * 0.02, 0.3, 50)
  if (Math.abs(camera.near - nearWant) > 0.05) {
    camera.near = nearWant
    camera.updateProjectionMatrix()
  }
}

function targetForBuilding(b) {
  const objs = (b.modelObjects || []).map((name) => model?.getObjectByName(name)).filter(Boolean)
  if (!objs.length) {
    if (b.pin) {
      return {
        target: new THREE.Vector3(b.pin.x, 0, b.pin.z),
        distance: 330,
      }
    }
    return null
  }
  const box = new THREE.Box3()
  for (const obj of objs) box.expandByObject(obj)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const maxDim = Math.max(size.x, size.z, size.y * 1.8)
  const radius = Math.max(size.x, size.z, size.y * 1.6) * 0.5
  const dir = camera.position.clone().sub(controls.target)
  dir.y = 0
  if (dir.lengthSq() < 0.001) dir.set(0.6, 0, 0.8)
  dir.normalize()
  const target = center.clone()
  target.y = 0
  target.addScaledVector(dir, radius * 0.75 + 12)
  return { target, distance: THREE.MathUtils.clamp(maxDim * 8, 520, 1100) }
}

function flyToTarget(target, distance, duration = 900, polarDeg = null) {
  if (!controls) return
  const dir = camera.position.clone().sub(controls.target)
  if (dir.lengthSq() < 0.0001) dir.set(0.6, 0.5, 0.8)
  dir.normalize()
  if (polarDeg != null) {
    const polar = THREE.MathUtils.degToRad(polarDeg)
    const azimuth = Math.atan2(dir.x, dir.z)
    dir.set(
      Math.sin(polar) * Math.sin(azimuth),
      Math.cos(polar),
      Math.sin(polar) * Math.cos(azimuth)
    )
  }
  const endPos = target.clone().addScaledVector(dir, distance)
  endPos.y = Math.max(endPos.y, 10)
  fly = {
    start: performance.now(),
    duration: prefersReduced ? 0 : duration,
    fromTarget: controls.target.clone(),
    toTarget: target.clone(),
    fromPos: camera.position.clone(),
    toPos: endPos,
  }
  controls.autoRotate = false
}

function updateFly(now) {
  if (!fly) return false
  const t = fly.duration === 0 ? 1 : Math.min(1, (now - fly.start) / fly.duration)
  const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  controls.target.lerpVectors(fly.fromTarget, fly.toTarget, eased)
  camera.position.lerpVectors(fly.fromPos, fly.toPos, eased)
  // 弧线：sin(πt) 在两端为 0、中间最大，抬起来再落下，避免贴脸直线冲刺
  if (fly.arcHeight) {
    camera.position.y += Math.sin(Math.PI * eased) * fly.arcHeight
  }
  // 第一人称进出时同步推进 FOV，避免加镜头很近时突然放大
  if (fly.fovTo !== undefined) {
    camera.fov = THREE.MathUtils.lerp(fly.fovFrom, fly.fovTo, eased)
  }
  // 近裁剪面也一起收：飞向地面时如果不收，最后一段会「地面被切开」
  if (fly.nearTo !== undefined) {
    camera.near = THREE.MathUtils.lerp(fly.nearFrom, fly.nearTo, eased)
  }
  if (fly.fovTo !== undefined || fly.nearTo !== undefined) camera.updateProjectionMatrix()
  camera.lookAt(controls.target)
  if (t >= 1) {
    const done = fly.onDone
    fly = null
    controls.enabled = true
    controls.update()
    if (done) done()
    return false
  }
  return true
}

function flyToBuilding(id, duration = 900) {
  const b = byId.value.get(id)
  if (!b) return false
  // 3D 定位属于「上帝视角」的交互：正在第一人称就先退回上帝视角
  if (walkMode.value || walkPending) exitWalkMode()
  hoverIds.clear()
  applyAppearance()
  const info = targetForBuilding(b)
  if (!info) {
    showFocusLabel(b, 4000)
    playLocateGlow(id, Math.min(duration + 6000, 9000))
    return false
  }
  clampTargetTo(info.target)
  flyToTarget(info.target, info.distance, duration, 42)
  controls.enabled = false
  showFocusLabel(b, duration + 5200)
  // 楼体自发光呼吸，代替地面光圈
  playLocateGlow(id, duration + 7000)
  return true
}

function clampTargetTo(target) {
  target.x = THREE.MathUtils.clamp(target.x, -TARGET_LIMIT, TARGET_LIMIT)
  target.z = THREE.MathUtils.clamp(target.z, -TARGET_LIMIT, TARGET_LIMIT)
}

function enterMap() {
  if (!controls) return
  mode.entering = true
  heroSpin = false
  const target = targetPoint.clone()
  if (!isNarrow) target.x -= 90
  flyToTarget(target, isNarrow ? 1950 : 1450, 1100, isNarrow ? 52 : 48)
  controls.enabled = false
  setTimeout(() => { mode.entering = false }, 1150)
}

/* ------------------------------------------------------------------ */
/* 首页特写：贴近来，极慢自转，高级感                                   */
/* ------------------------------------------------------------------ */

let heroSpin = false
let heroTargetDist = 620
let heroSpinStart = 0

function startHeroSpin() {
  if (!controls || props.mapMode || prefersReduced) return
  heroSpin = true
  heroSpinStart = performance.now()
  heroLastFrame = 0
  heroAngle = Math.atan2(camera.position.x - controls.target.x, camera.position.z - controls.target.z)
  // 全览 → 特写：走近到中部建筑群上方，视线略低，像航拍靠近
  const goal = targetPoint.clone()
  goal.y = 6
  flyToTarget(goal, isNarrow ? 780 : heroTargetDist, 2600, 74)
  controls.enabled = false
}

let heroAngle = 0
let heroLastFrame = 0

function updateHeroSpin(now) {
  if (!heroSpin || !controls) return
  // 起飞段由 fly 控制，落定后才开始自转
  if (fly) { heroLastFrame = now; return }
  // 首页不接受轨道控制（用户只能点「开始使用」进地图）
  controls.enabled = false
  const dt = heroLastFrame ? Math.min(64, now - heroLastFrame) : 16
  heroLastFrame = now
  // 极慢环绕：约 5~6 分钟一圈；轻微上下浮动，像航拍悬停
  heroAngle += 0.00028 * (dt / 16)
  const r = camera.position.distanceTo(controls.target)
  const bob = Math.sin(now / 9000) * 0.008
  const polar = THREE.MathUtils.degToRad(74) + bob
  camera.position.set(
    controls.target.x + Math.sin(polar) * Math.sin(heroAngle) * r,
    controls.target.y + Math.cos(polar) * r,
    controls.target.z + Math.sin(polar) * Math.cos(heroAngle) * r
  )
  camera.lookAt(controls.target)
}

/* ------------------------------------------------------------------ */
/* 第一人称漫游                                                        */
/* ------------------------------------------------------------------ */

const walkKeys = reactive({ w: false, a: false, s: false, d: false, up: false, down: false, left: false, right: false, run: false, lookL: false, lookR: false })
/** 视角键转速（弧度/秒） */
const LOOK_SPEED = 1.5
let walkYaw = 0
let walkPitch = 0
let walkSaved = null
const WALK_EYE = 1.7
// 眼离地面的保险下限：漫游中任何情况下都不允许低于「地面 + 这个值」
const WALK_MIN_CLEAR = 0.35
// 第一人称只能在校区范围内活动（比模型盒子略收一点，避免沿围墙走出去）
let walkBounds = null
const walkPos = new THREE.Vector3()
const walkRay = new THREE.Raycaster()
// 起步点在相机推进到门外后才接管相机；lookPoint 是起步朝向的目标
const walkLookPoint = new THREE.Vector3()
let walkPending = false
// 移动速度倍率：0.5× ~ 4×，默认 1×
const walkSpeedMul = ref(1)

/** 从某栋建筑（默认南门）外侧起步，朝校园中心看 */
function spawnWalk(deferred = false) {
  // 活动范围 = 模型外框收进来 6 米（围墙本身也在里面，双向保险）
  if (modelBox && !modelBox.isEmpty()) {
    walkBounds = {
      min: { x: modelBox.min.x + 6, z: modelBox.min.z + 6 },
      max: { x: modelBox.max.x - 6, z: modelBox.max.z - 6 },
    }
  }
  const gate = ['南门', '拱门_校门', '北门', '西门']
    .map((n) => props.buildings.find((b) => b.name === n))
    .find(Boolean)
  let spawn = new THREE.Vector3(0, WALK_EYE, 320)
  let lookAt = new THREE.Vector3(0, 12, 0)
  if (gate) {
    const objs = (gate.modelObjects || []).map((n) => model?.getObjectByName(n)).filter(Boolean)
    if (objs.length) {
      const box = new THREE.Box3()
      for (const o of objs) box.expandByObject(o)
      const c = box.getCenter(new THREE.Vector3())
      const size = box.getSize(new THREE.Vector3())
      // inward = 从大门指向校园中心；站在门内一侧、越过门洞之后再起走，否则会被拱门卡住
      const inward = new THREE.Vector3(-c.x, 0, -c.z).normalize()
      const off = Math.max(size.x, size.z) * 0.5 + 8
      spawn.set(c.x + inward.x * off, WALK_EYE, c.z + inward.z * off)
      lookAt = new THREE.Vector3(c.x + inward.x * (off + 60), 8, c.z + inward.z * (off + 60))
    }
  }
  walkPos.copy(spawn)
  // 出生点也按真实地面校准一次（模型地面不是 0，不能写死 WALK_EYE）
  const groundHere = walkGroundAtAt(spawn.x, spawn.z, spawn.y)
  if (Number.isFinite(groundHere)) walkPos.y = groundHere + WALK_EYE
  const d = lookAt.clone().sub(walkPos)
  walkYaw = Math.atan2(d.x, d.z)
  walkPitch = 0
  walkLookPoint.copy(lookAt)
  if (deferred) {
    // 交给 fly 过渡，别直接跳
    beginWalkTransition()
    return
  }
  camera.position.copy(walkPos)
  camera.lookAt(lookAt)
  camera.near = 0.35
  camera.updateProjectionMatrix()
}

function toggleWalkMode() {
  if (!walkMode.value) {
    if (!ready.value) return
    walkSaved = {
      pos: camera.position.clone(),
      target: controls.target.clone(),
      near: camera.near,
      enabled: controls.enabled,
      fov: camera.fov,
    }
    // 先把参数定好，再让 fly 把相机平滑推到门外，落定后才交出控制权
    walkPending = true
    aimMode.value = false
    panOnly.value = false
    controls.enabled = false
    controls.enableRotate = false
    controls.enableZoom = false
    controls.enablePan = false
    spawnWalk(true)
  } else {
    exitWalkMode()
  }
}

/** 上帝视角 → 第一人称：平滑推进，FOV 一起收，避免生硬跳切 */
function beginWalkTransition() {
  const toPos = walkPos.clone()
  const from = camera.position.clone()
  const lookTarget = walkLookPoint.clone()
  const dist = from.distanceTo(toPos)
  // 放慢一点：远处也更从容，最短 1.6s、最长 3.2s
  const duration = Math.max(1600, Math.min(3200, dist * 1.15))
  // 抬高一点再落下：从空中划一道弧线进人眼位置，比直线更有「镜头上方推进」的感觉
  const lift = Math.min(dist * 0.22, 220)
  const midTarget = controls.target.clone().lerp(lookTarget, 0.5)
  fly = {
    start: performance.now(),
    duration,
    fromTarget: controls.target.clone(),
    toTarget: lookTarget.clone(),
    fromPos: from,
    toPos,
    // 弧线：中点抬高，保证高度是「先升后降」而不是直接插值
    arcHeight: lift,
    arcFrom: from.y,
    arcTo: toPos.y,
    fovFrom: camera.fov,
    fovTo: isNarrow ? 62 : 58,
    nearFrom: camera.near,
    nearTo: 0.1,
    onDone: () => {
      walkPending = false
      walkMode.value = true
      dockOpen.value = false
      emit('walk', true)
      camera.fov = isNarrow ? 62 : 58
      // 第一人称贴地走，近裁剪面必须很小，否则身边的一切（包括脚下的地面）都被裁掉
      camera.near = 0.1
      camera.updateProjectionMatrix()
      attachWalkInput()
      applyWalkCamera()
    },
  }
  void midTarget
}

function exitWalkMode() {
  // 松开所有方向键，避免退出后还在走
  for (const k of Object.keys(walkKeys)) walkKeys[k] = false
  if (walkPending) {
    // 还没落地就点了返回：直接回上帝视角
    walkPending = false
    fly = null
  }
  walkMode.value = false
  emit('walk', false)
  detachWalkInput()
  if (walkSaved && controls) {
    const fromPos = camera.position.clone()
    const fromFov = camera.fov
    const fromNear = camera.near
    camera.position.copy(walkSaved.pos)
    controls.target.copy(walkSaved.target)
    camera.near = walkSaved.near || 1
    camera.fov = walkSaved.fov || (isNarrow ? 45 : 35)
    camera.updateProjectionMatrix()
    controls.enabled = true
    applyInteractionMode()
    controls.update()
    // 从第一人称位置再「拉回去」，同样不要硬切
    if (fromPos.distanceTo(camera.position) > 1) {
      const toPos = camera.position.clone()
      const toTarget = controls.target.clone()
      camera.position.copy(fromPos)
      camera.fov = fromFov
      camera.near = fromNear
      camera.updateProjectionMatrix()
      controls.enabled = false
      fly = {
        start: performance.now(),
        duration: 1400,
        fromTarget: toTarget.clone(),
        toTarget,
        fromPos,
        toPos,
        // 回程也走一道平缓弧线，别直线拔起
        arcHeight: Math.min(fromPos.distanceTo(toPos) * 0.12, 120),
        fovFrom: fromFov,
        fovTo: walkSaved.fov || (isNarrow ? 45 : 35),
        nearFrom: fromNear,
        nearTo: walkSaved.near || 1,
        onDone: () => {
          controls.enabled = true
          applyInteractionMode()
          controls.update()
        },
      }
    }
  }
  walkSaved = null
}

function holdKey(k, on) {
  if (!(k in walkKeys)) return
  walkKeys[k] = on
}

function walkForward(step) {
  const sinY = Math.sin(walkYaw)
  const cosY = Math.cos(walkYaw)
  // 朝向：(sinY, cosY) 是正前方；(cosY, -sinY) 是右手边
  let dx = 0
  let dz = 0
  if (walkKeys.w || walkKeys.up) { dx += sinY; dz += cosY }
  if (walkKeys.s || walkKeys.down) { dx -= sinY; dz -= cosY }
  if (walkKeys.d || walkKeys.right) { dx -= cosY; dz += sinY }
  if (walkKeys.a || walkKeys.left) { dx += cosY; dz -= sinY }
  // 摇杆/触屏方向键：模拟量方向 + 力度
  let strength = 1
  const len = Math.hypot(dx, dz)
  if (!len) return false
  const realStep = step * strength
  dx = (dx / len) * realStep
  dz = (dz / len) * realStep

  // 撞墙：在目标点往侧面探一圈，任何高度有实体挡住就停下（不能穿进楼里）
  if (walkBlockedAt(walkPos.x + dx, walkPos.z + dz)) return false

  // 贴地：先找地面高度，再把眼高锁在「地面 + 眼高」，不允许往上飞
  const groundY = walkGroundAt(walkPos.x + dx, walkPos.z + dz)
  const eyeY = (Number.isFinite(groundY) ? groundY : walkPos.y - WALK_EYE) + WALK_EYE
  // 不能走出校园
  const b = walkBounds
  if (b) {
    const nx = walkPos.x + dx
    const nz = walkPos.z + dz
    if (nx < b.min.x || nx > b.max.x || nz < b.min.z || nz > b.max.z) return false
  }
  walkPos.x += dx
  walkPos.z += dz
  // 直接锁死眼高，不走缓动，避免台阶/坡面把人托高
  walkPos.y = eyeY
  return true
}

/** 每帧兜底：万一地面判定漏了，也不让相机陷到地面以下 */
function clampWalkAboveGround() {
  // 近裁剪面兜底：第一人称必须贴得很近也能看见（0.1m），否则脚下地面会被裁掉
  if (Math.abs(camera.near - 0.1) > 0.001) {
    camera.near = 0.1
    camera.updateProjectionMatrix()
  }
  const g = walkGroundAt(walkPos.x, walkPos.z)
  if (!Number.isFinite(g)) return
  const minY = g + WALK_MIN_CLEAR
  if (walkPos.y < minY) walkPos.y = minY
}

/** 目标点是否被实体占住（楼、围墙、树、杆…） */
function walkBlockedAt(x, z) {
  if (!walkBlockers.length) return false
  const footY = walkPos.y - WALK_EYE
  // 楼体是空心外壳：往下打只会在室内命中地面，所以从脚底的「侧面」再打一圈，
  // 只要有人身上高度内的实体，就当成撞墙。
  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [0.707, 0.707], [0.707, -0.707], [-0.707, 0.707], [-0.707, -0.707],
  ]
  const origin = new THREE.Vector3()
  const dir = new THREE.Vector3()
  for (const [dx, dz] of dirs) {
    origin.set(x - dx * 0.9, footY + 0.95, z - dz * 0.9)
    dir.set(dx, 0, dz)
    walkRay.set(origin, dir)
    walkRay.far = 0.9
    const hit = walkRay.intersectObjects(walkBlockers, true)[0]
    if (hit) {
      // 树冠/挑檐在 0.95m 高度不该挡人，命中点在膝盖以上才算实体
      return true
    }
  }
  // 头顶再兜一次：厚地台、台阶
  walkRay.set(new THREE.Vector3(x, footY + 1.1, z), new THREE.Vector3(0, -1, 0))
  walkRay.far = 1.35
  const down = walkRay.intersectObjects(walkBlockers, true)[0]
  return Boolean(down && down.point.y > footY + 0.25)
}

if (import.meta.env.DEV) {
  // 便于调试：在控制台看第一人称状态
  window.__WALK_STATE__ = () => ({
    pos: [+walkPos.x.toFixed(2), +walkPos.y.toFixed(2), +walkPos.z.toFixed(2)],
    yaw: +walkYaw.toFixed(3),
    keys: { ...walkKeys },
    blockers: walkBlockers.length,
    bounds: walkBounds,
    canForward: walkBlockedAt(walkPos.x + Math.sin(walkYaw), walkPos.z + Math.cos(walkYaw)),
  })
}

/** 目标点下方第一个可站立面（走地面上的路面/草地，而不是楼顶） */
function walkGroundAt(x, z) {
  return walkGroundAtAt(x, z, walkPos.y)
}

/** 在 (x,z) 处找脚下地面高度：从 refY 上方往下打，只用不高于 refY 的面 */
function walkGroundAtAt(x, z, refY) {
  if (!pickMeshes.length) return NaN
  const from = (Number.isFinite(refY) ? refY : WALK_EYE) + 60
  walkRay.set(new THREE.Vector3(x, from, z), new THREE.Vector3(0, -1, 0))
  walkRay.far = 200
  const hits = walkRay.intersectObjects(pickMeshes, true)
  const limit = (Number.isFinite(refY) ? refY : WALK_EYE + 1) - 0.05
  for (const hit of hits) {
    if (hit.point.y <= limit) return hit.point.y
  }
  // 没打到（越界/镂空）就沿用当前脚下高度
  return NaN
}

function walkLook(dx, dy) {
  walkYaw -= dx * 0.0026
  walkPitch = THREE.MathUtils.clamp(walkPitch - dy * 0.0022, -1.1, 1.1)
}

function applyWalkCamera() {
  camera.position.copy(walkPos)
  const dir = new THREE.Vector3(
    Math.sin(walkYaw) * Math.cos(walkPitch),
    Math.sin(walkPitch),
    Math.cos(walkYaw) * Math.cos(walkPitch)
  )
  camera.lookAt(walkPos.clone().add(dir))
}

let walkRaf = 0
let walkLast = 0
function walkLoop(now) {
  if (!walkMode.value) { walkRaf = 0; return }
  // 上限放宽到 0.1s：低帧率设备上不会变成「慢动作」
  const dt = walkLast ? Math.min(0.1, (now - walkLast) / 1000) : 0.016
  walkLast = now
  // 右下角左右视角键：按住期间匀速转动
  if (walkKeys.lookL) walkYaw += LOOK_SPEED * dt
  if (walkKeys.lookR) walkYaw -= LOOK_SPEED * dt
  const speed = (walkKeys.run ? 2.2 : 1) * (isCoarse ? 9 : 14) * dt * walkSpeedMul.value
  walkForward(speed)
  clampWalkAboveGround()
  applyWalkCamera()
  walkRaf = requestAnimationFrame(walkLoop)
}

function onWalkKeyDown(e) {
  const k = e.key.toLowerCase()
  const map = { w: 'w', a: 'a', s: 's', d: 'd', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', shift: 'run', j: 'lookL', k: 'lookR' }
  if (map[k]) {
    walkKeys[map[k]] = true
    e.preventDefault()
  }
  // E：调出/收起右侧工具卡片
  if (k === 'e') {
    dockOpen.value = !dockOpen.value
    e.preventDefault()
  }
  if (k === 'escape') exitWalkMode()
}
function onWalkKeyUp(e) {
  const k = e.key.toLowerCase()
  // J / K：左右转视角（与右下角两个键一致），松开即停
  const map = { w: 'w', a: 'a', s: 's', d: 'd', arrowup: 'up', arrowdown: 'down', arrowleft: 'left', arrowright: 'right', shift: 'run', j: 'lookL', k: 'lookR' }
  if (map[k]) walkKeys[map[k]] = false
}

function attachWalkInput() {
  window.addEventListener('keydown', onWalkKeyDown)
  window.addEventListener('keyup', onWalkKeyUp)
  if (renderer?.domElement) {
    renderer.domElement.addEventListener('pointerdown', onWalkDragStart)
  }
  walkLast = 0
  if (!walkRaf) walkRaf = requestAnimationFrame(walkLoop)
}

function detachWalkInput() {
  window.removeEventListener('keydown', onWalkKeyDown)
  window.removeEventListener('keyup', onWalkKeyUp)
  if (renderer?.domElement) {
    renderer.domElement.removeEventListener('pointerdown', onWalkDragStart)
  }
  for (const k of Object.keys(walkKeys)) walkKeys[k] = false
  if (walkRaf) cancelAnimationFrame(walkRaf)
  walkRaf = 0
}

function onWalkDragStart(e) {
  if (!walkMode.value) return
  // 只响应左键（触屏没有 button）
  if (e.button !== undefined && e.button !== 0 && e.pointerType === 'mouse') return
  e.preventDefault()
  let lastX = e.clientX
  let lastY = e.clientY
  const move = (ev) => {
    walkLook(ev.clientX - lastX, ev.clientY - lastY)
    lastX = ev.clientX
    lastY = ev.clientY
  }
  const up = () => {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
  }
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
}

function exitMap() {
  if (!controls) return
  heroSpin = false
  flyToTarget(targetPoint.clone(), isNarrow ? 1950 : 1120, 900, 56)
  controls.enabled = false
}

function resetView() {
  if (!controls || panOnly.value) return
  const target = targetPoint.clone()
  if (!isNarrow) target.x -= 90
  flyToTarget(target, isNarrow ? 1950 : 1450, 800, isNarrow ? 52 : 48)
  controls.enabled = false
  hideFocusLabel()
}

function zoomBy(factor) {
  if (!controls || panOnly.value) return
  const dir = camera.position.clone().sub(controls.target)
  const current = dir.length()
  const next = THREE.MathUtils.clamp(current / factor, controls.minDistance, controls.maxDistance)
  dir.normalize()
  const endPos = controls.target.clone().addScaledVector(dir, next)
  endPos.y = Math.max(endPos.y, 10)
  fly = {
    start: performance.now(),
    duration: 260,
    fromTarget: controls.target.clone(),
    toTarget: controls.target.clone(),
    fromPos: camera.position.clone(),
    toPos: endPos,
  }
  controls.enabled = false
}

function applyInteractionMode() {
  if (!controls) return
  if (panOnly.value) {
    controls.enableRotate = false
    controls.enableZoom = false
    controls.enablePan = true
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.PAN,
    }
    controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.PAN,
    }
    renderer.domElement.style.cursor = 'grab'
  } else {
    controls.enableRotate = true
    controls.enableZoom = props.mapMode
    controls.enablePan = true
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    }
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    }
    renderer.domElement.style.cursor = 'grab'
  }
  controls.update()
}

function togglePanMode() {
  panOnly.value = !panOnly.value
  applyInteractionMode()
}


function onContextLost(event) {
  event.preventDefault()
  loadError.value = 'WebGL 上下文丢失，请刷新页面重试'
}

/* ------------------------------------------------------------------ */
/* 循环                                                                */
/* ------------------------------------------------------------------ */

/* ---------------- 自适应分辨率：卡的时候自动降像素比 ----------------
 * 手机 GPU 差异极大，固定 pixelRatio 要么糊要么卡。
 * 这里按实际帧时长动态调节：连续掉帧就降一档，稳定流畅再慢慢升回去。 */
let perfPr = isCoarse ? 1.4 : Math.min(window.devicePixelRatio || 1, 2)
let perfMinPr = isCoarse ? 0.75 : 1
let perfLastCheck = 0
let perfAccum = 0
let perfFrames = 0
let perfGoodStreak = 0

function tunePixelRatio(now) {
  if (!renderer) return
  if (!perfLastCheck) { perfLastCheck = now; return }
  perfAccum += now - perfLastCheck
  perfFrames += 1
  perfLastCheck = now
  if (perfAccum < 1000) return
  const avg = perfAccum / Math.max(1, perfFrames)
  perfAccum = 0
  perfFrames = 0
  // 目标 60fps：平均帧时长 > 20ms（<50fps）就降档
  if (avg > 20 && perfPr > perfMinPr) {
    perfPr = Math.max(perfMinPr, perfPr - 0.2)
    renderer.setPixelRatio(perfPr)
    perfGoodStreak = 0
  } else if (avg < 15) {
    perfGoodStreak += 1
    // 连续 4 秒都很流畅才往回升，避免来回抖
    if (perfGoodStreak >= 4 && perfPr < (isCoarse ? 1.4 : Math.min(window.devicePixelRatio || 1, 2))) {
      perfPr = Math.min(isCoarse ? 1.4 : 2, perfPr + 0.1)
      renderer.setPixelRatio(perfPr)
      perfGoodStreak = 0
    }
  } else {
    perfGoodStreak = 0
  }
}

function animate() {
  if (destroyed) return
  const now = performance.now()
  if (!visible || document.hidden) return

  if (fly) {
    updateFly(now)
  } else if (walkMode.value) {
    // 第一人称自己管相机，别让 OrbitControls 抢
  } else if (heroSpin) {
    updateHeroSpin(now)
  } else {
    clampTarget()
    controls.update()
    enforceCameraVolume()
  }

  if (label.show && labelTimer && now > labelTimer && !focusLabel && !hoverIds.size && !hoverSpatialId) {
    label.show = false
    labelTimer = 0
  }
  updateFocusLabel()
  updateAim(now)
  updateLocateGlow(now)
  tunePixelRatio(now)

  renderer.render(scene, camera)
}

function startLoop() {
  if (raf) return
  renderer.setAnimationLoop(() => {
    raf = 1
    animate()
  })
}

/* ------------------------------------------------------------------ */
/* 尺寸 / 生命周期                                                     */
/* ------------------------------------------------------------------ */

function resize() {
  if (!renderer || !host.value || !camera) return
  const box = host.value.getBoundingClientRect()
  const w = Math.max(1, box.width)
  const h = Math.max(1, box.height)
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isCoarse ? 1.5 : 2))
  renderer.setSize(w, h, false)
  // 准星开关常驻显示；但是否自动打开只由窄屏 / 触屏决定（见 onMounted）
  aimAvailable.value = true
}

onMounted(async () => {
  await nextTick()
  initRenderer()
  initScene()
  initControls()
  setOverviewCamera()
  loadModel()

  // 准星默认关闭：手机上手指直接点更直观，想要准星时按右下角按钮自己打开
  aimMode.value = false
  aimAvailable.value = true

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(root.value)

  intersectionObserver = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true
  }, { threshold: 0.01 })
  intersectionObserver.observe(root.value)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointercancel', onPointerUp)
  renderer.domElement.addEventListener('pointerleave', onPointerLeave)
  renderer.domElement.addEventListener('wheel', onWheel, { passive: false })
})

onBeforeUnmount(() => {
  destroyed = true
  if (renderer) {
    renderer.setAnimationLoop(null)
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointercancel', onPointerUp)
    renderer.domElement.removeEventListener('pointerleave', onPointerLeave)
    renderer.domElement.removeEventListener('wheel', onWheel)
    renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
  }
  resizeObserver?.disconnect()
  intersectionObserver?.disconnect()
  controls?.dispose()
  if (scene) {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of mats) m.dispose()
    })
  }
  renderer?.dispose()
})

defineExpose({
  flyToBuilding, enterMap, exitMap, resetView, zoomBy, toggleWalkMode, startHeroSpin, toggleAimMode,
  // 供 App 在「第一人称里点 3D 定位」时先切回上帝视角
  isWalking: () => walkMode.value || walkPending,
  exitWalk: () => { if (walkMode.value || walkPending) exitWalkMode() },
})
</script>

<style scoped>
:root {
  --panel-bg: rgba(255, 254, 250, 0.92);
  --panel-border: rgba(27, 67, 50, 0.1);
  --panel-shadow: 0 18px 44px -16px rgba(27, 67, 50, 0.3), 0 1px 3px rgba(27, 67, 50, 0.06);
  --panel-ease: cubic-bezier(0.32, 0.72, 0, 1);
  --pill-bg: linear-gradient(150deg, #245c43, #12372a);
  --pill-shadow: 0 6px 18px -4px rgba(27, 67, 50, 0.45);
}

.campus3d {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(120% 90% at 50% 0%, #fbf7ee 0%, #f1ebdd 42%, #e2dccb 100%);
  touch-action: none;
}
.c3d-host { position: absolute; inset: 0; }
.c3d-host :deep(canvas) { display: block; width: 100%; height: 100%; }

.c3d-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #ece6d8;
  z-index: 4;
}
.c3d-poster {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: blur(7px) saturate(0.85);
  opacity: 0.5;
  transform: scale(1.06);
}
.c3d-loading-card {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 34px;
  border-radius: 18px;
  background: rgba(255, 253, 247, 0.9);
  border: 1px solid rgba(27, 67, 50, 0.12);
  box-shadow: 0 18px 50px rgba(27, 67, 50, 0.14);
  backdrop-filter: blur(10px);
}
.c3d-spinner {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2.5px solid rgba(27, 67, 50, 0.15);
  border-top-color: #1b4332;
  animation: c3d-spin 0.9s linear infinite;
}
@keyframes c3d-spin { to { transform: rotate(360deg); } }
.c3d-loading-title {
  font-family: 'Noto Serif SC', serif;
  font-weight: 700;
  font-size: 15px;
  color: #1b4332;
}
.c3d-loading-sub { font-size: 12px; color: #7b7568; }
.c3d-retry {
  margin-top: 6px;
  padding: 7px 16px;
  border-radius: 9px;
  border: 1px solid #1b4332;
  background: #1b4332;
  color: #fff;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
}

.c3d-fade-leave-active { transition: opacity 0.6s ease; }
.c3d-fade-leave-to { opacity: 0; }

.c3d-label {
  position: absolute;
  z-index: 6;
  transform: translate(-50%, -100%);
  padding: 8px 13px;
  border-radius: 10px;
  background: rgba(255, 253, 247, 0.95);
  border: 1px solid rgba(27, 67, 50, 0.16);
  box-shadow: 0 10px 26px rgba(27, 67, 50, 0.18);
  pointer-events: none;
  white-space: nowrap;
  backdrop-filter: blur(8px);
}
.c3d-label::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -6px;
  width: 10px;
  height: 10px;
  background: rgba(255, 253, 247, 0.95);
  border-right: 1px solid rgba(27, 67, 50, 0.16);
  border-bottom: 1px solid rgba(27, 67, 50, 0.16);
  transform: translateX(-50%) rotate(45deg);
}
.c3d-label-name { font-weight: 700; font-size: 13px; color: #1b4332; }
.c3d-label-sub { font-size: 10.5px; color: #8a8374; margin-top: 1px; }

.c3d-tools {
  position: absolute;
  right: 18px;
  bottom: 64px;
  z-index: 7;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.c3d-tools button {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid rgba(27, 67, 50, 0.16);
  background: rgba(255, 253, 247, 0.9);
  color: #1b4332;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 14px rgba(27, 67, 50, 0.1);
  transition: background 0.2s, transform 0.2s;
}
.c3d-tools button:hover { background: #1b4332; color: #fff; transform: translateY(-1px); }
.c3d-tools button.active { background: #1b4332; color: #fff; border-color: #1b4332; }
.c3d-tools button.active i { color: #d4a853; }
.c3d-tools button:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.c3d-tools button:disabled:hover { background: rgba(255, 253, 247, 0.9); color: #1b4332; }

/* ============ 右侧工具卡片（与左上检索卡片同一套语言） ============ */
/* 把手钉在屏幕右边、竖直居中；卡片从把手左边向右平移收起 */
.c3d-dock {
  position: absolute;
  right: 0;
  /* 贴右下角：留出底部提示条与手机安全区 */
  bottom: 22px;
  z-index: 9;
  display: flex;
  align-items: flex-end;
  transition: opacity 0.3s ease, transform 0.3s var(--panel-ease);
}
.c3d-dock.is-hero { opacity: 0; pointer-events: none; transform: translateX(20px); }
/* 第一人称：抬到右下角「视角」控件上方，避免挡住 */
.c3d-dock.is-walk { bottom: 132px; }

.c3d-dock-body {
  width: 0;
  overflow: hidden;
  padding: 0;
  /* 收起时向右平移进把手里；展开后变回整块圆角卡（左侧圆角保持不变） */
  border-radius: 16px 0 0 16px;
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-right: none;
  box-shadow: var(--panel-shadow);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  visibility: hidden;
  pointer-events: none;
  opacity: 0;
  transform: translateX(18px);
  transition:
    width 0.44s var(--panel-ease),
    padding 0.44s var(--panel-ease),
    opacity 0.26s ease,
    transform 0.44s var(--panel-ease),
    visibility 0s linear 0.44s;
}
.c3d-dock.open .c3d-dock-body {
  width: 168px;
  padding: 12px 11px 12px 13px;
  visibility: visible;
  pointer-events: auto;
  opacity: 1;
  transform: translateX(0);
  transition:
    width 0.44s var(--panel-ease),
    padding 0.44s var(--panel-ease),
    opacity 0.26s ease 0.08s,
    transform 0.44s var(--panel-ease),
    visibility 0s linear 0s;
}

/* 小标题：不再是抢眼的衬线大字，只做分组标识 */
.c3d-dock-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: rgba(27, 67, 50, 0.42);
  margin: 0 0 8px 1px;
}
.c3d-dock-title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, rgba(27, 67, 50, 0.14), transparent);
}

/* 三连小格子：图标在上、字在下，一眼就是工具栏 */
.c3d-dock-seg {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-bottom: 9px;
}
.c3d-seg-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 2px 7px;
  border-radius: 10px;
  border: 1px solid transparent;
  background: rgba(27, 67, 50, 0.055);
  color: rgba(27, 67, 50, 0.7);
  font-size: 9.5px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s, transform 0.18s;
}
.c3d-seg-btn i { font-size: 12px; opacity: 0.9; }
.c3d-seg-btn:hover {
  background: rgba(27, 67, 50, 0.11);
  color: var(--primary);
  transform: translateY(-1px);
}
.c3d-seg-btn.active {
  background: var(--primary);
  color: #fff;
  box-shadow: 0 3px 10px -2px rgba(27, 67, 50, 0.42);
}
.c3d-seg-btn.active i { color: #f0d9a4; }

/* 放大 / 缩小 / 重置：三个等宽小方块 */
.c3d-dock-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  padding-top: 9px;
  border-top: 1px solid rgba(27, 67, 50, 0.07);
}
.c3d-dock-row button {
  height: 30px;
  border-radius: 9px;
  border: 1px solid transparent;
  background: rgba(27, 67, 50, 0.055);
  color: rgba(27, 67, 50, 0.72);
  font-size: 11px;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.c3d-dock-row button:hover { background: var(--primary); color: #fff; }
.c3d-dock-row button:disabled { opacity: 0.32; cursor: not-allowed; }
.c3d-dock-row button:disabled:hover { background: rgba(27, 67, 50, 0.055); color: rgba(27, 67, 50, 0.72); }

/* 第一人称：移动速度 */
.c3d-speed { padding-top: 9px; border-top: 1px solid rgba(27, 67, 50, 0.07); }
.c3d-speed-head {
  display: flex; align-items: center; justify-content: space-between;
  font-size: 10px; font-weight: 600; color: rgba(27, 67, 50, 0.62);
  margin-bottom: 7px;
}
.c3d-speed-head i { margin-right: 4px; font-size: 9px; opacity: 0.7; }
.c3d-speed-head em {
  font-style: normal; font-weight: 800; color: var(--primary);
  font-variant-numeric: tabular-nums; font-size: 11px;
}
.c3d-speed-range {
  width: 100%; margin: 0; height: 16px;
  accent-color: var(--primary); cursor: pointer; background: transparent;
}
.c3d-speed-ticks {
  display: flex; justify-content: space-between;
  font-size: 9px; color: rgba(27, 67, 50, 0.38); margin-top: 2px;
}

/* 侧边把手：胶囊形，挂在卡片左沿外面正中间，向右平移收起 */
.c3d-dock-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 15px;
  flex: 0 0 15px;
  height: 46px;
  align-self: flex-end;
  margin-bottom: 10px;
  padding: 0;
  margin-right: -1px;
  border: none;
  /* 卡片在右，把手凸在左边：左侧半圆、右侧贴卡片 */
  border-radius: 23px 0 0 23px;
  background: var(--pill-bg);
  color: rgba(255, 255, 255, 0.95);
  font-size: 9px;
  cursor: pointer;
  box-shadow: var(--pill-shadow);
  transition:
    width 0.28s var(--panel-ease),
    flex-basis 0.28s var(--panel-ease),
    box-shadow 0.22s ease;
}
.c3d-dock-handle:hover {
  width: 22px;
  flex-basis: 22px;
  box-shadow: 0 8px 22px -4px rgba(27, 67, 50, 0.55);
}
.c3d-dock-handle .dock-word { display: none; }

/* ============ 第一人称：移动方向盘 / 视角键 / 退出 ============ */

/* 右上角退出第一视角 */
.c3d-walk-exit {
  position: absolute;
  top: 18px;
  right: 20px;
  z-index: 12;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 15px 9px 13px;
  border-radius: 12px;
  border: none;
  background: linear-gradient(150deg, #245c43, #12372a);
  color: #fff;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
  cursor: pointer;
  box-shadow: 0 8px 22px -8px rgba(27, 67, 50, 0.75);
  transition: transform 0.16s var(--panel-ease, ease), box-shadow 0.16s ease;
}
.c3d-walk-exit i { font-size: 11.5px; color: #f0d9a4; }
.c3d-walk-exit:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 26px -8px rgba(27, 67, 50, 0.85);
}
.c3d-walk-exit:active { transform: scale(0.97); }

/* 左下：移动区（透明底板，点偏也不会拖到地图） */
.c3d-move-zone {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 10;
  width: 208px;
  padding: 12px 10px 10px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  touch-action: none;
  user-select: none;
}
.c3d-move-label,
.c3d-look-label {
  margin-bottom: 8px;
  text-align: center;
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 4px rgba(27, 67, 50, 0.7);
}

/* 圆角菱形方向盘：底板是菱形，四个键各自旋转 45° 成菱形，
   但栅格本身不转，所以「上」就在正上方。 */
.c3d-dpad {
  position: relative;
  width: 156px;
  height: 156px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  place-items: center;
}
.c3d-dpad-glow {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 118px;
  height: 118px;
  margin: -59px 0 0 -59px;
  border-radius: 30px;
  transform: rotate(45deg);
  background: rgba(255, 255, 255, 0.13);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: inset 0 0 24px rgba(255, 255, 255, 0.12);
  pointer-events: none;
}
.dp-btn {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  transform: rotate(45deg);
  border: 1px solid rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.9);
  color: #1b4332;
  font-size: 19px;
  cursor: pointer;
  box-shadow: 0 5px 16px -5px rgba(27, 67, 50, 0.6);
  touch-action: none;
  transition: background 0.12s, color 0.12s, box-shadow 0.12s;
}
/* 图标反向转回来，保持正向 */
.dp-btn i { transform: rotate(-45deg); }
.dp-up { grid-area: 1 / 2; }
.dp-left { grid-area: 2 / 1; }
.dp-down { grid-area: 3 / 2; }
.dp-right { grid-area: 2 / 3; }
.dp-btn:active {
  background: #1b4332;
  color: #f0d9a4;
  box-shadow: 0 0 0 5px rgba(240, 217, 164, 0.32);
}

/* 右下：左右视角键 */
.c3d-look-zone {
  position: absolute;
  right: 14px;
  bottom: 14px;
  z-index: 10;
  padding: 12px 14px 10px;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.32);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  touch-action: none;
  user-select: none;
}
.c3d-look-btns { display: flex; gap: 12px; }
.lk-btn {
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: rgba(255, 255, 255, 0.88);
  color: #1b4332;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 14px -4px rgba(27, 67, 50, 0.5);
  touch-action: none;
  transition: background 0.12s, color 0.12s, transform 0.1s;
}
.lk-btn:active {
  background: #1b4332;
  color: #f0d9a4;
  transform: scale(0.92);
}

.c3d-walk-tip {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 9;
  padding: 6px 13px;
  border-radius: 14px;
  background: rgba(27, 67, 50, 0.72);
  color: rgba(255, 255, 255, 0.92);
  font-size: 10.5px;
  white-space: nowrap;
  backdrop-filter: blur(6px);
  pointer-events: none;
}

/* 屏幕中心准星：手机端充当"固定鼠标"，可拖动 */
.c3d-crosshair {
  position: absolute;
  width: 46px;
  height: 46px;
  margin: -23px 0 0 -23px;
  z-index: 8;
  pointer-events: auto;
  cursor: grab;
  touch-action: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.c3d-crosshair.dragging { cursor: grabbing; }
.c3d-crosshair-ring {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1.5px solid rgba(255, 255, 255, 0.92);
  box-shadow: 0 0 0 1px rgba(27, 67, 50, 0.35), 0 2px 10px rgba(0, 0, 0, 0.25);
  animation: c3d-aim-pulse 2.4s ease-in-out infinite;
  pointer-events: none;
}
.c3d-crosshair-grip {
  position: absolute;
  right: -9px;
  bottom: -9px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(27, 67, 50, 0.9);
  color: #fff;
  font-size: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.28);
}
.c3d-crosshair.dragging .c3d-crosshair-ring { animation: none; opacity: 1; }
.c3d-crosshair-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #d4a853;
  box-shadow: 0 0 0 1.5px rgba(255, 255, 255, 0.85);
  pointer-events: none;
}
@keyframes c3d-aim-pulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.14); opacity: 0.55; }
}
@media (prefers-reduced-motion: reduce) {
  .c3d-crosshair-ring { animation: none; }
}
.c3d-aim-btn { color: #1b4332; }

.c3d-hint {
  position: absolute;
  left: 50%;
  bottom: 18px;
  transform: translateX(-50%);
  z-index: 7;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: 20px;
  background: rgba(27, 67, 50, 0.72);
  color: rgba(255, 255, 255, 0.9);
  font-size: 11.5px;
  white-space: nowrap;
  backdrop-filter: blur(6px);
  pointer-events: none;
}
.c3d-hint i { color: #d4a853; }

@media (max-width: 760px) {
  .c3d-tools { right: 12px; bottom: 70px; }
  .c3d-tools button { width: 34px; height: 34px; }
  .c3d-hint { font-size: 10.5px; padding: 6px 11px; bottom: 14px; }
  .c3d-label { padding: 7px 11px; }
  .c3d-dock-handle { width: 26px; padding: 9px 0 11px; }
  .c3d-dock.open .c3d-dock-body { width: 150px; padding: 10px 10px 12px; }
  .c3d-dock-btn { padding: 8px 9px; font-size: 11.5px; }
  /* 手机上把移动盘和视角键都放大，手指好按 */
  .c3d-move-zone { width: 186px; left: 10px; bottom: 10px; padding: 10px 8px 8px; border-radius: 20px; }
  .c3d-dpad { width: 150px; height: 150px; }
  .c3d-dpad-glow { width: 112px; height: 112px; margin: -56px 0 0 -56px; }
  .dp-btn { width: 50px; height: 50px; font-size: 18px; }
  .c3d-look-zone { right: 10px; bottom: 10px; padding: 10px 11px 8px; border-radius: 20px; }
  .lk-btn { width: 54px; height: 54px; }
  .c3d-walk-exit { top: 12px; right: 12px; padding: 8px 11px; font-size: 11.5px; }
  .c3d-walk-tip { bottom: 240px; font-size: 9.5px; padding: 5px 10px; }
  .c3d-crosshair { width: 40px; height: 40px; margin: -20px 0 0 -20px; }
}
</style>
