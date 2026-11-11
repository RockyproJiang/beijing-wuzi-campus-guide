<template>
  <div class="sp-backdrop">
    <div class="sp-dialog">
      <div class="sp-head">
        <div>
          <div class="sp-title">3D 区域与表面位置</div>
          <div class="sp-sub">{{ buildingName || '当前建筑' }} · 可添加多个平地多边形和模型表面位置</div>
        </div>
        <button class="a-close" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="sp-tabs">
        <button :class="{ active: tab === 'region' }" @click="switchTab('region')">
          <i class="fa-solid fa-draw-polygon"></i> 平地 3D 区域
        </button>
        <button :class="{ active: tab === 'surface' }" @click="switchTab('surface')">
          <i class="fa-solid fa-location-crosshairs"></i> 模型表面位置
        </button>
        <button :class="{ active: tab === 'face' }" @click="switchTab('face')">
          <i class="fa-solid fa-square-full"></i> 选整块楼面
        </button>
        <button :class="{ active: tab === 'half' }" @click="switchTab('half')">
          <i class="fa-solid fa-table-columns"></i> 选半栋
        </button>
        <div class="sp-mode">
          <template v-if="tab === 'region'">
            <button :class="{ active: mode === 'view' }" @click="setMode('view')"><i class="fa-solid fa-hand"></i> 浏览</button>
            <button :class="{ active: mode === 'draw' }" @click="setMode('draw')"><i class="fa-solid fa-vector-square"></i> 框选平地</button>
            <button :class="{ active: mode === 'edit' }" @click="setMode('edit')"><i class="fa-solid fa-pen-nib"></i> 编辑顶点</button>
          </template>
          <template v-else-if="tab === 'face'">
            <button :class="{ active: mode === 'face' }" @click="setMode('face')"><i class="fa-solid fa-crosshairs"></i> 选楼面</button>
            <button :class="{ active: mode === 'view' }" @click="setMode('view')"><i class="fa-solid fa-hand"></i> 浏览</button>
          </template>
          <template v-else-if="tab === 'half'">
            <button :class="{ active: mode === 'half' }" @click="setMode('half')"><i class="fa-solid fa-crop-simple"></i> 选半栋</button>
            <button :class="{ active: mode === 'view' }" @click="setMode('view')"><i class="fa-solid fa-hand"></i> 浏览</button>
          </template>
          <template v-else>
            <button :class="{ active: mode === 'surface' }" @click="setMode('surface')"><i class="fa-solid fa-crosshairs"></i> 点击表面添加</button>
            <button :class="{ active: mode === 'view' }" @click="setMode('view')"><i class="fa-solid fa-hand"></i> 浏览</button>
          </template>
        </div>
      </div>

      <div class="sp-main">
        <div ref="host" class="sp-canvas" :class="'mode-' + mode">
          <div v-if="loading" class="sp-loading"><span class="a-spinner"></span> 加载 3D 模型…</div>
          <div class="sp-hint">
            <template v-if="tab === 'region' && mode === 'draw'">按住左键拖出一个矩形，松手创建区域；之后拖动金色顶点调整形状</template>
            <template v-else-if="tab === 'region' && mode === 'edit'">拖动金色顶点；在右侧可以加顶点、删顶点、改高度</template>
            <template v-else-if="tab === 'face'">把鼠标移到楼体外墙或屋顶上，绿色框会自动圈出整块共面矩形，单击即可贴上去</template>
            <template v-else-if="tab === 'half'">把鼠标移到楼体外墙上，大楼会被竖着切成两块；两块在右侧分别勾选、改名、调刀口角度</template>
            <template v-else-if="tab === 'surface'">
              <template v-if="selectedSurface && (selectedSurface.shape === 'rect' || selectedSurface.source === 'half')">
                拖动贴片可移动 · 拖四角拉动大小 · 按 X / Y / Z 切换贴片所在平面 · 右侧可精确改数值
              </template>
              <template v-else>点击模型表面添加位置/贴片；右侧可改名称、说明、半径</template>
            </template>
            <template v-else>左键旋转 · 右键平移 · 滚轮缩放；点击区域可选中</template>
          </div>
        </div>

        <aside class="sp-panel">
          <template v-if="tab === 'region'">
            <div class="sp-panel-head">
              <span>平地区域（{{ regions.length }}）</span>
              <button class="a-btn a-btn-sm" @click="startDraw"><i class="fa-solid fa-plus"></i> 新建</button>
            </div>
            <div class="sp-list">
              <button
                v-for="region in regions"
                :key="region.id"
                class="sp-list-item"
                :class="{ active: selectedRegionId === region.id }"
                @click="selectRegion(region.id)"
              >
                <span class="sp-swatch" :style="{ background: '#D4A853' }"></span>
                <span class="sp-list-name">{{ region.name }}</span>
                <span class="sp-list-meta">{{ region.shape === 'box' ? '方块' : region.points.length + ' 点' }}</span>
              </button>
              <div v-if="!regions.length" class="a-empty" style="padding:20px 6px;">
                <i class="fa-solid fa-draw-polygon"></i>
                <p>还没有平地区域<br />点“新建”后在地面拖一个矩形</p>
              </div>
            </div>

            <div class="sp-box-bar">
              <label class="sp-box-toggle">
                <input v-model="drawAsBox" type="checkbox" />
                <span>画成立体方块</span>
              </label>
              <label v-if="drawAsBox" class="sp-box-height">
                高度
                <input v-model.number="boxHeight" class="a-input" type="number" min="1" max="200" step="1" />
                m
              </label>
            </div>

            <template v-if="selectedRegion">
              <div class="sp-fields">
                <div class="a-hint" style="margin-bottom:10px;padding:8px 10px;border-radius:8px;background:rgba(216,243,220,0.45);">
                  区域在网站里是<strong>完全透明</strong>的：平时看不见，鼠标移上去会像点建筑一样亮起并显示这栋建筑的名称。这里只填大小和位置。
                </div>
                <label class="a-field">
                  <span class="a-label">内部名称（只在这里显示，方便你区分）</span>
                  <input v-model="selectedRegion.name" class="a-input" />
                </label>
                <div class="sp-row">
                  <label class="a-field">
                    <span class="a-label">起始高度 Y</span>
                    <input v-model.number="selectedRegion.baseY" class="a-input" type="number" min="-50" max="200" step="0.2" />
                  </label>
                  <label class="a-field">
                    <span class="a-label">高度/厚度</span>
                    <input v-model.number="selectedRegion.height" class="a-input" type="number" min="0" max="200" step="0.2" />
                  </label>
                </div>
                <div class="sp-vertices-head">
                  <span>顶点（{{ selectedRegion.points.length }}）</span>
                  <button class="a-btn a-btn-sm" @click="addVertex">加点</button>
                </div>
                <div class="sp-vertex-list">
                  <div v-for="(point, i) in selectedRegion.points" :key="i" class="sp-vertex-row">
                    <span class="sp-vertex-index">{{ i + 1 }}</span>
                    <input v-model.number="point.x" class="a-input" type="number" step="1" />
                    <input v-model.number="point.z" class="a-input" type="number" step="1" />
                    <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" :disabled="selectedRegion.points.length <= 3" @click="removeVertex(i)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
                <button class="a-btn a-btn-sm a-btn-danger" style="margin-top:8px;" @click="deleteRegion">
                  <i class="fa-solid fa-trash"></i> 删除这个区域
                </button>
              </div>
            </template>
          </template>

          <template v-else-if="tab === 'half'">
              <div class="sp-panel-head">
                <span>半栋切线（{{ cutList.length }} 条 / {{ halfPairs.length }} 个切块）</span>
              </div>
              <div class="a-hint" style="padding:0 4px 8px;">
                先在楼体外墙上单击生成一条切线，再拖动「切线角度 / 切线位置」把它挪到想要的地方；
                然后选「绑定哪一侧」——被绑定的那半能被点中并高亮，另一半留空不可点。
              </div>

              <div v-if="!cutList.length" class="a-empty" style="padding:16px 6px;">
                <i class="fa-solid fa-scissors"></i>
                <p>还没有切线<br />把鼠标移到楼体上单击即可添加</p>
              </div>

              <div
                v-for="(cut, ci) in cutList"
                :key="cut.id"
                class="sp-half-group"
                :class="{ dim: !cut.bound }"
              >
                <div class="sp-half-titlerow">
                  <span class="sp-half-title">切线 {{ ci + 1 }}</span>
                  <span class="sp-half-tools">
                    <button class="sp-focus-btn" title="把相机移到这个切面" @click="focusCut(cut)">
                      <i class="fa-solid fa-crosshairs"></i> 聚焦
                    </button>
                    <button class="a-btn a-btn-sm a-btn-danger" title="删除这条切线与切块" @click="deleteCut(cut)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </span>
                </div>

                <div class="sp-cut-angle">
                  <button class="sp-half-btn" :class="{ active: Math.abs(cut.angle) < 1 }" @click="setCutAngle(cut, 0)">竖向</button>
                  <button class="sp-half-btn" :class="{ active: Math.abs(cut.angle - 90) < 1 }" @click="setCutAngle(cut, 90)">横向</button>
                </div>
                <label class="a-field">
                  <span class="a-label">切线角度 {{ Math.round(cut.angle) }}°</span>
                  <input class="a-input" type="range" min="-90" max="90" step="1" :value="cut.angle" @input="setCutAngle(cut, Number($event.target.value))" />
                </label>
                <label class="a-field">
                  <span class="a-label">切线位置 {{ Number(cut.offset).toFixed(1) }} 米</span>
                  <input class="a-input" type="range" min="-40" max="40" step="0.5" :value="cut.offset" @input="setCutOffset(cut, Number($event.target.value))" />
                </label>

                <div class="sp-bind-row">
                  <span class="a-label">绑定的那一半</span>
                  <div class="sp-bind-btns">
                    <button class="sp-half-btn" :class="{ active: cut.bound === 'pos' }" @click="bindCut(cut, 'pos')">正向</button>
                    <button class="sp-half-btn" :class="{ active: cut.bound === 'neg' }" @click="bindCut(cut, 'neg')">反向</button>
                    <button class="sp-half-btn" :class="{ active: !cut.bound }" @click="bindCut(cut, '')">都不绑定</button>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="tab === 'face'">
              <div class="sp-panel-head">
                <span>楼面贴片（{{ surfacePoints.length }}）</span>
                <button class="a-btn a-btn-sm" @click="setMode('face')"><i class="fa-solid fa-plus"></i> 新选</button>
              </div>
            <div class="sp-list">
              <button
                v-for="point in surfacePoints"
                :key="point.id"
                class="sp-list-item"
                :class="{ active: selectedSurfaceId === point.id }"
                @click="selectSurface(point.id)"
              >
                <span class="sp-swatch" :style="{ background: point.color }"></span>
                <span class="sp-list-name">{{ point.name }}</span>
                <span class="sp-list-meta">{{ point.shape === 'poly' ? '整面' : 'r' + point.radius }}</span>
              </button>
              <div v-if="!surfacePoints.length" class="a-empty" style="padding:20px 6px;">
                <i class="fa-solid fa-square-full"></i>
                <p>还没有楼面贴片<br />把鼠标移到墙上，绿框出现后单击</p>
              </div>
            </div>
            <div class="a-hint" style="padding:0 4px;">
              选中后在右侧「整面调整」里改尺寸、位置、旋转，也可以直接在画布上拖拽/拉角点。
            </div>
          </template>

          <template v-else>
            <div class="sp-panel-head">
              <span>表面位置（{{ surfacePoints.length }}）</span>
              <button class="a-btn a-btn-sm" @click="setMode('surface')"><i class="fa-solid fa-plus"></i> 添加</button>
            </div>
            <div class="sp-list">
              <button
                v-for="point in surfacePoints"
                :key="point.id"
                class="sp-list-item"
                :class="{ active: selectedSurfaceId === point.id }"
                @click="selectSurface(point.id)"
              >
                <span class="sp-swatch" :style="{ background: point.color }"></span>
                <span class="sp-list-name">{{ point.name }}</span>
                <span class="sp-list-meta">r{{ point.radius }}</span>
              </button>
              <div v-if="!surfacePoints.length" class="a-empty" style="padding:20px 6px;">
                <i class="fa-solid fa-location-crosshairs"></i>
                <p>还没有表面位置<br />点“添加”后点击墙面或屋顶</p>
              </div>
            </div>

            <template v-if="selectedSurface">
              <div class="sp-fields">
                <label class="a-field">
                  <span class="a-label">位置名称</span>
                  <input v-model="selectedSurface.name" class="a-input" />
                </label>
                <label class="a-field">
                  <span class="a-label">说明（悬停显示）</span>
                  <textarea v-model="selectedSurface.desc" class="a-textarea" rows="2"></textarea>
                </label>
                <div class="sp-row" style="grid-template-columns:1fr 1fr;">
                  <label class="a-field">
                    <span class="a-label">贴片形状</span>
                    <select v-model="selectedSurface.shape" class="a-input">
                      <option value="circle">圆形</option>
                      <option value="rect">矩形 / 楼面</option>
                      <option value="poly">多边形（自定义）</option>
                    </select>
                  </label>
                  <label class="a-field">
                    <span class="a-label">颜色</span>
                    <input v-model="selectedSurface.color" class="a-input" type="color" />
                  </label>
                </div>

                <!-- 整块楼面 / 半栋：尺寸 · 位置 · 旋转 · 刀口 -->
                <template v-if="selectedSurface.shape === 'rect' || selectedSurface.source === 'half'">
                  <div class="sp-sec">
                    尺寸与旋转
                    <button class="sp-focus-btn" title="把相机移到这块贴片正面" @click="focusSelected">
                      <i class="fa-solid fa-crosshairs"></i> 聚焦
                    </button>
                  </div>
                  <div class="sp-row">
                    <label class="a-field">
                      <span class="a-label">宽（米）</span>
                      <input
                        class="a-input" type="number" step="0.5" min="0.2" max="400"
                        :value="surfaceSize.width"
                        @input="setSurfaceSize('width', $event.target.value)"
                      />
                    </label>
                    <label class="a-field">
                      <span class="a-label">高（米）</span>
                      <input
                        class="a-input" type="number" step="0.5" min="0.2" max="400"
                        :value="surfaceSize.height"
                        @input="setSurfaceSize('height', $event.target.value)"
                      />
                    </label>
                  </div>
                  <label class="a-field">
                    <span class="a-label">旋转 {{ Math.round(Number(selectedSurface.rot) || 0) }}°（面内）</span>
                    <input
                      class="a-input" type="range" min="-180" max="180" step="1"
                      :value="Number(selectedSurface.rot) || 0"
                      @input="selectedSurface.rot = Number($event.target.value)"
                    />
                  </label>

                  <div class="sp-sec">位置（贴着墙面的平面内）</div>
                  <div class="sp-row">
                    <label class="a-field">
                      <span class="a-label">左右偏移 U</span>
                      <input
                        class="a-input" type="number" step="0.5"
                        :value="surfaceOffset.u"
                        @input="setSurfaceOffset('u', $event.target.value)"
                      />
                    </label>
                    <label class="a-field">
                      <span class="a-label">上下偏移 V</span>
                      <input
                        class="a-input" type="number" step="0.5"
                        :value="surfaceOffset.v"
                        @input="setSurfaceOffset('v', $event.target.value)"
                      />
                    </label>
                  </div>
                  <div class="a-hint">
                    也可以在画布上直接拖动贴片移动、拖角点改大小；按 X / Y 键切换贴片所在平面。
                  </div>
                  <div class="sp-row">
                    <label class="a-field">
                      <span class="a-label">世界坐标 X</span>
                      <input class="a-input" type="number" step="1" :value="selectedSurface.position.x" @input="setSurfaceWorld('x', $event.target.value)" />
                    </label>
                    <label class="a-field">
                      <span class="a-label">世界坐标 Y</span>
                      <input class="a-input" type="number" step="1" :value="selectedSurface.position.y" @input="setSurfaceWorld('y', $event.target.value)" />
                    </label>
                    <label class="a-field">
                      <span class="a-label">世界坐标 Z</span>
                      <input class="a-input" type="number" step="1" :value="selectedSurface.position.z" @input="setSurfaceWorld('z', $event.target.value)" />
                    </label>
                  </div>

                  <div class="sp-sec">把贴片贴到哪个平面</div>
                  <div class="sp-planegrid">
                    <button class="sp-plane-btn" :class="{ active: currentPlane === 'x' }" @click="setSurfacePlane('x')">
                      <i class="fa-solid fa-arrows-left-right"></i> 侧墙（X 平面）
                    </button>
                    <button class="sp-plane-btn" :class="{ active: currentPlane === 'z' }" @click="setSurfacePlane('z')">
                      <i class="fa-solid fa-arrows-up-down"></i> 正墙（Z 平面）
                    </button>
                    <button class="sp-plane-btn" :class="{ active: currentPlane === 'y' }" @click="setSurfacePlane('y')">
                      <i class="fa-solid fa-arrows-up-down-left-right"></i> 屋顶 / 地面（Y 平面）
                    </button>
                  </div>

                  <!-- 刀口：只对半栋生效 -->
                  <template v-if="selectedSurface.source === 'half' || selectedSurface.cut">
                    <div class="sp-sec">刀口（把楼切成两块）</div>
                    <div class="sp-half-grid">
                      <button class="sp-half-btn" :class="{ active: cutAngle === 0 }" @click="cutAngle = 0">竖向切</button>
                      <button class="sp-half-btn" :class="{ active: cutAngle === 90 }" @click="cutAngle = 90">横向切</button>
                    </div>
                    <label class="a-field" style="margin-top:6px;">
                      <span class="a-label">刀口角度 {{ Math.round(cutAngle) }}°</span>
                      <input class="a-input" type="range" min="-90" max="90" step="1" :value="cutAngle" @input="cutAngle = Number($event.target.value)" />
                    </label>
                    <label class="a-field">
                      <span class="a-label">刀口偏移 {{ cutOffset.toFixed(1) }} 米</span>
                      <input
                        class="a-input" type="range"
                        :min="-(halfExtent)" :max="halfExtent" step="0.25"
                        :value="cutOffset"
                        @input="cutOffset = Number($event.target.value)"
                      />
                    </label>
                    <div class="a-hint">拖动刀口可以重新分配两块的大小；两块各自独立显示、独立勾选。</div>
                  </template>
                </template>

                <div v-if="selectedSurface.shape === 'circle'" class="a-hint" style="padding-top:4px;">
                  <label class="a-field">
                    <span class="a-label">贴片半径</span>
                    <input v-model.number="selectedSurface.radius" class="a-input" type="number" min="0.5" max="200" step="1" />
                  </label>
                </div>
                <div v-if="selectedSurface.shape === 'poly'" class="sp-vertices-head">
                  <span>轮廓点（{{ (selectedSurface.points || []).length }}，单位：贴片平面内的米）</span>
                  <button class="a-btn a-btn-sm" @click="addSurfaceVertex">加点</button>
                </div>
                <div v-if="selectedSurface.shape === 'poly'" class="sp-vertex-list">
                  <div v-for="(point, i) in (selectedSurface.points || [])" :key="i" class="sp-vertex-row">
                    <span class="sp-vertex-index">{{ i + 1 }}</span>
                    <input v-model.number="point.x" class="a-input" type="number" step="1" />
                    <input v-model.number="point.z" class="a-input" type="number" step="1" />
                    <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" :disabled="(selectedSurface.points || []).length <= 3" @click="removeSurfaceVertex(i)">
                      <i class="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </div>
                <button class="a-btn a-btn-sm a-btn-danger" style="margin-top:8px;" @click="deleteSurface">
                  <i class="fa-solid fa-trash"></i> 删除这个位置
                </button>
              </div>
            </template>
          </template>
        </aside>
      </div>

      <div class="sp-foot">
        <div class="a-hint">确认后只写入当前编辑表单，还需要点“保存”才会写入数据库。</div>
        <div class="a-spacer"></div>
        <button class="a-btn" @click="$emit('close')">取消</button>
        <button class="a-btn a-btn-primary" @click="confirm"><i class="fa-solid fa-check"></i> 使用这些区域</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { applySimpleGrass } from '../utils/simpleGrass.js'
import { MODEL_URL } from '../modelVersion.js'
import { patchRect, patchSize } from '../utils/surfacePatch.js'

const props = defineProps({
  regions: { type: Array, default: () => [] },
  surfacePoints: { type: Array, default: () => [] },
  buildingName: { type: String, default: '' },
})
const emit = defineEmits(['close', 'apply'])

const host = ref(null)
const loading = ref(true)
const tab = ref('region')
const mode = ref('view')
const regions = ref(clone(props.regions))
const surfacePoints = ref(clone(props.surfacePoints))
const selectedRegionId = ref(regions.value[0]?.id || '')
const selectedSurfaceId = ref(surfacePoints.value[0]?.id || '')

const selectedRegion = computed(() => regions.value.find((r) => r.id === selectedRegionId.value) || null)
const selectedSurface = computed(() => surfacePoints.value.find((p) => p.id === selectedSurfaceId.value) || null)

let renderer
let scene
let camera
let controls
let model
let modelMeshes = []
let regionGroup
let surfaceGroup
let previewLine
let destroyed = false
let resizeObserver
let raf = 0
let down = null
let drawStart = null
let draggingVertex = null
let needRebuild = false
let hoverFaceMesh = null

const raycaster = new THREE.Raycaster()
const pointer = new THREE.Vector2()
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.15)

function clone(value) {
  return JSON.parse(JSON.stringify(value || []))
}

function uid(prefix) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
}

function setMode(next) {
  mode.value = next
  if (controls) controls.enabled = next === 'view'
  if (next !== 'draw') clearPreview()
  if (next !== 'face' && next !== 'half') clearFaceHover()
}

function switchTab(next) {
  tab.value = next
  if (next === 'region') setMode('view')
  else if (next === 'half') setMode('half')
  else if (next === 'face') setMode('face')
  else setMode('surface')
  clearPreview()
}

/* ---------------- 选楼面：把一个三角面扩展成整块共面矩形 ---------------- */
const faceNormal = new THREE.Vector3()
const faceOrigin = new THREE.Vector3()
let faceHover = null // { mesh, key, quad }
let singleFaceQuad = null // 「选半栋」时用来限定单面范围
let halfBox = null // 当前点击到的楼体包围盒（世界坐标）
const halfKind = ref('x') // x = 竖向刀口（左右切），y = 横向刀口（上下切）
const drawAsBox = ref(true) // 框选平地时默认做成立体方块
const boxHeight = ref(8) // 立体方块默认高度（米）

function clearFaceHover() {
  if (hoverFaceMesh) {
    scene.remove(hoverFaceMesh)
    hoverFaceMesh.geometry.dispose()
    hoverFaceMesh.material.dispose()
    hoverFaceMesh = null
  }
  faceHover = null
}

function planeKey(normal, origin) {
  const n = `${Math.round(normal.x * 20)},${Math.round(normal.y * 20)},${Math.round(normal.z * 20)}`
  const d = (Math.round(normal.dot(origin) * 10) / 10).toFixed(1)
  return `${n}|${d}`
}

/**
 * 从命中的三角形出发，找同一网格上「共面 + 同朝向」的所有三角面，
 * 在面平面内建立 2D 坐标（u 向右、v 向上），再用 AABB 拼出一个矩形。
 */
function collectFaceQuad(mesh, faceIndex, singleTri = false) {
  const geo = mesh.geometry
  const pos = geo.getAttribute('position')
  if (!pos) return null
  const index = geo.getIndex()
  const triCount = index ? index.count / 3 : pos.count / 3
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(mesh.matrixWorld)
  const triNormal = (t) => {
    const ia = index ? index.getX(t * 3) : t * 3
    const ib = index ? index.getX(t * 3 + 1) : t * 3 + 1
    const ic = index ? index.getX(t * 3 + 2) : t * 3 + 2
    const a = new THREE.Vector3().fromBufferAttribute(pos, ia).applyMatrix4(mesh.matrixWorld)
    const b = new THREE.Vector3().fromBufferAttribute(pos, ib).applyMatrix4(mesh.matrixWorld)
    const c = new THREE.Vector3().fromBufferAttribute(pos, ic).applyMatrix4(mesh.matrixWorld)
    return { a, b, c, n: new THREE.Vector3().subVectors(c, b).cross(new THREE.Vector3().subVectors(a, b)).normalize() }
  }
  const seed = triNormal(faceIndex)
  if (!seed) return null
  const n = seed.n.clone()
  faceNormal.copy(n)
  faceOrigin.copy(seed.a)

  // 面内基向量
  const up = new THREE.Vector3(0, 1, 0)
  let ref = Math.abs(n.y) > 0.9 ? new THREE.Vector3(0, 0, 1) : up
  const right = new THREE.Vector3().crossVectors(ref, n).normalize()
  const vAxis = new THREE.Vector3().crossVectors(n, right).normalize()

  const target = planeKey(n, seed.a)
  let umin = Infinity, umax = -Infinity, vmin = Infinity, vmax = -Infinity
  let found = 0
  const nm = normalMatrix // 保留挂形参，避免未使用告警
  void nm
  const scan = singleTri ? [faceIndex] : Array.from({ length: triCount }, (_, k) => k)
  for (const t of scan) {
    const tri = triNormal(t)
    if (!tri) continue
    if (tri.n.dot(n) < 0.995) continue
    if (planeKey(tri.n, tri.a) !== target) continue
    found++
    for (const p of [tri.a, tri.b, tri.c]) {
      const rel = p.clone().sub(seed.a)
      const u = rel.dot(right)
      const v = rel.dot(vAxis)
      if (u < umin) umin = u
      if (u > umax) umax = u
      if (v < vmin) vmin = v
      if (v > vmax) vmax = v
    }
  }
  if (!found) return null

  // 最近允许整个面偏小（细长构件），给个下限
  const w = umax - umin
  const h = vmax - vmin
  if (w < 0.5 || h < 0.5) return null

  // 局部坐标 → 世界坐标的四个角（按逆时针）
  const corner = (u, v) => seed.a.clone().addScaledVector(right, u).addScaledVector(vAxis, v)
  const quads = [corner(umin, vmin), corner(umax, vmin), corner(umax, vmax), corner(umin, vmax)]

  return {
    key: `${mesh.uuid}:${target}:${umin.toFixed(2)},${umax.toFixed(2)},${vmin.toFixed(2)},${vmax.toFixed(2)}`,
    normal: n.clone(),
    center: quads.reduce((acc, p) => acc.add(p), new THREE.Vector3()).multiplyScalar(0.25),
    corners: quads,
    right: right.clone(),
    up: vAxis.clone(),
    width: w,
    height: h,
    triangles: found,
    meshName: mesh.name || '(未命名)',
  }
}

function quadToSurface(quad, label = '墙面') {
  const halfW = quad.width / 2
  const halfH = quad.height / 2
  const pts = [
    { x: round(-halfW), z: round(-halfH) },
    { x: round(halfW), z: round(-halfH) },
    { x: round(halfW), z: round(halfH) },
    { x: round(-halfW), z: round(halfH) },
  ]
  // 贴片的面内 UP 轴（世界坐标），前后端靠它在运行时重建矩形
  const uAxis = quad.up ? { x: round(quad.up.x, 4), y: round(quad.up.y, 4), z: round(quad.up.z, 4) } : undefined
  return {
    id: uid('s'),
    name: `${label} ${surfacePoints.value.length + 1}`,
    desc: '',
    position: {
      x: round(quad.center.x),
      y: round(quad.center.y),
      z: round(quad.center.z),
    },
    normal: { x: round(quad.normal.x, 3), y: round(quad.normal.y, 3), z: round(quad.normal.z, 3) },
    uAxis,
    radius: Math.max(1, Math.round(Math.min(quad.width, quad.height) / 2)),
    shape: 'poly',
    width: round(quad.width),
    height: round(quad.height),
    size: { width: round(quad.width), height: round(quad.height) },
    rot: 0,
    points: pts,
    color: '#D4A853',
  }
}

/** 把一条共面矩形直接变成「可调尺寸 / 位置 / 旋转」的贴片对象 */
function quadToPatch(quad, source, label) {
  const item = quadToSurface(quad, label)
  item.source = source
  item.shape = 'rect'
  item.size = { width: round(quad.width), height: round(quad.height) }
  delete item.points
  return item
}

/**
 * 「选半栋」：给贴片配一把可以调方向的刀，把整块楼面竖着切开。
 * 不再有「左/右/上/下」八个固定选项——刀口角度和偏移都可以调，
 * 一刀切出两块，两块各自有颜色、各自能单独勾选。
 */
const HALF_KINDS = [
  { id: 'x', label: '横切（竖向）', angle: 0 },
  { id: 'y', label: '纵切（横向）', angle: 90 },
]

/** 从选中项里读刀口参数（缺省给一套合理值） */
const cutAngle = computed({
  get: () => Number(selectedSurface.value?.cut?.angle) || 0,
  set: (v) => {
    const s = selectedSurface.value
    if (!s) return
    if (!s.cut) s.cut = defaultCut(s)
    s.cut.angle = Number(v) || 0
  },
})
const cutOffset = computed({
  get: () => Number(selectedSurface.value?.cut?.offset) || 0,
  set: (v) => {
    const s = selectedSurface.value
    if (!s) return
    if (!s.cut) s.cut = defaultCut(s)
    s.cut.offset = Number(v) || 0
  },
})

function defaultCut(surface) {
  return { angle: 0, offset: 0, mode: 'split' }
}

/** 编辑时在场景里给选中贴片画两块预览框（绿=正侧，蓝=负侧） */
let halfPreview = null
function clearHalfPreview() {
  if (!halfPreview) return
  scene.remove(halfPreview)
  halfPreview.traverse?.((o) => {
    o.geometry?.dispose?.()
    o.material?.dispose?.()
  })
  halfPreview = null
}

function updateFaceHover(event) {
  if (!scene) return
  ndc(event)
  raycaster.setFromCamera(pointer, camera)
  const hits = raycaster.intersectObjects(modelMeshes, false)
  const hit = hits.find((h) => h.face)
  if (!hit) { clearFaceHover(); return }
  const quad = collectFaceQuad(hit.object, hit.faceIndex, mode.value === 'half')
  if (!quad) { clearFaceHover(); return }
  if (mode.value === 'half') halfBox = new THREE.Box3().setFromObject(hit.object)
  if (faceHover?.key === quad.key && faceHover?.halfKind === halfKind.value) return
  clearFaceHover()
  faceHover = { ...quad, mesh: hit.object, halfKind: mode.value === 'half' ? halfKind.value : '' }
  drawHoverQuad(mode.value === 'half' ? subQuadByAngle(quad, halfPreviewAngle.value) : quad)
}

/** 悬停预览：按当前「横切/纵切」预演刀口位置（不落地，只是绿色高亮） */
const halfPreviewAngle = ref(0)
function subQuadByAngle(quad, angle) {
  if (!quad) return quad
  const halfW = quad.width / 2
  const halfH = quad.height / 2
  const a = (Number(angle) || 0) * Math.PI / 180
  const alongU = Math.abs(Math.sin(a)) > Math.abs(Math.cos(a))
  // 45° 之外就当成横切/纵切，预览取正侧那一半
  const left = alongU ? 0 : -halfW
  const right = alongU ? halfW : 0
  const bottom = -halfH
  const top = halfH
  const p = (u, v) => quad.center.clone().addScaledVector(quad.right, u).addScaledVector(quad.up, v)
  const corners = [p(left, bottom), p(right, bottom), p(right, top), p(left, top)]
  return {
    ...quad,
    corners,
    center: corners.reduce((a2, c) => a2.add(c), new THREE.Vector3()).multiplyScalar(0.25),
    width: right - left,
    height: top - bottom,
  }
}

function drawHoverQuad(quad) {
  const geo = new THREE.BufferGeometry().setFromPoints([
    quad.corners[0], quad.corners[1], quad.corners[2], quad.corners[3], quad.corners[0],
  ])
  const line = new THREE.Line(
    geo,
    new THREE.LineBasicMaterial({ color: 0x2f9e6f, depthTest: false, transparent: true, opacity: 1 })
  )
  line.renderOrder = 999
  hoverFaceMesh = line
  scene.add(line)
}

/** 切换横切/纵切时要重画绿框 */
watch(halfKind, (id) => {
  const k = HALF_KINDS.find((h) => h.id === id)
  halfPreviewAngle.value = k ? k.angle : 0
  if (mode.value !== 'half' || !faceHover) return
  const base = faceHover.baseQuad || faceHover
  faceHover.baseQuad = base
  const sub = subQuadByAngle(base, halfPreviewAngle.value)
  if (!sub) return
  const oldKey = faceHover.key
  faceHover = { ...sub, mesh: faceHover.mesh, baseQuad: base, halfKind: id, key: `${oldKey}:${id}` }
  if (hoverFaceMesh) {
    scene.remove(hoverFaceMesh)
    hoverFaceMesh.geometry.dispose()
    hoverFaceMesh.material.dispose()
  }
  drawHoverQuad(sub)
})

function init() {
  const width = host.value.clientWidth || 800
  const height = host.value.clientHeight || 500
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.03
  renderer.domElement.style.width = '100%'
  renderer.domElement.style.height = '100%'
  renderer.domElement.style.display = 'block'
  renderer.domElement.style.touchAction = 'none'
  host.value.appendChild(renderer.domElement)

  scene = new THREE.Scene()
  scene.background = new THREE.Color('#f1ebdd')
  camera = new THREE.PerspectiveCamera(38, width / height, 50, 5000)
  camera.position.set(620, 720, 820)
  scene.add(new THREE.HemisphereLight(0xfff8ea, 0x76826f, 1.35))
  const sun = new THREE.DirectionalLight(0xfff2dc, 1.7)
  sun.position.set(500, 800, 400)
  scene.add(sun)

  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 60
  controls.maxDistance = 2800
  controls.maxPolarAngle = Math.PI / 2.08
  controls.enabled = true

  regionGroup = new THREE.Group()
  surfaceGroup = new THREE.Group()
  scene.add(regionGroup, surfaceGroup)

  previewLine = new THREE.Line(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0xd4a853, transparent: true, opacity: 0.95 })
  )
  previewLine.visible = false
  scene.add(previewLine)

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
  new GLTFLoader().load(MODEL_URL, (gltf) => {
    if (destroyed) return
    model = gltf.scene
    model.updateMatrixWorld(true)
    scene.add(model)
    applySimpleGrass(scene, model)
    modelMeshes = []
    model.traverse((o) => {
      if (o.isMesh && o.visible) modelMeshes.push(o)
    })
    const box = new THREE.Box3().setFromObject(model)
    const center = box.getCenter(new THREE.Vector3())
    center.y = 0
    controls.target.copy(center)
    camera.position.set(center.x + 560, 680, center.z + 760)
    controls.update()
    loading.value = false
    rebuild()
  }, undefined, () => { loading.value = false })
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
  keepHandlesConstant()
  renderer.render(scene, camera)
}

/** 顶点 / 角点按屏幕像素固定大小：拉近拉远都是同一个尺寸，太大挡视线、太小点不中都不合适 */
const HANDLE_PX = 6          // 平地多边形的小黄点
const CORNER_PX = 7          // 楼面/半栋四角的小方块
const SURFACE_DOT_PX = 5     // 贴片中心的圆点
function keepHandlesConstant() {
  if (!regionGroup || !camera) return
  const h = renderer.domElement.clientHeight || 1
  const worldPerPx =
    (2 * Math.tan((camera.fov * Math.PI) / 360) * camera.position.distanceTo(controls.target)) / h

  const r = HANDLE_PX * worldPerPx
  for (const o of regionGroup.children) {
    if (!o.userData.isHandle) continue
    if (o.userData.isHitPad) {
      // 热区至少比看得见的小球大一点，保证好点中
      o.scale.setScalar(Math.max(1, (r * 1.6) / 4.5))
    } else {
      o.scale.setScalar(Math.max(0.01, r / 1.5))
    }
  }

  const c = CORNER_PX * worldPerPx
  const d = SURFACE_DOT_PX * worldPerPx
  for (const o of surfaceGroup.children) {
    if (o.userData.isCornerHandle) {
      o.scale.setScalar(Math.max(0.01, c))
      // 手柄本身压在半墙上会只剩一条边，往外挪半个身位，让它整个露在墙面外
      if (o.userData.basePos && o.userData.handleNormal) {
        o.position.copy(o.userData.basePos).addScaledVector(o.userData.handleNormal, c * 0.5)
      }
    } else if (o.userData.isSurfaceDot) {
      o.scale.setScalar(Math.max(0.01, d))
    }
  }
}

/* ---------------- 区域 ---------------- */

function disposeGroup(group) {
  while (group.children.length) {
    const child = group.children[0]
    group.remove(child)
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

function rebuild() {
  if (!scene) return
  disposeGroup(regionGroup)
  disposeGroup(surfaceGroup)

  for (const region of regions.value) {
    if (!Array.isArray(region.points) || region.points.length < 3) continue
    const selected = region.id === selectedRegionId.value
    // 编辑器里仍然要看得见、能点中：用固定的半透明金色 + 选中更亮
    // （网站前台这些区域是完全透明的，颜色/透明度字段已废弃）
    const color = new THREE.Color(selected ? '#D4A853' : '#8FA68E')
    const baseY = Number(region.baseY)
    const y0 = Number.isFinite(baseY) ? baseY : 0.9
    const height = Math.max(0.05, Number(region.height) || 0.6)
    const idleOpacity = 0.22
    const hotOpacity = 0.5
    const shape = shapeFromPoints(region.points)
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height,
      bevelEnabled: false,
      curveSegments: 1,
    })
    geometry.rotateX(-Math.PI / 2)
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: selected ? hotOpacity : idleOpacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    )
    mesh.position.y = y0
    mesh.userData.regionId = region.id
    regionGroup.add(mesh)

    // 立体方块：额外补一套棱边，让它在远处也能被一眼认出是个盒子
    if (region.shape === 'box') {
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry, 18),
        new THREE.LineBasicMaterial({ color: selected ? 0xffd36e : 0x8a6a2f, transparent: true, opacity: 0.95 })
      )
      edges.position.y = y0
      edges.userData.regionId = region.id
      regionGroup.add(edges)
    }

    const outlinePoints = region.points.map((p) => new THREE.Vector3(p.x, y0 + height + 0.05, p.z))
    outlinePoints.push(outlinePoints[0].clone())
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(outlinePoints),
      new THREE.LineBasicMaterial({ color: selected ? 0xffd36e : 0x8a6a2f, transparent: true, opacity: 0.95 })
    )
    line.userData.regionId = region.id
    regionGroup.add(line)

    if (selected) {
      region.points.forEach((p, index) => {
        // 看得见的小黄点
        const handle = new THREE.Mesh(
          new THREE.SphereGeometry(1.5, 14, 12),
          new THREE.MeshBasicMaterial({ color: 0xffd36e })
        )
        handle.position.set(p.x, y0 + height + 1.2, p.z)
        handle.userData.regionId = region.id
        handle.userData.vertexIndex = index
        handle.userData.isHandle = true
        regionGroup.add(handle)

        // 隐形热区：点起来不费劲，但画面上看不出来
        const hit = new THREE.Mesh(
          new THREE.SphereGeometry(4.5, 8, 6),
          new THREE.MeshBasicMaterial({ visible: false })
        )
        hit.position.copy(handle.position)
        hit.userData.regionId = region.id
        hit.userData.vertexIndex = index
        hit.userData.isHandle = true
        hit.userData.isHitPad = true
        regionGroup.add(hit)
      })
    }
  }

  clearHalfPreview()

  for (const point of surfacePoints.value) {
    if (point.enabled === false) continue
    const selected = point.id === selectedSurfaceId.value
    const color = new THREE.Color(point.color || '#D4A853')
    const pos = new THREE.Vector3(point.position.x, point.position.y, point.position.z)
    const normal = new THREE.Vector3(point.normal.x, point.normal.y, point.normal.z).normalize()
    const radius = Math.max(1, Number(point.radius) || 10)
    const isRect = point.shape === 'rect'
    const { w: width, h: height } = patchSize(point)
    const polyPts = Array.isArray(point.points) ? point.points : []
    const isPoly = point.shape === 'poly' && polyPts.length >= 3

    // 统一走 patchRect：矩形/半栋都按「中心+法线+UP轴+尺寸+旋转+刀口」重建
    const rect = isPoly ? null : patchRect(point)
    let geometry
    let quaternion
    let worldPos
    if (rect) {
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
      // ShapeGeometry 在 XY 平面，把它转到贴片所在的平面坐标系
      const m = new THREE.Matrix4().makeBasis(rect.right, rect.up, new THREE.Vector3().crossVectors(rect.right, rect.up))
      geometry.applyMatrix4(m)
      quaternion = new THREE.Quaternion()
      worldPos = pos.clone().addScaledVector(normal, 0.25)
    } else {
      geometry = new THREE.CircleGeometry(radius, 36)
      quaternion = new THREE.Quaternion().setFromRotationMatrix(
        new THREE.Matrix4().lookAt(new THREE.Vector3(), normal.clone().negate(), new THREE.Vector3(0, 1, 0))
      )
      worldPos = pos.clone().addScaledVector(normal, 0.25)
    }

    const patch = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: selected ? 0.62 : 0.42, side: THREE.DoubleSide, depthWrite: false })
    )
    patch.position.copy(worldPos)
    patch.quaternion.copy(quaternion)
    patch.userData.surfaceId = point.id
    surfaceGroup.add(patch)

    if (isRect || rect) {
      const border = new THREE.LineSegments(
        new THREE.EdgesGeometry(geometry),
        new THREE.LineBasicMaterial({ color: selected ? 0xffd36e : 0xffffff, transparent: true, opacity: 0.9 })
      )
      border.position.copy(patch.position)
      border.quaternion.copy(patch.quaternion)
      surfaceGroup.add(border)
    } else if (isPoly) {
      const linePoints = polyPts.map((p) => new THREE.Vector3(Number(p.x) || 0, -(Number(p.z) || 0), 0))
      linePoints.push(linePoints[0].clone())
      const border = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(linePoints),
        new THREE.LineBasicMaterial({ color: selected ? 0xffd36e : 0xffffff, transparent: true, opacity: 0.9 })
      )
      border.position.copy(patch.position)
      border.quaternion.copy(patch.quaternion)
      surfaceGroup.add(border)
    } else {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(radius * 0.92, radius, 40),
        new THREE.MeshBasicMaterial({ color: selected ? 0xffd36e : 0xffffff, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false })
      )
      ring.position.copy(patch.position)
      ring.quaternion.copy(patch.quaternion)
      surfaceGroup.add(ring)
    }

    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 10),
      new THREE.MeshBasicMaterial({ color: selected ? 0xffd36e : color, transparent: true, opacity: 0.6 })
    )
    dot.position.copy(pos).addScaledVector(normal, 1.2)
    dot.userData.surfaceId = point.id
    dot.userData.isSurfaceDot = true
    surfaceGroup.add(dot)

    // 选中整面 / 半栋时，在四个角放可拖的方块，直接拉大拉小
    if (selected && rect && mode.value === 'surface') {
      const marks = [
        { u: -1, v: -1 }, { u: 1, v: -1 }, { u: 1, v: 1 }, { u: -1, v: 1 },
      ]
      const hw = rect.width / 2
      const hh = rect.height / 2
      for (const m of marks) {
        const handle = new THREE.Mesh(
          new THREE.BoxGeometry(1, 1, 1),
          new THREE.MeshBasicMaterial({ color: 0xffd36e })
        )
        handle.position.copy(rect.center)
          .addScaledVector(rect.right, m.u * hw)
          .addScaledVector(rect.up, m.v * hh)
        handle.userData.isSurfaceHandle = true
        handle.userData.isCornerHandle = true
        handle.userData.corner = m
        handle.userData.handleNormal = normal.clone()
        handle.userData.basePos = handle.position.clone()
        handle.renderOrder = 997
        surfaceGroup.add(handle)
      }
    }
  }

  // 选中「半栋」时，把另一半也标出来，方便看刀口在哪
  const sel = selectedSurface.value
  if (sel && sel.source === 'half') drawHalfPreview(sel)
}

/** 选中半栋时，用一条加粗的绿色虚线画出刀口线 */
function drawHalfPreview(surface) {
  if (!scene) return
  const rect = patchRect(surface)
  const a = (Number(surface.cut?.angle) || 0) * Math.PI / 180
  const off = Number(surface.cut?.offset) || 0
  const dirU = Math.sin(a)
  const dirV = Math.cos(a)
  const half = Math.hypot(rect.width, rect.height) / 2 + 1
  const c = rect.center
  const p1 = c.clone().addScaledVector(rect.right, dirU * half + Math.cos(a) * off)
    .addScaledVector(rect.up, dirV * half - Math.sin(a) * off)
  const p2 = c.clone().addScaledVector(rect.right, -dirU * half + Math.cos(a) * off)
    .addScaledVector(rect.up, -dirV * half - Math.sin(a) * off)
  const line = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([p1, p2]),
    new THREE.LineDashedMaterial({ color: 0xffd36e, dashSize: 3, gapSize: 2, transparent: true, opacity: 0.95, depthTest: false })
  )
  line.computeLineDistances()
  line.renderOrder = 998
  halfPreview = new THREE.Group()
  halfPreview.add(line)
  scene.add(halfPreview)
}

function selectRegion(id) {
  selectedRegionId.value = id
  if (tab.value !== 'region') tab.value = 'region'
  rebuild()
}

function startDraw() {
  setMode('draw')
  tab.value = 'region'
}

function addVertex() {
  const region = selectedRegion.value
  if (!region) return
  let best = 0
  let bestLen = -1
  for (let i = 0; i < region.points.length; i++) {
    const a = region.points[i]
    const b = region.points[(i + 1) % region.points.length]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len > bestLen) { bestLen = len; best = i }
  }
  const a = region.points[best]
  const b = region.points[(best + 1) % region.points.length]
  region.points.splice(best + 1, 0, { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 })
  rebuild()
}

function removeVertex(index) {
  const region = selectedRegion.value
  if (!region || region.points.length <= 3) return
  region.points.splice(index, 1)
  rebuild()
}

function deleteRegion() {
  if (!selectedRegion.value) return
  regions.value = regions.value.filter((r) => r.id !== selectedRegionId.value)
  selectedRegionId.value = regions.value[0]?.id || ''
  rebuild()
}

function selectSurface(id) {
  selectedSurfaceId.value = id
  const target = surfacePoints.value.find((p) => p.id === id)
  // 点的是半栋，就留在「选半栋」页，方便调刀口
  tab.value = target?.source === 'half' ? 'half' : 'surface'
  rebuild()
}

function deleteSurface() {
  if (!selectedSurface.value) return
  surfacePoints.value = surfacePoints.value.filter((p) => p.id !== selectedSurfaceId.value)
  selectedSurfaceId.value = surfacePoints.value[0]?.id || ''
  rebuild()
}

/* 多边形贴片：在贴片自身平面内加/删顶点（x 向右、z 向上，单位米） */
function addSurfaceVertex() {
  const s = selectedSurface.value
  if (!s) return
  if (!Array.isArray(s.points)) s.points = []
  const pts = s.points
  if (!pts.length) {
    const w = Math.max(1, Number(s.width) || 20) / 2
    const h = Math.max(1, Number(s.height) || 12) / 2
    pts.push({ x: -w, z: -h }, { x: w, z: -h }, { x: w, z: h }, { x: -w, z: h })
    rebuild()
    return
  }
  let best = 0
  let bestLen = -1
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    const len = Math.hypot(b.x - a.x, b.z - a.z)
    if (len > bestLen) { bestLen = len; best = i }
  }
  const a = pts[best]
  const b = pts[(best + 1) % pts.length]
  pts.splice(best + 1, 0, { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 })
  rebuild()
}

function removeSurfaceVertex(index) {
  const s = selectedSurface.value
  if (!s || !Array.isArray(s.points) || s.points.length <= 3) return
  s.points.splice(index, 1)
  rebuild()
}

/* ---------------- 贴片参数编辑（尺寸 / 位置 / 旋转 / 刀口 / 配对） ---------------- */

const surfaceSize = computed(() => {
  const s = selectedSurface.value
  if (!s) return { width: 20, height: 12 }
  return patchSize(s)
})

/** 当前贴片所在的平面（按法线主轴判定） */
const currentPlane = computed(() => {
  const n = selectedSurface.value?.normal
  if (!n) return 'z'
  const ax = Math.abs(Number(n.x) || 0)
  const ay = Math.abs(Number(n.y) || 0)
  const az = Math.abs(Number(n.z) || 0)
  if (ay >= ax && ay >= az) return 'y'
  if (ax >= az) return 'x'
  return 'z'
})

/** 贴片中心相对「它原本贴着的那面」的偏移（U 左右 / V 上下） */
const surfaceOffset = computed(() => {
  const s = selectedSurface.value
  if (!s) return { u: 0, v: 0 }
  const rect = patchRect(s)
  const c = new THREE.Vector3(s.position.x, s.position.y, s.position.z)
  if (!s.anchor) return { u: 0, v: 0 }
  const rel = c.clone().sub(new THREE.Vector3(s.anchor.x, s.anchor.y, s.anchor.z))
  return { u: round(rel.dot(rect.right), 1), v: round(rel.dot(rect.up), 1) }
})

function setSurfaceSize(key, value) {
  const s = selectedSurface.value
  if (!s) return
  const v = Math.max(0.2, Math.min(400, Number(value) || 0))
  if (!s.size) s.size = { ...surfaceSize.value }
  s.size[key] = v
  s.width = s.size.width
  s.height = s.size.height
  rebuild()
}

/** 调整中心：沿面内 U/V 移动，保持贴片贴在同一个平面上 */
function setSurfaceOffset(key, value) {
  const s = selectedSurface.value
  if (!s) return
  if (!s.anchor) s.anchor = { ...s.position }
  const rect = patchRect(s)
  const cur = surfaceOffset.value
  const next = { u: cur.u, v: cur.v }
  next[key] = round(Number(value) || 0)
  const base = new THREE.Vector3(s.anchor.x, s.anchor.y, s.anchor.z)
  const p = base.clone().addScaledVector(rect.right, next.u).addScaledVector(rect.up, next.v)
  s.position = { x: round(p.x), y: round(p.y), z: round(p.z) }
  rebuild()
}

function setSurfaceWorld(key, value) {
  const s = selectedSurface.value
  if (!s) return
  s.position = { ...s.position, [key]: round(Number(value) || 0) }
  s.anchor = { ...s.position }
  rebuild()
}

/** 切换贴片所在的平面（换朝向），保留贴片大小 */
function setSurfacePlane(plane) {
  const s = selectedSurface.value
  if (!s) return
  const n = plane === 'x' ? { x: -1, y: 0, z: 0 } : plane === 'y' ? { x: 0, y: 1, z: 0 } : { x: 0, y: 0, z: -1 }
  s.normal = n
  s.rot = 0
  s.anchor = { ...s.position }
  rebuild()
}

/** 属于同一对（一次「选半栋」切出来的两块）的所有贴片 */
function surfacePairOf(surface) {
  if (!surface) return []
  if (!surface.group) return [surface]
  return surfacePoints.value.filter((p) => p.group === surface.group)
}

const halfPairs = computed(() => {
  const seen = new Set()
  const out = []
  for (const p of surfacePoints.value) {
    if (p.source !== 'half') continue
    if (p.group) {
      if (seen.has(p.group)) continue
      seen.add(p.group)
      out.push(surfacePoints.value.filter((x) => x.group === p.group))
    } else {
      out.push([p])
    }
  }
  return out
})

/** 「选半栋」里的切线列表：每条切线 = 一对切块（正侧 + 负侧），带角度/位置/绑定侧 */
const cutList = computed(() =>
  halfPairs.value.map((pair) => {
    const pos = pair.find((p) => p.cut?.side !== 'neg') || pair[0]
    const neg = pair.find((p) => p.cut?.side === 'neg') || null
    const bound = pos.enabled !== false && neg?.enabled !== false ? null : pos.enabled !== false ? 'pos' : neg?.enabled !== false ? 'neg' : ''
    return {
      id: pos.group || pos.id,
      angle: Number(pos.cut?.angle) || 0,
      offset: Number(pos.cut?.offset) || 0,
      bound,
      pos,
      neg,
      pair,
    }
  })
)

/** 改切线角度：两侧同步（负侧仍用 side 标记，patchRect 会自动翻转法线） */
function setCutAngle(cut, angle) {
  for (const p of cut.pair) {
    if (!p.cut) p.cut = { angle: 0, offset: 0, mode: 'split' }
    p.cut.angle = Number(angle) || 0
  }
  rebuild()
}

function setCutOffset(cut, offset) {
  for (const p of cut.pair) {
    if (!p.cut) p.cut = { angle: 0, offset: 0, mode: 'split' }
    p.cut.offset = Number(offset) || 0
  }
  rebuild()
}

/** 绑定哪一半：被绑定的一侧参与拾取并高亮，另一侧完全放空 */
function bindCut(cut, side) {
  if (cut.pos) cut.pos.enabled = side === 'pos'
  if (cut.neg) cut.neg.enabled = side === 'neg'
  selectedSurfaceId.value = side === 'neg' ? cut.neg?.id || '' : cut.pos?.id || ''
  rebuild()
}

function focusCut(cut) {
  if (cut.pos) focusPatch(cut.pos)
}

function deleteCut(cut) {
  const ids = new Set(cut.pair.map((p) => p.id))
  surfacePoints.value = surfacePoints.value.filter((p) => !ids.has(p.id))
  if (ids.has(selectedSurfaceId.value)) selectedSurfaceId.value = ''
  rebuild()
}

const selectedHalfPair = computed(() => {
  const s = selectedSurface.value
  if (!s || s.source !== 'half') return null
  return surfacePairOf(s)
})

function halfTitle(pair) {
  const first = pair[0]?.name || '楼体'
  return first.replace(/\s*[（(].*?[)）]\s*$/, '').replace(/[·\-\s]*(主|副)$/, '') || '楼体'
}

function halfPairVisible(pair) {
  return pair.some((p) => p.enabled !== false)
}

function toggleHalf(half) {
  half.enabled = half.enabled === false
  rebuild()
}

/** 把相机挪到选中贴片的正前方，方便近距离看贴片是否正确 */
function focusSelected() {
  const s = selectedSurface.value
  if (!s) return
  focusPatch(s)
}

function focusPair(pair) {
  if (pair?.[0]) focusPatch(pair[0])
}

function focusPatch(s) {
  if (!camera || !controls) return
  const rect = patchRect(s)
  const n = rect.normal.clone().normalize()
  const span = Math.max(rect.width, rect.height, 4)
  const dist = Math.max(14, span * 1.6)
  controls.target.copy(rect.quadCenter)
  camera.position.copy(rect.quadCenter).addScaledVector(n, dist)
  camera.near = 0.5
  camera.far = 5000
  camera.updateProjectionMatrix()
  controls.update()
  setMode('view')
}

function toggleHalfPair(pair, on) {
  pair.forEach((p) => { p.enabled = on })
  rebuild()
}

function deleteHalfPair(pair) {
  const ids = new Set(pair.map((p) => p.id))
  surfacePoints.value = surfacePoints.value.filter((p) => !ids.has(p.id))
  selectedSurfaceId.value = surfacePoints.value[0]?.id || ''
  rebuild()
}

/** 刀口可拖动的范围：贴片对角线的一半 */
const halfExtent = computed(() => {
  const s = selectedSurface.value
  if (!s) return 20
  const rect = patchRect(s)
  return Math.max(2, Math.round(Math.hypot(rect.width, rect.height) / 2))
})

/* ---------------- 交互 ---------------- */

function canvasRect() {
  return renderer.domElement.getBoundingClientRect()
}

function ndc(event) {
  const rect = canvasRect()
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  return rect
}

function groundPoint(event) {
  ndc(event)
  raycaster.setFromCamera(pointer, camera)
  const hit = new THREE.Vector3()
  return raycaster.ray.intersectPlane(groundPlane, hit) ? hit : null
}

function onPointerDown(event) {
  if (event.button !== 0 && event.pointerType === 'mouse') return
  userDown = { x: event.clientX, y: event.clientY, t: performance.now(), moved: false }
  down = userDown
  if (mode.value === 'draw') {
    const p = groundPoint(event)
    if (!p) return
    drawStart = { x: p.x, z: p.z }
    updatePreview(drawStart, drawStart)
  } else if (mode.value === 'edit') {
    ndc(event)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(regionGroup.children.filter((o) => o.userData.isHandle), false)
    if (hits.length) {
      const handle = hits[0].object
      selectedRegionId.value = handle.userData.regionId
      draggingVertex = { regionId: handle.userData.regionId, index: handle.userData.vertexIndex }
      controls.enabled = false
    }
  } else if (mode.value === 'surface' && selectedSurface.value) {
    // 先看是不是抓到了「改大小」的角点，再看是不是抓到了贴片本体（拖动）
    ndc(event)
    raycaster.setFromCamera(pointer, camera)
    const handles = raycaster.intersectObjects(surfaceGroup.children.filter((o) => o.userData.isSurfaceHandle), false)
    if (handles.length) {
      surfaceDrag = {
        kind: 'resize',
        corner: handles[0].object.userData.corner,
        start: screenPoint(event),
        size: { ...patchSize(selectedSurface.value) },
      }
      controls.enabled = false
      return
    }
    const body = raycaster.intersectObjects(surfaceGroup.children.filter((o) => o.userData.surfaceId), false)
    if (body.length && body[0].object.userData.surfaceId === selectedSurfaceId.value) {
      surfaceDrag = { kind: 'move', start: screenPoint(event), origin: { ...selectedSurface.value.position } }
      controls.enabled = false
    }
  }
}

let userDown = null

function onPointerMove(event) {
  if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) > 5) down.moved = true
  if (surfaceDrag) {
    applySurfaceDrag(event)
    return
  }
  if (mode.value === 'face' || mode.value === 'half') {
    updateFaceHover(event)
    return
  }
  if (mode.value === 'draw' && drawStart) {
    const p = groundPoint(event)
    if (p) updatePreview(drawStart, { x: p.x, z: p.z })
    return
  }
  if (draggingVertex) {
    const p = groundPoint(event)
    if (!p) return
    const region = regions.value.find((r) => r.id === draggingVertex.regionId)
    if (!region?.points[draggingVertex.index]) return
    region.points[draggingVertex.index].x = Math.round(p.x * 10) / 10
    region.points[draggingVertex.index].z = Math.round(p.z * 10) / 10
    rebuild()
  }
}

function onPointerUp(event) {
  const d = down
  down = null
  userDown = null
  if (surfaceDrag) {
    surfaceDrag = null
    controls.enabled = mode.value === 'view'
    rebuild()
    return
  }
  if (!d) return
  if (mode.value === 'draw' && drawStart) {
    const p = groundPoint(event)
    const start = drawStart
    drawStart = null
    clearPreview()
    if (!p) return
    const x1 = Math.min(start.x, p.x)
    const x2 = Math.max(start.x, p.x)
    const z1 = Math.min(start.z, p.z)
    const z2 = Math.max(start.z, p.z)
    if (x2 - x1 < 8 || z2 - z1 < 8) return
    const region = {
      id: uid('r'),
      name: `区域 ${regions.value.length + 1}`,
      desc: '',
      shape: 'flat',
      points: [
        { x: round(x1), z: round(z1) },
        { x: round(x2), z: round(z1) },
        { x: round(x2), z: round(z2) },
        { x: round(x1), z: round(z2) },
      ],
      baseY: 0.9,
      height: 0.6,
    }
    // 「框选平地」时若开着「立体方块」，就把它做成立体盒子
    if (mode.value === 'draw' && drawAsBox.value) {
      region.name = `立体方块 ${regions.value.filter((r) => r.shape === 'box').length + 1}`
      region.shape = 'box'
      region.height = boxHeight.value
    }
    regions.value.push(region)
    selectedRegionId.value = region.id
    setMode('edit')
    rebuild()
    return
  }
  if (draggingVertex) {
    draggingVertex = null
    controls.enabled = mode.value === 'view'
    rebuild()
    return
  }
  if ((mode.value === 'face' || mode.value === 'half') && d && !d.moved && performance.now() - d.t < 800) {
    ndc(event)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(modelMeshes, false)
    const hit = hits.find((h) => h.face)
    if (hit) {
      const base = collectFaceQuad(hit.object, hit.faceIndex, mode.value === 'half')
      if (base) {
        if (mode.value === 'half') {
          // 新增一条切线：先只建「切线」，不绑定任何一侧；
          // 用户调好角度/位置后，再在面板里点「正向 / 反向」绑定切出来的一半。
          const group = uid('g')
          const baseName = cutList.value.length + 1
          const pos = quadToPatch(base, 'half', `切块 ${baseName}A`)
          pos.cut = { angle: 0, offset: 0, mode: 'split' }
          pos.group = group
          pos.enabled = false
          surfacePoints.value.push(pos)
          const neg = quadToPatch(base, 'half', `切块 ${baseName}B`)
          neg.cut = { angle: 0, offset: 0, mode: 'split', side: 'neg' }
          neg.group = group
          neg.enabled = false
          neg.color = '#4F8BC9'
          surfacePoints.value.push(neg)
          selectedSurfaceId.value = pos.id
          tab.value = 'half'
          setMode('view')
          rebuild()
        } else {
          const item = quadToPatch(base, 'face', '楼面')
          surfacePoints.value.push(item)
          selectedSurfaceId.value = item.id
          tab.value = 'surface'
          setMode('surface')
          rebuild()
        }
      }
    }
    return
  }
  if (mode.value === 'surface' && d && !d.moved && performance.now() - d.t < 800) {
    ndc(event)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects(modelMeshes, false)
    if (hits.length) {
      const hit = hits[0]
      const point = hit.point
      const normal = hit.face?.normal
        ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
        : new THREE.Vector3(0, 1, 0)
      const item = {
        id: uid('s'),
        name: `位置 ${surfacePoints.value.length + 1}`,
        desc: '',
        position: { x: round(point.x), y: round(point.y), z: round(point.z) },
        normal: { x: round(normal.x, 3), y: round(normal.y, 3), z: round(normal.z, 3) },
        radius: 12,
        shape: 'circle',
        width: 20,
        height: 12,
        color: '#D4A853',
      }
      surfacePoints.value.push(item)
      selectedSurfaceId.value = item.id
      rebuild()
    }
    return
  }
  if (mode.value === 'view' && d && !d.moved) {
    ndc(event)
    raycaster.setFromCamera(pointer, camera)
    const hits = raycaster.intersectObjects([...regionGroup.children, ...surfaceGroup.children], false)
    if (hits.length) {
      const hit = hits[0].object
      if (hit.userData.surfaceId) selectSurface(hit.userData.surfaceId)
      else if (hit.userData.regionId) selectRegion(hit.userData.regionId)
    }
  }
}

function onPointerLeave() {
  if (mode.value === 'draw') {
    drawStart = null
    clearPreview()
  }
  if (mode.value === 'face' || mode.value === 'half') clearFaceHover()
}

function screenPoint(event) {
  const rect = canvasRect()
  return { x: event.clientX - rect.left, y: event.clientY - rect.top, w: rect.width, h: rect.height }
}

let surfaceDrag = null

/** 贴片拖动：横向鼠标位移 → 面内 U，纵向 → 面内 V，按每米多少像素换算 */
function applySurfaceDrag(event) {
  const s = selectedSurface.value
  if (!s || !surfaceDrag) return
  const rect = patchRect(s)
  const now = screenPoint(event)
  const dx = now.x - surfaceDrag.start.x
  const dy = now.y - surfaceDrag.start.y
  // 屏幕像素 → 米：用相机到贴片的距离估算像素比例
  const dist = camera.position.distanceTo(new THREE.Vector3(s.position.x, s.position.y, s.position.z))
  const pxPerMeter = now.h / (2 * dist * Math.tan((camera.fov * Math.PI) / 360))
  const du = dx / pxPerMeter
  const dv = -dy / pxPerMeter

  if (surfaceDrag.kind === 'move') {
    const o = new THREE.Vector3(surfaceDrag.origin.x, surfaceDrag.origin.y, surfaceDrag.origin.z)
    const p = o.clone().addScaledVector(rect.right, du).addScaledVector(rect.up, dv)
    s.position = { x: round(p.x), y: round(p.y), z: round(p.z) }
  } else if (surfaceDrag.kind === 'resize') {
    const corner = surfaceDrag.corner // { u: -1|1, v: -1|1 }
    const base = surfaceDrag.size
    const w = Math.max(0.5, base.width + du * corner.u * 2)
    const h = Math.max(0.5, base.height + dv * corner.v * 2)
    s.size = { width: round(w), height: round(h) }
    s.width = s.size.width
    s.height = s.size.height
  } else if (surfaceDrag.kind === 'cut') {
    const a = ((Number(s.cut?.angle) || 0) * Math.PI) / 180
    // 垂直于刀口方向的位移就是偏移变化量
    const normal = { u: Math.cos(a), v: -Math.sin(a) }
    const delta = du * normal.u + dv * normal.v
    const next = -delta
    const lim = halfExtent.value
    if (!s.cut) s.cut = defaultCut(s)
    s.cut.offset = round(Math.max(-lim, Math.min(lim, next)))
  }
  rebuild()
}

function round(v, digits = 1) {
  const num = Number(v)
  if (!Number.isFinite(num)) return 0
  const m = 10 ** digits
  return Math.round(num * m) / m
}

function updatePreview(a, b) {
  if (!previewLine) return
  const y = 1.3
  const points = [
    new THREE.Vector3(a.x, y, a.z),
    new THREE.Vector3(b.x, y, a.z),
    new THREE.Vector3(b.x, y, b.z),
    new THREE.Vector3(a.x, y, b.z),
    new THREE.Vector3(a.x, y, a.z),
  ]
  previewLine.geometry.dispose()
  previewLine.geometry = new THREE.BufferGeometry().setFromPoints(points)
  previewLine.visible = true
}

function clearPreview() {
  if (previewLine) previewLine.visible = false
}

function confirm() {
  const cleanRegions = regions.value
    .filter((r) => Array.isArray(r.points) && r.points.length >= 3)
    .map((r) => {
      const baseY = Number(r.baseY)
      const height = Math.max(0.05, Number(r.height) || 0.6)
      const idle = Math.min(0.8, Math.max(0.05, Number(r.opacity) || 0.12))
      return {
        ...r,
        shape: r.shape === 'box' ? 'box' : 'flat',
        points: r.points.map((p) => ({ x: round(p.x), z: round(p.z) })),
        baseY: Number.isFinite(baseY) ? round(baseY, 2) : 0.9,
        height: round(height, 2),
        opacity: round(idle, 2),
        hoverOpacity: round(Math.min(1, Math.max(idle, Number(r.hoverOpacity) || 0.5)), 2),
      }
    })
  const cleanSurfaces = surfacePoints.value.map((p) => {
    const size = patchSize(p)
    const item = {
      ...p,
      radius: Number(p.radius) || 10,
      width: round(size.width),
      height: round(size.height),
      size: { width: round(size.width), height: round(size.height) },
      rot: round(Number(p.rot) || 0, 1),
      shape: p.shape || 'circle',
      enabled: p.enabled !== false,
    }
    if (p.uAxis) item.uAxis = { x: round(p.uAxis.x, 4), y: round(p.uAxis.y, 4), z: round(p.uAxis.z, 4) }
    if (p.anchor) item.anchor = { x: round(p.anchor.x), y: round(p.anchor.y), z: round(p.anchor.z) }
    if (p.source) item.source = p.source
    if (p.group) item.group = p.group
    if (p.cut) {
      item.cut = {
        angle: round(Number(p.cut.angle) || 0, 1),
        offset: round(Number(p.cut.offset) || 0, 2),
        mode: p.cut.mode === 'split' ? 'split' : 'half',
      }
      if (p.cut.side) item.cut.side = p.cut.side
    } else {
      delete item.cut
    }
    if (item.shape === 'poly') {
      item.points = (Array.isArray(p.points) ? p.points : []).map((pt) => ({ x: round(pt.x), z: round(pt.z) }))
      if (item.points.length < 3) item.shape = 'circle'
    } else {
      delete item.points
    }
    return item
  })
  emit('apply', { regions: cleanRegions, surfacePoints: cleanSurfaces })
}

watch(regions, () => { if (!destroyed) rebuild() }, { deep: true })
watch(surfacePoints, () => { if (!destroyed) rebuild() }, { deep: true })
watch(selectedRegionId, () => rebuild())
watch(selectedSurfaceId, () => rebuild())

onMounted(init)
onMounted(() => window.addEventListener('keydown', onKeyDown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))

/** X / Y / Z：把选中的贴片换到对应朝向的平面上，方便在不同墙面上复用 */
function onKeyDown(event) {
  if (!selectedSurface.value) return
  const tag = (event.target?.tagName || '').toLowerCase()
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return
  const key = event.key.toLowerCase()
  if (mode.value !== 'surface') return
  const s = selectedSurface.value
  if (s.shape !== 'rect' && s.source !== 'half' && s.shape !== 'circle') return
  if (key === 'x' || key === 'y' || key === 'z') {
    event.preventDefault()
    setSurfacePlane(key)
  } else if (key === 'q' || key === 'e') {
    event.preventDefault()
    s.rot = round((Number(s.rot) || 0) + (key === 'q' ? -15 : 15), 1)
    rebuild()
  }
}
onBeforeUnmount(() => {
  destroyed = true
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
.sp-backdrop {
  position: fixed;
  inset: 0;
  z-index: 520;
  background: rgba(14, 26, 20, 0.56);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.sp-dialog {
  width: min(1280px, 98vw);
  height: min(880px, 95vh);
  background: var(--a-card);
  border-radius: 18px;
  border: 1px solid var(--a-border);
  box-shadow: 0 38px 100px rgba(0, 0, 0, 0.35);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.sp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--a-bg-deep);
}
.sp-title { font-family: 'Noto Serif SC', serif; font-size: 18px; font-weight: 900; color: var(--a-primary); }
.sp-sub { font-size: 10.5px; color: var(--a-muted); margin-top: 2px; }
.sp-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--a-bg-deep);
  flex-wrap: wrap;
}
.sp-tabs > button {
  padding: 7px 11px;
  border: 1px solid var(--a-border);
  background: var(--a-bg);
  color: var(--a-muted);
  border-radius: 8px;
  font-size: 11px;
  cursor: pointer;
}
.sp-tabs > button.active { background: var(--a-primary); color: #fff; border-color: var(--a-primary); }
.sp-mode { display: inline-flex; gap: 2px; margin-left: auto; padding: 2px; border: 1px solid var(--a-border); border-radius: 9px; background: var(--a-bg); }
.sp-mode button { border: none; background: transparent; padding: 5px 9px; border-radius: 7px; font-size: 10.5px; color: var(--a-muted); cursor: pointer; }
.sp-mode button.active { background: var(--a-card); color: var(--a-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.sp-half-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 0 4px; }
.sp-half-btn { border: 1px solid var(--a-border); background: var(--a-bg); color: var(--a-muted); padding: 7px 6px; border-radius: 7px; font-size: 11px; cursor: pointer; transition: all 0.16s ease; }
.sp-half-btn:hover { border-color: var(--a-primary); color: var(--a-primary); }
.sp-half-btn.active { background: var(--a-primary); border-color: var(--a-primary); color: #fff; font-weight: 700; }
.sp-sec { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: 12px 0 6px; padding-top: 10px; border-top: 1px dashed var(--a-border); font-size: 10.5px; font-weight: 800; letter-spacing: 0.06em; color: var(--a-primary); }
.sp-focus-btn { border: 1px solid var(--a-border); background: var(--a-bg); color: var(--a-primary); border-radius: 6px; padding: 2px 7px; font-size: 10px; font-weight: 700; letter-spacing: 0; cursor: pointer; transition: all 0.16s ease; }
.sp-focus-btn:hover { background: var(--a-primary); border-color: var(--a-primary); color: #fff; }
.sp-half-group { margin-top: 10px; padding: 9px 9px 6px; border: 1px solid var(--a-border); border-radius: 9px; background: var(--a-bg); }
.sp-half-titlerow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
.sp-half-tools { display: inline-flex; align-items: center; gap: 5px; }
.sp-half-title { font-size: 11.5px; font-weight: 800; color: var(--a-primary); }
.sp-half-check { display: inline-flex; align-items: center; gap: 6px; margin-bottom: 7px; font-size: 11px; color: var(--a-muted); cursor: pointer; }
.sp-half-check input { accent-color: var(--a-primary); width: 13px; height: 13px; cursor: pointer; }
.sp-half-row { display: flex; align-items: center; gap: 6px; padding: 5px 6px; border-radius: 7px; border: 1px solid transparent; }
.sp-half-row.active { border-color: var(--a-primary); background: var(--a-pale); }
.sp-half-pick { border: none; background: transparent; padding: 0 2px; color: var(--a-primary); font-size: 13px; cursor: pointer; line-height: 1; }
.sp-half-pick:not(.on) { color: #b9b3a6; }
.sp-half-name { height: 26px; padding: 2px 6px; font-size: 11.5px; flex: 1; min-width: 0; }
.sp-half-side { flex-shrink: 0; font-size: 9.5px; font-weight: 800; color: var(--a-muted); border: 1px solid var(--a-border); border-radius: 4px; padding: 1px 4px; line-height: 1.3; }
.sp-half-group.dim { opacity: 0.66; }
.sp-half-sel { border: 1px solid var(--a-border); background: var(--a-card); color: var(--a-muted); padding: 4px 8px; border-radius: 6px; font-size: 10.5px; cursor: pointer; white-space: nowrap; }
.sp-half-sel.active { background: var(--a-primary); border-color: var(--a-primary); color: #fff; font-weight: 700; }

/* 「选半栋」= 切线编辑 */
.sp-cut-angle { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
.sp-cut-angle .sp-half-btn { width: 100%; }
.sp-bind-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 8px; padding-top: 8px; border-top: 1px dashed var(--a-border); }
.sp-bind-row .a-label { margin: 0; }
.sp-bind-btns { display: flex; gap: 5px; }
.sp-bind-btns .sp-half-btn { padding: 4px 8px; font-size: 10.5px; }
.sp-planegrid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 4px; }
.sp-plane-btn { border: 1px solid var(--a-border); background: var(--a-bg); color: var(--a-muted); padding: 6px 4px; border-radius: 7px; font-size: 10.5px; cursor: pointer; transition: all 0.16s ease; }
.sp-plane-btn:last-child { grid-column: 1 / -1; }
.sp-plane-btn:hover { border-color: var(--a-primary); color: var(--a-primary); }
.sp-plane-btn.active { background: var(--a-primary); border-color: var(--a-primary); color: #fff; font-weight: 700; }
.sp-box-bar { display: flex; align-items: center; gap: 10px; margin: 8px 0 0; padding: 8px 10px; border: 1px dashed var(--a-border); border-radius: 8px; background: var(--a-bg); }
.sp-box-toggle { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--a-text); cursor: pointer; user-select: none; }
.sp-box-toggle input { accent-color: var(--a-primary); width: 14px; height: 14px; cursor: pointer; }
.sp-box-height { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; color: var(--a-muted); }
.sp-box-height .a-input { width: 62px; height: 26px; padding: 2px 6px; font-size: 11.5px; }
.mode-face canvas, .mode-half canvas { cursor: crosshair; }
.sp-main { flex: 1; display: flex; min-height: 0; }
.sp-canvas { position: relative; flex: 1; min-width: 0; background: #f1ebdd; overflow: hidden; }
.sp-canvas.mode-draw, .sp-canvas.mode-surface, .sp-canvas.mode-edit { cursor: crosshair; }
.sp-canvas :deep(canvas) { display: block; }
.sp-loading { position: absolute; inset: 0; z-index: 4; display: flex; align-items: center; justify-content: center; gap: 10px; background: #f1ebdd; color: var(--a-muted); font-size: 12px; }
.sp-hint { position: absolute; left: 12px; bottom: 12px; z-index: 3; padding: 6px 10px; border-radius: 7px; background: rgba(27,67,50,0.75); color: #fff; font-size: 10px; pointer-events: none; max-width: 80%; }
.sp-panel { width: 310px; flex-shrink: 0; border-left: 1px solid var(--a-bg-deep); background: #fdfbf6; padding: 12px; overflow-y: auto; }
.sp-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; font-size: 11px; font-weight: 700; color: var(--a-muted); }
.sp-list { display: flex; flex-direction: column; gap: 4px; margin-bottom: 10px; }
.sp-list-item { display: flex; align-items: center; gap: 7px; padding: 7px 8px; border-radius: 7px; border: 1px solid var(--a-border); background: var(--a-bg); cursor: pointer; text-align: left; }
.sp-list-item.active { border-color: var(--a-primary); background: var(--a-pale); }
.sp-swatch { width: 10px; height: 10px; border-radius: 3px; flex-shrink: 0; }
.sp-list-name { flex: 1; font-size: 10.5px; color: var(--a-fg); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.sp-list-meta { font-size: 9px; color: var(--a-muted); }
.sp-fields { border-top: 1px solid var(--a-bg-deep); padding-top: 10px; display: flex; flex-direction: column; gap: 7px; }
.sp-row { display: grid; grid-template-columns: 1fr 1fr 0.7fr; gap: 5px; }
.sp-vertices-head { display: flex; align-items: center; justify-content: space-between; font-size: 10.5px; color: var(--a-muted); margin-top: 4px; }
.sp-vertex-list { display: flex; flex-direction: column; gap: 4px; }
.sp-vertex-row { display: flex; align-items: center; gap: 4px; }
.sp-vertex-index { width: 16px; font-size: 9px; color: var(--a-muted); text-align: center; flex-shrink: 0; }
.sp-vertex-row .a-input { flex: 1; padding: 5px 6px; font-size: 10px; }
.sp-vertex-row .a-btn { padding: 5px 7px; }
.sp-foot { display: flex; align-items: center; gap: 9px; padding: 11px 16px; border-top: 1px solid var(--a-bg-deep); background: var(--a-card); }
@media (max-width: 860px) {
  .sp-dialog { height: 96vh; }
  .sp-main { flex-direction: column; }
  .sp-panel { width: 100%; max-height: 235px; border-left: none; border-top: 1px solid var(--a-bg-deep); }
  .sp-mode { margin-left: 0; }
  .sp-hint { display: none; }
}
</style>
