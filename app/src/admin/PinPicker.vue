<template>
  <div class="pin-picker">
    <div ref="host" class="pin-host"></div>
    <div class="pin-hint">
      <i class="fa-solid fa-crosshairs"></i>
      点击地面放置标记 · 拖动旋转 · 滚轮缩放
    </div>
    <div class="pin-coords">
      X {{ Number(modelValue?.x ?? 0).toFixed(1) }} · Z {{ Number(modelValue?.z ?? 0).toFixed(1) }}
    </div>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { applySimpleGrass } from '../utils/simpleGrass.js'
import { MODEL_URL } from '../modelVersion.js'

const props = defineProps({
  modelValue: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue'])

const host = ref(null)
let renderer
let scene
let camera
let controls
let marker
let plane
let resizeObserver
let raf = 0
let destroyed = false
let down = null
const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()

function setMarker(x, z, visible = true) {
  if (!marker) return
  marker.position.set(x, 0.2, z)
  marker.visible = visible
}

function init() {
  const width = host.value.clientWidth || 600
  const height = host.value.clientHeight || 320
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.touchAction = 'none'
  host.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#f1ebdd')
  camera = new THREE.PerspectiveCamera(35, width / height, 50, 5000)
  camera.position.set(760, 820, 900)
  camera.lookAt(0, 0, 0)

  const hemi = new THREE.HemisphereLight(0xfff8ea, 0x76826f, 1.4)
  scene.add(hemi)
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.6)
  sun.position.set(500, 800, 400)
  scene.add(sun)

  plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2600, 2600),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  )
  plane.rotation.x = -Math.PI / 2
  plane.position.y = 0.05
  scene.add(plane)

  marker = new THREE.Group()
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(15, 20, 40),
    new THREE.MeshBasicMaterial({ color: 0xd4a853, side: THREE.DoubleSide, transparent: true, opacity: 0.95 })
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.8
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(10, 32),
    new THREE.MeshBasicMaterial({ color: 0x1b4332, side: THREE.DoubleSide })
  )
  dot.rotation.x = -Math.PI / 2
  dot.position.y = 0.85
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(1.5, 1.5, 55, 8),
    new THREE.MeshBasicMaterial({ color: 0xd4a853, transparent: true, opacity: 0.85 })
  )
  stem.position.y = 28
  marker.add(ring, dot, stem)
  scene.add(marker)

  const v = props.modelValue
  setMarker(Number(v?.x) || 0, Number(v?.z) || 0, Boolean(v))

  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 420
  controls.maxDistance = 2200
  controls.maxPolarAngle = Math.PI / 2.15
  controls.minPolarAngle = 0.18
  controls.update()

  const loader = new GLTFLoader()
  loader.load(MODEL_URL, (gltf) => {
    if (destroyed) return
    const model = gltf.scene
    scene.add(model)
    applySimpleGrass(scene, model)
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    controls.target.copy(center)
    controls.target.y = 0
    camera.lookAt(controls.target)
    controls.update()
  })

  renderer.domElement.addEventListener('pointerdown', onDown)
  renderer.domElement.addEventListener('pointerup', onUp)
  resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(host.value)
  renderer.setAnimationLoop(loop)
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
  controls?.update()
  renderer?.render(scene, camera)
}

function onDown(event) {
  down = { x: event.clientX, y: event.clientY, t: performance.now() }
}

function onUp(event) {
  if (!down) return
  const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y)
  const elapsed = performance.now() - down.t
  down = null
  if (moved > 5 || elapsed > 700) return
  const rect = renderer.domElement.getBoundingClientRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObject(plane, false)
  if (!hits.length) return
  const p = hits[0].point
  const next = { x: Math.round(p.x * 10) / 10, z: Math.round(p.z * 10) / 10 }
  setMarker(next.x, next.z, true)
  emit('update:modelValue', next)
}

watch(() => props.modelValue, (v) => {
  setMarker(Number(v?.x) || 0, Number(v?.z) || 0, Boolean(v))
}, { deep: true })

onMounted(init)

onBeforeUnmount(() => {
  destroyed = true
  resizeObserver?.disconnect()
  renderer?.setAnimationLoop(null)
  renderer?.domElement.removeEventListener('pointerdown', onDown)
  renderer?.domElement.removeEventListener('pointerup', onUp)
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
.pin-picker {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--a-border);
  background: #f1ebdd;
}
.pin-host { width: 100%; height: 300px; }
.pin-hint {
  position: absolute;
  left: 10px;
  bottom: 10px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(27, 67, 50, 0.7);
  padding: 5px 9px;
  border-radius: 7px;
  pointer-events: none;
}
.pin-hint i { color: #d4a853; margin-right: 4px; }
.pin-coords {
  position: absolute;
  right: 10px;
  top: 10px;
  font-size: 10px;
  font-family: ui-monospace, monospace;
  color: var(--a-primary);
  background: rgba(255, 253, 248, 0.9);
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid var(--a-border);
}
</style>
