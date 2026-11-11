<template>
  <div class="sub-backdrop" @click.self="$emit('close')">
    <div class="sub-modal">
      <div class="sub-head">
        <div>
          <div class="sub-title"><i class="fa-solid fa-share-nodes"></i> 我要投稿</div>
          <div class="sub-sub">照片投稿、信息补充、内容纠错，都可以在这里提交给作者确认。</div>
        </div>
        <button class="sub-close" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <!-- 三选一 -->
      <div v-if="!submitted" class="sub-tabs">
        <button
          v-for="t in kinds" :key="t.id" type="button"
          class="sub-tab" :class="{ active: kind === t.id }"
          @click="switchKind(t.id)"
        >
          <i :class="t.icon"></i>
          <span class="sub-tab-name">{{ t.name }}</span>
          <span class="sub-tab-desc">{{ t.desc }}</span>
        </button>
      </div>

      <div v-if="submitted" class="sub-success">
        <div class="sub-success-icon"><i class="fa-solid fa-check"></i></div>
        <h3>已提交，谢谢！</h3>
        <p v-if="kind === 'photo'">照片已进入后台待审核，通过后会出现在这栋楼的楼体相册里。</p>
        <p v-else>投稿已进入后台待处理列表，作者确认后会更新校园指南。</p>
        <button class="sub-btn sub-btn-primary" @click="$emit('close')">关闭</button>
      </div>

      <template v-else>
        <div class="sub-body">
          <!-- ───────── 照片投稿 ───────── -->
          <template v-if="kind === 'photo'">
            <div class="sub-section">
              <div class="sub-section-title">
                1. 给哪栋楼投稿
                <span v-if="currentBuilding" class="sub-auto">已自动带入当前页面</span>
              </div>
              <div class="sub-search-wrap">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                  v-model="buildingQuery"
                  class="sub-input"
                  placeholder="搜索建筑，如 学生公寓6号 / 图书馆"
                  @focus="onBuildingFocus"
                  @blur="onBlur"
                  @input="showBuildingList = true"
                />
                <button v-if="form.buildingId" class="sub-clear" type="button" @mousedown.prevent="clearBuilding">
                  <i class="fa-solid fa-xmark"></i>
                </button>
                <div v-if="showBuildingList && filteredBuildings.length" class="sub-dropdown">
                  <button
                    v-for="b in filteredBuildings" :key="b.id" type="button"
                    class="sub-dropdown-item"
                    @mousedown.prevent="selectBuilding(b)"
                  >
                    <span class="sub-building-icon" :style="{ background: b.bgColor, color: b.color }">
                      <i :class="b.icon"></i>
                    </span>
                    <span><strong>{{ b.name }}</strong><small>{{ b.sub || b.catName }}</small></span>
                  </button>
                </div>
              </div>
              <div v-if="form.buildingId" class="sub-selected">
                <i class="fa-solid fa-circle-check"></i>
                已关联：{{ form.buildingName }}
                <button type="button" @click="clearBuilding">更换</button>
              </div>
            </div>

            <label class="sub-field">
              <span>2. 照片 <b>*</b></span>
              <input ref="fileInput" class="sub-file" type="file" accept="image/*" @change="onPickPhoto" hidden />
              <div
                v-if="!photoPreview"
                class="sub-drop"
                :class="{ busy: compressing, dragging: dropActive }"
                @click="fileInput?.click()"
                @dragenter.prevent="onDragEnter"
                @dragover.prevent="onDragOver"
                @dragleave.prevent="onDragLeave"
                @drop.prevent="onDrop"
              >
                <i :class="compressing ? 'fa-solid fa-spinner fa-spin' : (dropActive ? 'fa-solid fa-file-arrow-down' : 'fa-solid fa-cloud-arrow-up')"></i>
                <b>{{ compressing ? '正在压缩…' : (dropActive ? '松手即可上传' : '点击选择照片 / 把照片拖到这里') }}</b>
                <em>支持 JPG / PNG，会自动压缩到 1MB 以内</em>
              </div>
              <div v-else class="sub-photo-box">
                <img :src="photoPreview" alt="待投稿照片" />
                <div class="sub-photo-meta">
                  <span v-if="photoInfo">
                    {{ photoInfo.width }}×{{ photoInfo.height }} ·
                    {{ formatBytes(photoInfo.sizeBytes) }}
                    <em v-if="photoInfo.compressed">（原图 {{ formatBytes(photoInfo.origBytes) }}）</em>
                  </span>
                  <button type="button" class="sub-photo-again" @click="resetPhoto">重新选择</button>
                </div>
              </div>
            </label>

            <div class="sub-grid">
              <label class="sub-field">
                <span>3. 照片名称 <b>*</b></span>
                <input v-model="form.photoTitle" class="sub-input" maxlength="60" placeholder="如：宿舍楼正门 / 图书馆大厅" />
              </label>
              <label class="sub-field">
                <span>4. 署名（选填）</span>
                <input v-model="form.authorName" class="sub-input" maxlength="20" placeholder="默认匿名" />
              </label>
            </div>

            <label class="sub-field">
              <span>5. 具体描述（选填）</span>
              <textarea v-model="form.content" class="sub-input sub-textarea" rows="3" placeholder="这张照片拍的是哪里、什么时候拍的"></textarea>
            </label>
          </template>

          <!-- ───────── 信息补充 / 内容纠错 ───────── -->
          <template v-else>
            <div class="sub-section">
              <div class="sub-section-title">
                1. 哪栋楼 / 哪个地方
                <span v-if="currentBuilding" class="sub-auto">已自动带入当前页面</span>
              </div>
              <div class="sub-search-wrap">
                <i class="fa-solid fa-magnifying-glass"></i>
                <input
                  v-model="buildingQuery"
                  class="sub-input"
                  placeholder="搜索建筑，如 崇德楼 / 快递站"
                  @focus="onBuildingFocus"
                  @blur="onBlur"
                  @input="showBuildingList = true"
                />
                <button v-if="form.buildingId" class="sub-clear" type="button" @mousedown.prevent="clearBuilding">
                  <i class="fa-solid fa-xmark"></i>
                </button>
                <div v-if="showBuildingList && filteredBuildings.length" class="sub-dropdown">
                  <button
                    v-for="b in filteredBuildings" :key="b.id" type="button"
                    class="sub-dropdown-item"
                    @mousedown.prevent="selectBuilding(b)"
                  >
                    <span class="sub-building-icon" :style="{ background: b.bgColor, color: b.color }">
                      <i :class="b.icon"></i>
                    </span>
                    <span><strong>{{ b.name }}</strong><small>{{ b.sub || b.catName }}</small></span>
                  </button>
                </div>
              </div>
              <div v-if="form.buildingId" class="sub-selected">
                <i class="fa-solid fa-circle-check"></i>
                已关联：{{ form.buildingName }}
                <button type="button" @click="clearBuilding">更换</button>
              </div>
              <input
                v-model="form.placeName"
                class="sub-input"
                style="margin-top:7px;"
                :placeholder="kind === 'supplement' ? '具体是哪里，如「图书馆 2 楼东侧」' : '具体是哪里（选填）'"
              />
            </div>

            <label class="sub-field">
              <span>2. {{ kind === 'supplement' ? '要补充的内容' : '哪里不对' }} <b>*</b></span>
              <textarea
                v-model="form.content"
                class="sub-input sub-textarea"
                rows="6"
                :placeholder="kind === 'supplement'
                  ? '例如：图书馆 2 楼新增了 20 个自习座位，开放到 22:00。'
                  : '例如：简介里写开放时间 8:00–22:00，实际是 7:30–21:30。'"
              ></textarea>
            </label>

            <label class="sub-field">
              <span>3. 昵称 / 联系方式（选填）</span>
              <input v-model="form.contact" class="sub-input" placeholder="方便作者联系你确认；不会公开展示" />
            </label>
          </template>

          <div v-if="error" class="sub-error">{{ error }}</div>
        </div>

        <div class="sub-foot">
          <span class="sub-hint">
            {{ kind === 'photo' ? '审核通过后照片会出现在这栋楼的楼体相册里。' : '提交后进入后台待处理列表。' }}
          </span>
          <div class="sub-spacer"></div>
          <button class="sub-btn" type="button" @click="$emit('close')">取消</button>
          <button class="sub-btn sub-btn-primary" type="button" :disabled="submitting || compressing" @click="submit">
            <i class="fa-solid fa-paper-plane"></i> {{ submitting ? '提交中…' : '提交投稿' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { compressPhoto, formatBytes, makeThumbDataUrl } from '../utils/photoCompress.js'

const props = defineProps({
  buildings: { type: Array, default: () => [] },
  /** 当前正在浏览的建筑（从设施速查详情里发起投稿时会自动带入） */
  current: { type: Object, default: null },
})
const emit = defineEmits(['close', 'submitted'])

const kinds = [
  { id: 'photo', name: '照片投稿', icon: 'fa-solid fa-camera-retro', desc: '给楼体相册加照片' },
  { id: 'supplement', name: '信息补充', icon: 'fa-solid fa-circle-plus', desc: '补充设施、时间等' },
  { id: 'correction', name: '内容纠错', icon: 'fa-solid fa-pen-to-square', desc: '现有信息有误' },
]
const kind = ref('photo')

const currentBuilding = computed(() => props.current || null)

const form = ref({
  buildingId: props.current?.id || '',
  buildingName: props.current?.name || '',
  placeName: '',
  photoTitle: '',
  authorName: '',
  content: '',
  contact: '',
})
const buildingQuery = ref(props.current?.name || '')
const showBuildingList = ref(false)
const submitted = ref(false)
const submitting = ref(false)
const error = ref('')

/* ---------------- 照片 ---------------- */
const fileInput = ref(null)
const compressing = ref(false)
const photoPreview = ref('')
const photoInfo = ref(null)
const photoData = ref({ dataUrl: '', thumbDataUrl: '' })

/* 拖拽上传 */
const dropActive = ref(false)
let dragDepth = 0

function isImageFile(file) {
  if (!file) return false
  return file.type ? file.type.startsWith('image/') : /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name || '')
}

function onDragEnter(event) {
  if (!event.dataTransfer?.types?.includes('Files')) return
  dragDepth += 1
  dropActive.value = true
}
function onDragOver(event) {
  if (!event.dataTransfer?.types?.includes('Files')) return
  event.dataTransfer.dropEffect = 'copy'
  dropActive.value = true
}
function onDragLeave() {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) dropActive.value = false
}
function onDrop(event) {
  dragDepth = 0
  dropActive.value = false
  const files = [...(event.dataTransfer?.files || [])]
  const picked = files.find(isImageFile)
  if (!picked) {
    error.value = '只支持图片文件（JPG / PNG）'
    return
  }
  handlePhotoFile(picked)
}

async function onPickPhoto(event) {
  const file = event.target.files?.[0]
  if (file) await handlePhotoFile(file)
  if (event.target) event.target.value = ''
}

async function handlePhotoFile(file) {
  if (!file) return
  if (!isImageFile(file)) {
    error.value = '只支持图片文件（JPG / PNG）'
    return
  }
  error.value = ''
  compressing.value = true
  try {
    const result = await compressPhoto(file)
    photoPreview.value = result.dataUrl
    photoData.value.dataUrl = result.dataUrl
    photoInfo.value = {
      width: result.width,
      height: result.height,
      sizeBytes: result.sizeBytes,
      origBytes: result.origBytes,
      compressed: result.compressed,
    }
    try {
      photoData.value.thumbDataUrl = await makeThumbDataUrl(result.blob || file, 420)
    } catch {
      photoData.value.thumbDataUrl = ''
    }
    // 没填名字时用文件名兜底
    if (!form.value.photoTitle) {
      form.value.photoTitle = String(file.name || '').replace(/\.[a-z0-9]+$/i, '').slice(0, 60)
    }
  } catch (e) {
    error.value = e.message || '照片处理失败，请换一张'
    resetPhoto()
  } finally {
    compressing.value = false
  }
}

function resetPhoto() {
  photoPreview.value = ''
  photoInfo.value = null
  photoData.value = { dataUrl: '', thumbDataUrl: '' }
}

/* ---------------- 建筑选择 ---------------- */
const filteredBuildings = computed(() => {
  const q = buildingQuery.value.trim().toLowerCase()
  const list = props.buildings || []
  if (!q) {
    // 点开且没输入时：按名称排序列出全部，方便直接挑
    return [...list]
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'zh-CN'))
      .slice(0, 60)
  }
  // 多个关键词用空格分隔，全部命中才算
  const tokens = q.split(/\s+/).filter(Boolean)
  return list
    .map((b) => {
      const text = `${b.name} ${b.sub || ''} ${b.catName || ''} ${(b.aliases || []).join(' ')}`.toLowerCase()
      const name = String(b.name || '').toLowerCase()
      let score = 0
      if (name === q) score += 100
      else if (name.includes(q)) score += 50
      if (tokens.every((t) => text.includes(t))) score += 20
      if ((b.aliases || []).some((a) => String(a).toLowerCase().includes(q))) score += 15
      return { b, score }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || String(x.b.name).localeCompare(String(y.b.name), 'zh-CN'))
    .slice(0, 40)
    .map((x) => x.b)
})

function selectBuilding(b) {
  form.value.buildingId = b.id
  form.value.buildingName = b.name
  buildingQuery.value = b.name
  showBuildingList.value = false
}

function clearBuilding() {
  form.value.buildingId = ''
  form.value.buildingName = ''
  buildingQuery.value = ''
}

function onBuildingFocus() {
  showBuildingList.value = true
  // 已经选好建筑时，再点一下是「换一个」：清掉查询词，直接看全部
  if (form.value.buildingId) {
    buildingQuery.value = ''
    form.value.buildingId = ''
    form.value.buildingName = ''
  }
}

function onBlur() {
  setTimeout(() => { showBuildingList.value = false }, 150)
}

function switchKind(id) {
  if (kind.value === id) return
  kind.value = id
  error.value = ''
}

/* ---------------- 提交 ---------------- */
async function submit() {
  error.value = ''
  if (!form.value.buildingId) {
    error.value = '请先选择投稿的建筑。'
    return
  }
  if (kind.value === 'photo') {
    if (!photoData.value.dataUrl) {
      error.value = '请先选择一张照片。'
      return
    }
    if (!form.value.photoTitle.trim()) {
      error.value = '请填写照片名称。'
      return
    }
  } else if (form.value.content.trim().length < 5) {
    error.value = '请至少写 5 个字的描述。'
    return
  }

  submitting.value = true
  try {
    const body = {
      type: kind.value,
      buildingId: form.value.buildingId,
      buildingName: form.value.buildingName,
      placeName: form.value.placeName.trim(),
      content: form.value.content.trim(),
      contact: form.value.contact.trim(),
      authorName: form.value.authorName.trim(),
      pin: null,
      occurredAt: '',
    }
    if (kind.value === 'photo') {
      body.content = form.value.content.trim() || form.value.photoTitle.trim()
      body.dataUrl = photoData.value.dataUrl
      body.thumbDataUrl = photoData.value.thumbDataUrl || undefined
      body.photoWidth = photoInfo.value?.width || 0
      body.photoHeight = photoInfo.value?.height || 0
      body.origBytes = photoInfo.value?.origBytes || 0
      // 照片名称同时写进 placeName，后台列表里直接能看到
      body.placeName = form.value.photoTitle.trim()
    }
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      // 优先用服务端给的中文提示；只有没有提示时才退回技术细节
      const msg = data.error || data.detail || '提交失败，请稍后再试'
      throw new Error(msg)
    }
    submitted.value = true
    emit('submitted', data.submission || null)
  } catch (e) {
    error.value = e.message || '提交失败，请稍后再试'
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (props.current) {
    form.value.buildingId = props.current.id
    form.value.buildingName = props.current.name
    buildingQuery.value = props.current.name
  }
})
</script>

<style scoped>
.sub-backdrop {
  position: fixed;
  inset: 0;
  z-index: 320;
  background: rgba(15, 30, 22, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
}
.sub-modal {
  width: min(700px, 96vw);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-elevated, #fffdf8);
  border-radius: 16px;
  box-shadow: 0 30px 80px rgba(15, 30, 22, 0.34);
  overflow: hidden;
}
.sub-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid rgba(27, 67, 50, 0.08);
}
.sub-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--font-serif, Georgia, serif);
  font-size: 19px;
  font-weight: 700;
  color: var(--primary, #1b4332);
}
.sub-title i { color: var(--accent, #d4a853); font-size: 15px; }
.sub-sub { margin-top: 4px; font-size: 11.5px; color: rgba(107, 107, 128, 0.95); }
.sub-close {
  width: 30px; height: 30px; flex-shrink: 0;
  border-radius: 9px; border: 1px solid rgba(27, 67, 50, 0.12);
  background: rgba(255, 255, 255, 0.8); color: rgba(27, 67, 50, 0.6);
  cursor: pointer; font-size: 12px;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}
.sub-close:hover { background: rgba(212, 168, 83, 0.18); color: var(--primary, #1b4332); transform: rotate(90deg); }

.sub-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 22px 18px;
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.sub-section { display: flex; flex-direction: column; gap: 8px; }
.sub-section-title {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  font-size: 12px; font-weight: 700; color: var(--primary, #1b4332);
}
.sub-auto {
  padding: 2px 8px; border-radius: 999px;
  background: rgba(212, 168, 83, 0.18);
  color: #8a6420; font-size: 9.5px; font-weight: 600;
}

.sub-search-wrap { position: relative; display: flex; align-items: center; }
.sub-search-wrap > i {
  position: absolute; left: 12px; font-size: 11px; color: rgba(107, 107, 128, 0.7); pointer-events: none;
}
.sub-input {
  width: 100%;
  padding: 10px 34px 10px 33px;
  border: 1px solid rgba(27, 67, 50, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  font-family: inherit;
  font-size: 12px;
  color: var(--fg, #22352c);
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.sub-field > .sub-input,
.sub-field > .sub-textarea { padding: 10px 12px; }
.sub-input:focus { border-color: var(--primary, #1b4332); box-shadow: 0 0 0 3px rgba(216, 243, 220, 0.8); }
.sub-field { display: flex; flex-direction: column; gap: 6px; }
.sub-field > span { font-size: 11.5px; font-weight: 700; color: var(--primary, #1b4332); }
.sub-field > span b { color: #a8402f; }
.sub-textarea { resize: vertical; min-height: 76px; line-height: 1.65; }
.sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.sub-clear {
  position: absolute; right: 8px;
  width: 20px; height: 20px; border-radius: 50%;
  border: none; background: rgba(27, 67, 50, 0.08);
  color: rgba(27, 67, 50, 0.55); cursor: pointer; font-size: 9px;
}
.sub-clear:hover { background: rgba(168, 64, 47, 0.15); color: #a8402f; }
.sub-dropdown {
  position: absolute; top: calc(100% + 5px); left: 0; right: 0;
  z-index: 8; max-height: 220px; overflow-y: auto;
  background: #fff; border-radius: 10px;
  border: 1px solid rgba(27, 67, 50, 0.12);
  box-shadow: 0 16px 40px -12px rgba(15, 30, 22, 0.3);
  padding: 5px;
}
.sub-dropdown-item {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 7px 8px; border-radius: 8px; border: none; background: none;
  cursor: pointer; font-family: inherit; text-align: left;
}
.sub-dropdown-item:hover { background: var(--primary-pale, #eef7f1); }
.sub-dropdown-item span:last-child { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.sub-dropdown-item strong { font-size: 12px; color: var(--primary, #1b4332); font-weight: 600; }
.sub-dropdown-item small { font-size: 10px; color: rgba(107, 107, 128, 0.9); }
.sub-building-icon {
  width: 26px; height: 26px; flex-shrink: 0; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; font-size: 11px;
}
.sub-selected {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; color: #2d6a4f;
}
.sub-selected i { font-size: 11px; }
.sub-selected button {
  border: none; background: none; cursor: pointer; font-family: inherit;
  font-size: 10.5px; color: #3c5f85; text-decoration: underline;
}
.sub-error {
  padding: 9px 12px; border-radius: 9px;
  background: rgba(168, 64, 47, 0.09);
  border: 1px solid rgba(168, 64, 47, 0.22);
  color: #8c2f24; font-size: 11.5px;
}
.sub-foot {
  display: flex; align-items: center; gap: 8px;
  padding: 13px 22px; border-top: 1px solid rgba(27, 67, 50, 0.08);
  background: rgba(246, 246, 240, 0.7);
}
.sub-hint { font-size: 10.5px; color: rgba(107, 107, 128, 0.9); }
.sub-spacer { flex: 1; }
.sub-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 9px 16px; border-radius: 10px;
  border: 1px solid rgba(27, 67, 50, 0.16);
  background: #fff; color: var(--primary, #1b4332);
  font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer;
  transition: background 0.2s, transform 0.2s, box-shadow 0.2s;
}
.sub-btn:hover { background: var(--primary-light, #e8f5ec); transform: translateY(-1px); }
.sub-btn-primary {
  border-color: transparent;
  background: linear-gradient(150deg, #245c43, #12372a);
  color: #fff; box-shadow: 0 8px 20px -8px rgba(27, 67, 50, 0.55);
}
.sub-btn-primary:hover { background: linear-gradient(150deg, #2d6a4f, #163a2c); }
.sub-btn-primary:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }

.sub-success {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 34px 26px 30px; text-align: center;
}
.sub-success-icon {
  width: 52px; height: 52px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(216, 243, 220, 0.9); color: #2d6a4f; font-size: 22px;
}
.sub-success h3 { font-family: var(--font-serif, Georgia, serif); font-size: 18px; color: var(--primary, #1b4332); }
.sub-success p { font-size: 12px; color: rgba(107, 107, 128, 0.95); max-width: 420px; line-height: 1.7; }

/* 类型三选一 */
.sub-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  padding: 14px 22px 0;
}
.sub-tab {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 11px;
  border: 1px solid rgba(27, 67, 50, 0.12);
  background: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
}
.sub-tab i { font-size: 13px; color: rgba(27, 67, 50, 0.55); }
.sub-tab-name { font-size: 12.5px; font-weight: 700; color: var(--primary, #1b4332); }
.sub-tab-desc { font-size: 10px; color: rgba(107, 107, 128, 0.9); }
.sub-tab:hover { border-color: rgba(45, 106, 79, 0.3); transform: translateY(-1px); }
.sub-tab.active {
  border-color: var(--primary, #1b4332);
  background: linear-gradient(150deg, #245c43, #12372a);
  box-shadow: 0 8px 20px -8px rgba(27, 67, 50, 0.5);
}
.sub-tab.active i,
.sub-tab.active .sub-tab-name { color: #fff; }
.sub-tab.active i { color: var(--accent, #d4a853); }
.sub-tab.active .sub-tab-desc { color: rgba(255, 255, 255, 0.68); }

/* 照片选择 */
.sub-file { display: none; }
.sub-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 26px 14px;
  border: 1.5px dashed rgba(27, 67, 50, 0.24);
  border-radius: 12px;
  background: rgba(216, 243, 220, 0.24);
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
}
.sub-drop.dragging {
  border-color: var(--primary);
  background: rgba(216, 243, 220, 0.75);
  box-shadow: 0 0 0 4px rgba(216, 243, 220, 0.55) inset;
  transform: translateY(-1px);
}
.sub-drop.dragging i { color: var(--primary); transform: scale(1.12); }
.sub-drop.dragging b { color: var(--primary); }

.sub-drop:hover { border-color: rgba(45, 106, 79, 0.5); background: rgba(216, 243, 220, 0.5); }
.sub-drop i { font-size: 22px; color: rgba(27, 67, 50, 0.42); }
.sub-drop b { font-size: 12.5px; color: var(--primary, #1b4332); }
.sub-drop em { font-style: normal; font-size: 10px; color: rgba(107, 107, 128, 0.9); }
.sub-drop.busy { opacity: 0.75; pointer-events: none; }

.sub-photo-box { display: flex; flex-direction: column; gap: 7px; }
.sub-photo-box img {
  width: 100%;
  max-height: 240px;
  object-fit: cover;
  border-radius: 11px;
  border: 1px solid rgba(27, 67, 50, 0.1);
}
.sub-photo-meta {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  font-size: 10.5px; color: rgba(107, 107, 128, 0.95); font-variant-numeric: tabular-nums;
}
.sub-photo-meta em { font-style: normal; opacity: 0.75; }
.sub-photo-again {
  border: 1px solid rgba(27, 67, 50, 0.16); background: #fff; border-radius: 8px;
  padding: 4px 10px; font-size: 10.5px; color: var(--primary, #1b4332); cursor: pointer; font-family: inherit;
}
.sub-photo-again:hover { background: var(--primary-light, #e8f5ec); }

@media (max-width: 640px) {
  .sub-tabs { grid-template-columns: 1fr; gap: 6px; padding: 12px 14px 0; }
  .sub-tab { flex-direction: row; align-items: center; gap: 8px; padding: 8px 11px; }
  .sub-tab-desc { margin-left: auto; }
}
</style>