<template>
  <div class="box-backdrop">
    <div class="box-dialog">
      <div class="box-head">
        <div>
          <div class="box-title">在 3D 模型里框选位置</div>
          <div class="box-sub">框内体块会绑定到当前建筑；框内没有体块时，会在框中心生成地面标记</div>
        </div>
        <button class="a-close" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="box-toolbar">
        <div class="box-mode">
          <button :class="{ active: mode === 'orbit' }" @click="setMode('orbit')">
            <i class="fa-solid fa-arrows-up-down-left-right"></i> 旋转查看
          </button>
          <button :class="{ active: mode === 'box' }" @click="setMode('box')">
            <i class="fa-solid fa-vector-square"></i> 框选区域
          </button>
        </div>
        <div class="box-hint">
          <template v-if="mode === 'box'">按住左键拖出一个矩形，松手后计算框内建筑</template>
          <template v-else>左键旋转 · 右键平移 · 滚轮缩放</template>
        </div>
        <div class="a-spacer"></div>
        <button class="a-btn a-btn-sm" :disabled="!selection.length && !groundPoint" @click="clearSelection">
          <i class="fa-solid fa-eraser"></i> 清除
        </button>
      </div>

      <div class="box-main">
        <div ref="host" class="box-canvas" :class="{ selecting: mode === 'box' }">
          <div v-if="!ready" class="box-loading">
            <span class="a-spinner"></span>
            <span>正在加载 3D 模型…</span>
          </div>
          <div
            v-if="rect"
            class="box-rect"
            :style="{ left: rect.left + 'px', top: rect.top + 'px', width: rect.width + 'px', height: rect.height + 'px' }"
          ></div>
          <div v-if="mode === 'box'" class="box-mask-hint">框选模式 · 拖出矩形</div>
        </div>

        <aside class="box-result">
          <div class="box-result-title">框选结果</div>
          <div v-if="!selection.length && !groundPoint" class="a-empty" style="padding:24px 8px;">
            <i class="fa-solid fa-vector-square"></i>
            <p v-if="hadBinding">当前已清空选择<br />点「清除并应用」可取消这栋楼原来的绑定</p>
            <p v-else>还没有框选<br />切换到“框选区域”后拖出矩形</p>
          </div>
          <template v-else>
            <div v-if="selection.length" class="box-selected-count">
              已选中 {{ selection.length }} 个体块
            </div>
            <div class="box-selected-list">
              <div v-for="name in selection" :key="name" class="box-selected-item">
                <i class="fa-solid fa-cube"></i>
                <span>{{ name }}</span>
                <button title="移除" @click="removeObject(name)">×</button>
              </div>
            </div>
            <div v-if="groundPoint" class="box-ground">
              <div class="box-ground-title"><i class="fa-solid fa-location-dot"></i> 地面标记</div>
              <div class="box-ground-coords">X {{ groundPoint.x.toFixed(1) }} · Z {{ groundPoint.z.toFixed(1) }}</div>
              <div class="a-hint">框内没有命中体块，确认后会在该位置生成可点击的光圈。</div>
            </div>
          </template>
        </aside>
      </div>

      <div class="box-foot">
        <div class="a-hint">
          <template v-if="isEmpty && hadBinding">点「清除并应用」会取消这栋楼原有的体块绑定与地面标记。</template>
          <template v-else>确认后会写入当前建筑：体块绑定或地面标记二选一，保存建筑后前台即可点击查看。</template>
        </div>
        <div class="a-spacer"></div>
        <button class="a-btn" @click="$emit('close')">取消</button>
        <button class="a-btn a-btn-primary" :disabled="isEmpty && !hadBinding" @click="confirm">
          <i class="fa-solid fa-check"></i> {{ isEmpty && hadBinding ? '清除并应用' : '使用这个位置' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { applySimpleGrass } from '../utils/simpleGrass.js'
import { MANIFEST_URL, MODEL_URL } from '../modelVersion.js'

const props = defineProps({
  modelObjects: { type: Array, default: () => [] },
  pin: { type: Object, default: null },
})
const emit = defineEmits(['close', 'apply'])

const host = ref(null)
const ready = ref(false)
const mode = ref('orbit')
const selection = ref([])
const groundPoint = ref(null)
const rect = ref(null)
/** 打开时这栋楼本来是否已有绑定；有绑定且被清空时允许「清除并应用」 */
const hadBinding = ref(Boolean(props.modelObjects?.length || props.pin))
const isEmpty = computed(() => !selection.value.length && !groundPoint.value)

let renderer
let scene
let camera
let controls
let model
let highlightGroup
let groundPlane
let resizeObserver
let destroyed = false
let dragging = false
let startPoint = null
let objectMeta = []
let pinMarker = null
let initialTimer = null

const status = computed(() => {
  if (selection.value.length) return `已选 ${selection.value.length} 个体块`
  if (groundPoint.value) return '将生成地面标记'
  return '等待框选'
})

function setMode(next) {
  mode.value = next
  if (controls) controls.enabled = next === 'orbit'
  if (next === 'orbit') rect.value = null
}

function init() {
  const width = host.value.clientWidth
  const height = host.value.clientHeight
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.02
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.touchAction = 'none'
  host.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#f1ebdd')
  camera = new THREE.PerspectiveCamera(38, width / height, 50, 5000)
  camera.position.set(760, 820, 900)

  scene.add(new THREE.HemisphereLight(0xfff8ea, 0x76826f, 1.35))
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.8)
  sun.position.set(500, 800, 400)
  scene.add(sun)

  groundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(3000, 3000),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  )
  groundPlane.rotation.x = -Math.PI / 2
  groundPlane.position.y = 0.08
  scene.add(groundPlane)

  highlightGroup = new THREE.Group()
  scene.add(highlightGroup)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 300
  controls.maxDistance = 2600
  controls.maxPolarAngle = Math.PI / 2.1
  controls.target.set(0, 0, 0)
  controls.enabled = true
  controls.update()

  pinMarker = new THREE.Group()
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(14, 19, 36),
    new THREE.MeshBasicMaterial({ color: 0xd4a853, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.9
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(9, 28),
    new THREE.MeshBasicMaterial({ color: 0x1b4332, side: THREE.DoubleSide, transparent: true, opacity: 0.9 })
  )
  disc.rotation.x = -Math.PI / 2
  disc.position.y = 0.95
  pinMarker.add(ring, disc)
  pinMarker.visible = false
  scene.add(pinMarker)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointerleave', onPointerLeave)
  renderer.setAnimationLoop(loop)

  loadModel()

  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host.value)
}

function loadModel() {
  const loader = new GLTFLoader()
  loader.load(MODEL_URL, async (gltf) => {
    if (destroyed) return
    model = gltf.scene
    model.updateMatrixWorld(true)
    scene.add(model)
    applySimpleGrass(scene, model)

    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    center.y = 0
    controls.target.copy(center)
    camera.lookAt(center)
    setOverview(center)
    controls.update()

    let manifest = []
    try {
      const res = await fetch(MANIFEST_URL)
      const data = await res.json()
      manifest = data.objects || []
    } catch {
      manifest = []
    }
    objectMeta = []
    for (const item of manifest) {
      // 只允许建筑体块、门岗、小建筑、连廊和运动场地；广场/道路/绿化不参与框选
      if (!/^(楼|追加楼|拱门|门\d|小建筑|连廊|篮球场|排球场|网球场|运动场|棒球笼|外卖柜)/.test(item.name)) continue
      const obj = model.getObjectByName(item.name)
      if (!obj) continue
      const b = new THREE.Box3().setFromObject(obj)
      const c = b.getCenter(new THREE.Vector3())
      objectMeta.push({ name: item.name, box: b, center: c })
    }
    ready.value = true
  })
}

function setOverview(center) {
  camera.position.set(center.x + 520, 620, center.z + 700)
  controls.target.copy(center)
  controls.update()
}

function resize() {
  if (!renderer || !host.value) return
  const w = host.value.clientWidth
  const h = host.value.clientHeight
  camera.aspect = w / h
  camera.updateProjectionMatrix()
  renderer.setSize(w, h, false)
}

function loop() {
  if (destroyed) return
  controls.update()
  renderer.render(scene, camera)
}

function onPointerDown(event) {
  if (mode.value !== 'box' || event.button !== 0) return
  const rectBox = renderer.domElement.getBoundingClientRect()
  dragging = true
  startPoint = { x: event.clientX - rectBox.left, y: event.clientY - rectBox.top, left: rectBox.left, top: rectBox.top }
  rect.value = { left: startPoint.x, top: startPoint.y, width: 0, height: 0 }
  renderer.domElement.setPointerCapture?.(event.pointerId)
}

function onPointerMove(event) {
  if (!dragging || !startPoint) return
  const rectBox = renderer.domElement.getBoundingClientRect()
  const x = event.clientX - rectBox.left
  const y = event.clientY - rectBox.top
  rect.value = {
    left: Math.min(startPoint.x, x),
    top: Math.min(startPoint.y, y),
    width: Math.abs(x - startPoint.x),
    height: Math.abs(y - startPoint.y),
  }
}

function onPointerUp(event) {
  if (!dragging) return
  dragging = false
  if (renderer.domElement.hasPointerCapture?.(event.pointerId)) {
    renderer.domElement.releasePointerCapture(event.pointerId)
  }
  const r = rect.value
  if (!r || r.width < 10 || r.height < 10) {
    rect.value = null
    return
  }
  const allowed = ['building', 'court']
  const selected = []
  const canvasRect = renderer.domElement.getBoundingClientRect()
  const w = canvasRect.width
  const h = canvasRect.height
  for (const item of objectMeta) {
    const p = item.center.clone().project(camera)
    if (p.z > 1) continue
    let hit = false
    const sx = (p.x * 0.5 + 0.5) * w
    const sy = (-p.y * 0.5 + 0.5) * h
    if (sx >= r.left && sx <= r.left + r.width && sy >= r.top && sy <= r.top + r.height) {
      hit = true
    }
    if (!hit) {
      const b = item.box
      const corners = [
        [b.min.x, b.min.y, b.min.z], [b.max.x, b.min.y, b.min.z],
        [b.min.x, b.max.y, b.min.z], [b.max.x, b.max.y, b.min.z],
        [b.min.x, b.min.y, b.max.z], [b.max.x, b.min.y, b.max.z],
        [b.min.x, b.max.y, b.max.z], [b.max.x, b.max.y, b.max.z],
      ]
      for (const [x, y, z] of corners) {
        const v = new THREE.Vector3(x, y, z).project(camera)
        if (v.z > 1) continue
        const px = (v.x * 0.5 + 0.5) * w
        const py = (-v.y * 0.5 + 0.5) * h
        if (px >= r.left && px <= r.left + r.width && py >= r.top && py <= r.top + r.height) {
          hit = true
          break
        }
      }
    }
    if (hit) selected.push(item.name)
  }
  selection.value = selected
  if (selected.length) {
    groundPoint.value = null
    pinMarker.visible = false
    drawHighlights()
  } else {
    const hit = groundPointAt(r.left + r.width / 2, r.top + r.height / 2, w, h)
    groundPoint.value = hit
    if (hit) {
      pinMarker.position.set(hit.x, 0, hit.z)
      pinMarker.visible = true
    }
    drawHighlights()
  }
  rect.value = r
}

function onPointerLeave() {
  if (dragging) {
    dragging = false
    rect.value = null
  }
}

function groundPointAt(x, y, w, h) {
  const raycaster = new THREE.Raycaster()
  const ndc = new THREE.Vector2((x / w) * 2 - 1, -(y / h) * 2 + 1)
  raycaster.setFromCamera(ndc, camera)
  const hits = raycaster.intersectObject(groundPlane, false)
  if (!hits.length) return null
  return { x: Math.round(hits[0].point.x * 10) / 10, z: Math.round(hits[0].point.z * 10) / 10 }
}

function drawHighlights() {
  while (highlightGroup.children.length) {
    const child = highlightGroup.children[0]
    highlightGroup.remove(child)
    if (child.geometry) child.geometry.dispose()
    if (child.material) child.material.dispose()
  }
  for (const name of selection.value) {
    const item = objectMeta.find((x) => x.name === name)
    if (!item) continue
    const helper = new THREE.Box3Helper(item.box.clone(), 0xd4a853)
    helper.material.transparent = true
    helper.material.opacity = 0.95
    highlightGroup.add(helper)
  }
}

function removeObject(name) {
  selection.value = selection.value.filter((x) => x !== name)
  if (!selection.value.length) {
    groundPoint.value = null
    pinMarker.visible = false
  }
  drawHighlights()
}

function clearSelection() {
  selection.value = []
  groundPoint.value = null
  pinMarker.visible = false
  rect.value = null
  drawHighlights()
}

function confirm() {
  if (selection.value.length) {
    emit('apply', { modelObjects: [...selection.value], pin: null })
  } else if (groundPoint.value) {
    emit('apply', { modelObjects: [], pin: { ...groundPoint.value } })
  } else if (hadBinding.value) {
    // 主动清空：把绑定与地面标记一起取消
    emit('apply', { modelObjects: [], pin: null, cleared: true })
  } else {
    emit('close')
  }
}

watchInitialSelection()

function watchInitialSelection() {
  // 初始已有的绑定在模型加载后显示为框选结果，便于确认/重选
  initialTimer = setInterval(() => {
    if (destroyed) {
      clearInterval(initialTimer)
      return
    }
    if (!ready.value) return
    clearInterval(initialTimer)
    if (props.modelObjects?.length) {
      selection.value = props.modelObjects.filter((name) => objectMeta.some((x) => x.name === name))
      drawHighlights()
    } else if (props.pin) {
      groundPoint.value = { x: props.pin.x, z: props.pin.z }
      pinMarker.position.set(props.pin.x, 0, props.pin.z)
      pinMarker.visible = true
    }
  }, 120)
}

onMounted(init)

onBeforeUnmount(() => {
  destroyed = true
  clearInterval(initialTimer)
  resizeObserver?.disconnect()
  renderer?.setAnimationLoop(null)
  renderer?.domElement.removeEventListener('pointerdown', onPointerDown)
  renderer?.domElement.removeEventListener('pointermove', onPointerMove)
  renderer?.domElement.removeEventListener('pointerup', onPointerUp)
  renderer?.domElement.removeEventListener('pointerleave', onPointerLeave)
  controls?.dispose()
  if (scene) {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose()
    })
  }
  renderer?.dispose()
})
</script>

<style scoped>
.box-backdrop {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: rgba(14, 26, 20, 0.55);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}
.box-dialog {
  width: min(1240px, 97vw);
  height: min(850px, 94vh);
  background: var(--a-card);
  border-radius: 18px;
  border: 1px solid var(--a-border);
  box-shadow: 0 40px 100px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.box-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid var(--a-bg-deep);
}
.box-title { font-family: 'Noto Serif SC', serif; font-size: 18px; font-weight: 900; color: var(--a-primary); }
.box-sub { font-size: 11px; color: var(--a-muted); margin-top: 2px; }
.box-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 16px;
  border-bottom: 1px solid var(--a-bg-deep);
  flex-wrap: wrap;
}
.box-mode { display: inline-flex; background: var(--a-bg); border: 1px solid var(--a-border); border-radius: 9px; padding: 2px; }
.box-mode button {
  padding: 6px 11px;
  border: none;
  background: transparent;
  border-radius: 7px;
  font-size: 11px;
  color: var(--a-muted);
  cursor: pointer;
}
.box-mode button.active { background: var(--a-primary); color: #fff; }
.box-hint { font-size: 10.5px; color: var(--a-muted); }
.box-main { flex: 1; display: flex; min-height: 0; }
.box-canvas { position: relative; flex: 1; min-width: 0; background: #f1ebdd; overflow: hidden; }
.box-canvas.selecting { cursor: crosshair; }
.box-canvas :deep(canvas) { display: block; }
.box-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 5;
  color: var(--a-muted);
  font-size: 12px;
  background: #f1ebdd;
}
.box-rect {
  position: absolute;
  border: 1.5px dashed var(--a-accent);
  background: rgba(212, 168, 83, 0.16);
  pointer-events: none;
  z-index: 4;
}
.box-mask-hint {
  position: absolute;
  left: 12px;
  bottom: 12px;
  z-index: 3;
  padding: 5px 9px;
  border-radius: 7px;
  background: rgba(27, 67, 50, 0.72);
  color: #fff;
  font-size: 10px;
  pointer-events: none;
}
.box-result {
  width: 270px;
  flex-shrink: 0;
  border-left: 1px solid var(--a-bg-deep);
  background: #fdfbf6;
  padding: 14px;
  overflow-y: auto;
}
.box-result-title { font-size: 11px; font-weight: 700; color: var(--a-muted); letter-spacing: 0.05em; margin-bottom: 9px; }
.box-selected-count { font-size: 11.5px; font-weight: 700; color: var(--a-primary); margin-bottom: 7px; }
.box-selected-list { display: flex; flex-direction: column; gap: 4px; }
.box-selected-item { display: flex; align-items: center; gap: 7px; padding: 7px 9px; border-radius: 7px; background: var(--a-bg); border: 1px solid var(--a-border); font-size: 10.5px; }
.box-selected-item i { color: var(--a-accent); font-size: 10px; }
.box-selected-item span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.box-selected-item button { border: none; background: none; color: var(--a-muted); cursor: pointer; font-size: 13px; }
.box-selected-item button:hover { color: var(--a-danger); }
.box-ground { margin-top: 12px; padding: 10px; border: 1px dashed var(--a-border); border-radius: 8px; background: #fff; }
.box-ground-title { font-size: 11px; font-weight: 700; color: var(--a-primary); }
.box-ground-coords { font-family: ui-monospace, monospace; font-size: 10.5px; color: var(--a-muted); margin: 4px 0; }
.box-foot {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 18px;
  border-top: 1px solid var(--a-bg-deep);
  background: var(--a-card);
}
@media (max-width: 800px) {
  .box-dialog { height: 95vh; }
  .box-main { flex-direction: column; }
  .box-result { width: 100%; max-height: 180px; border-left: none; border-top: 1px solid var(--a-bg-deep); }
  .box-hint { display: none; }
}
</style>
