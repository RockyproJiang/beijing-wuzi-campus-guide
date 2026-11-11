<template>
  <div class="about-overlay" @keydown.escape="$emit('close')">
    <div class="about-overlay-header">
      <button class="about-back-btn" @click="$emit('close')" title="返回">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="about-head-brand">
        <div class="about-head-icon"><i class="fa-solid fa-circle-info"></i></div>
        <div class="about-head-text">
          <div class="about-overlay-title">关于本项目</div>
          <div class="about-overlay-sub">北京物资学院 · 校园指南 · 由学生独立制作</div>
        </div>
      </div>
      <button class="about-call-btn" :class="{ copied: copiedKey === 'header' }" @click="copyPhone('header')" title="点击复制电话 / 微信号">
        <i :class="copiedKey === 'header' ? 'fa-solid fa-check' : 'fa-solid fa-copy'"></i>
        <span>{{ copiedKey === 'header' ? '已复制' : '复制电话/微信' }}</span>
      </button>
    </div>

    <div class="about-overlay-body">
      <!-- 左侧目录 -->
      <aside class="about-rail">
        <div class="rail-title">目录</div>
        <a
          v-for="s in sections" :key="s.id"
          href="#"
          class="rail-item"
          :class="{ active: activeSection === s.id }"
          @click.prevent="scrollTo(s.id)"
        >
          <i :class="s.icon"></i>
          <span>{{ s.title }}</span>
        </a>
        <div class="rail-divider"></div>
        <button class="rail-item rail-item-call" @click="copyPhone('rail')">
          <i :class="copiedKey === 'rail' ? 'fa-solid fa-check' : 'fa-solid fa-copy'"></i>
          <span>{{ copiedKey === 'rail' ? '已复制' : '复制电话/微信' }}</span>
        </button>
      </aside>

      <!-- 右侧内容 -->
      <div class="about-content" ref="contentEl" @scroll="onScroll">
        <section class="about-hero" ref="heroEl">
          <div class="hero-eyebrow">BWU CAMPUS GUIDE · ABOUT</div>
          <h2>把一所校园，装进一个网页</h2>
          <p class="hero-lead">
            北京物资学院 · 校园指南是一个由学生独立完成的校园信息平台：以校内真实建筑的三维白膜为底，
            把每一栋楼的位置、开放时间、设备、楼层与联系方式放在同一张可以自由旋转的地图上，
            让"新生第一天找不到教学楼"这件事不再发生。
          </p>
          <div class="hero-metrics">
            <div class="metric"><b>179</b><span>校园三维体块</span></div>
            <div class="metric"><b>89</b><span>收录地点</span></div>
            <div class="metric"><b>10</b><span>设施分类</span></div>
            <div class="metric"><b>1</b><span>人独立完成</span></div>
          </div>
          <div class="hero-actions">
            <button class="btn-primary" :class="{ copied: copiedKey === 'hero' }" @click="copyPhone('hero')">
              <i :class="copiedKey === 'hero' ? 'fa-solid fa-check' : 'fa-solid fa-copy'"></i>
              {{ copiedKey === 'hero' ? '已复制到剪贴板' : '复制电话 / 微信 13146617300' }}
            </button>
            <button class="btn-ghost" @click="$emit('navigate', 'browse')">
              <i class="fa-solid fa-compass"></i> 去设施速查
            </button>
          </div>
        </section>

        <section v-if="hasSchool" id="sec-school" class="about-section school-section">
          <div class="sec-head">
            <span class="sec-num">01</span>
            <h3><i class="fa-solid fa-school"></i> 学校信息</h3>
            <span v-if="school.subtitle" class="sec-side">{{ school.subtitle }}</span>
          </div>

          <div v-if="school.intro" class="school-intro">
            <p v-for="(line, i) in introLines" :key="i">{{ line }}</p>
          </div>

          <div class="school-grid">
            <div v-for="row in schoolRows" :key="row.label" class="school-cell">
              <span class="cell-icon"><i :class="row.icon"></i></span>
              <span class="cell-body">
                <b>{{ row.label }}</b>
                <a v-if="row.href" :href="row.href" target="_blank" rel="noopener">{{ row.value }}</a>
                <em v-else>{{ row.value }}</em>
              </span>
              <button v-if="row.copy" class="cell-copy" :class="{ copied: copiedKey === row.label }" title="复制" @click="copyText(row.value, row.label)">
                <i :class="copiedKey === row.label ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
              </button>
            </div>
          </div>

          <div v-if="school.items.length" class="school-extra">
            <div v-for="item in school.items" :key="item.label" class="extra-item">
              <b>{{ item.label }}</b>
              <span>{{ item.value }}</span>
            </div>
          </div>

          <div v-if="school.mapUrl" class="school-actions">
            <button class="school-map-btn" @click="openUrl(school.mapUrl)">
              <i class="fa-solid fa-map-location-dot"></i> 在地图中查看
            </button>
            <span v-if="school.location" class="school-loc"><i class="fa-solid fa-location-dot"></i>{{ school.location }}</span>
          </div>
        </section>

        <section id="sec-intro" class="about-section">
          <div class="sec-head">
            <span class="sec-num">02</span>
            <h3><i class="fa-solid fa-seedling"></i> 项目介绍</h3>
          </div>
          <p>
            校园信息长期散落在年级群、公众号推文和学长学姐的口口相传里：某栋楼几层是自习室、
            哪个食堂几点关门、哪个门晚上是关的——这些信息对在校生是常识，对刚刚报到的学生却是一道门槛。
            本项目尝试把这些信息收拢到一个入口，用最直观的三维地图呈现。
          </p>
          <p>
            整个校园模型按照校内实际建筑位置、体量逐栋建模，经过坐标校准后导出为网页可用的轻量模型；
            建筑信息统一存放在数据库中，由管理后台维护，前台实时读取。项目从零开始，
            包含建模、数据整理、前端界面、后端接口与后台管理，均由作者在课余时间独立完成。
          </p>
          <div class="quote-card">
            <i class="fa-solid fa-quote-left"></i>
            <p>目标很简单：任何一个第一次走进这所学校的人，打开网页就能知道自己要去哪、几点开门。</p>
          </div>
        </section>

        <section id="sec-guide" class="about-section guide-section">
          <div class="sec-head">
            <span class="sec-num">03</span>
            <h3><i class="fa-solid fa-diagram-project"></i> 功能详解</h3>
          </div>
          <p class="guide-lead">
            整套系统分五块，前台看「找得到、看得懂」，后台看「改得动、审得清」。
            每一块都可以独立使用，也可以串起来用。
          </p>

          <div class="guide-flow">
            <button
              v-for="(m, i) in modules" :key="m.id"
              type="button" class="flow-node"
              @click="scrollTo('mod-' + m.id)"
            >
              <span class="flow-idx">{{ String(i + 1).padStart(2, '0') }}</span>
              <span class="flow-name">{{ m.name }}</span>
              <span class="flow-tag">{{ m.tag }}</span>
            </button>
          </div>

          <div class="mod-list">
            <article v-for="(m, i) in modules" :id="'mod-' + m.id" :key="m.id" class="mod-card">
              <header class="mod-head">
                <span class="mod-badge"><i :class="m.icon"></i></span>
                <div class="mod-titlebox">
                  <div class="mod-kicker">模块 {{ String(i + 1).padStart(2, '0') }}</div>
                  <h4>{{ m.name }}</h4>
                  <p class="mod-sum">{{ m.summary }}</p>
                  <div class="mod-keys">
                    <span v-for="k in m.keywords" :key="k" class="mod-key">{{ k }}</span>
                  </div>
                </div>
              </header>
              <ul class="mod-points">
                <li v-for="p in m.points" :key="p.k">
                  <b>{{ p.k }}</b>
                  <span>{{ p.v }}</span>
                </li>
              </ul>
              <div v-if="m.tip" class="mod-tip">
                <i class="fa-solid fa-lightbulb"></i>
                <span>{{ m.tip }}</span>
              </div>
              <div v-if="m.action" class="mod-action">
                <button type="button" class="mod-go" @click="$emit('navigate', m.action.go)">
                  <i :class="m.action.icon"></i>{{ m.action.label }}
                  <i class="fa-solid fa-arrow-right mod-go-arrow"></i>
                </button>
              </div>
            </article>
          </div>
        </section>

        <section id="sec-paths" class="about-section">
          <div class="sec-head">
            <span class="sec-num">04</span>
            <h3><i class="fa-solid fa-route"></i> 上手路径</h3>
          </div>
          <p class="guide-lead">不用把上面五块都读完，按你的身份挑一条照着走就行。</p>
          <div class="path-grid">
            <div v-for="p in paths" :key="p.who" class="path-card">
              <div class="path-head">
                <span class="path-icon"><i :class="p.icon"></i></span>
                <div>
                  <div class="path-who">{{ p.who }}</div>
                  <div class="path-goal">{{ p.goal }}</div>
                </div>
              </div>
              <ol class="path-steps">
                <li v-for="(s, si) in p.steps" :key="s">
                  <em>{{ si + 1 }}</em><span>{{ s }}</span>
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section id="sec-features" class="about-section">
          <div class="sec-head">
            <span class="sec-num">05</span>
            <h3><i class="fa-solid fa-list-check"></i> 功能一览</h3>
          </div>
          <div class="feature-grid">
            <div v-for="f in features" :key="f.title" class="feature-card">
              <span class="feature-icon"><i :class="f.icon"></i></span>
              <span class="feature-name">{{ f.title }}</span>
              <small>{{ f.desc }}</small>
            </div>
          </div>
        </section>

        <section id="sec-tech" class="about-section">
          <div class="sec-head">
            <span class="sec-num">06</span>
            <h3><i class="fa-solid fa-code"></i> 技术栈</h3>
          </div>
          <div class="tech-grid">
            <div v-for="t in techs" :key="t.name" class="tech-card">
              <div class="tech-head">
                <i :class="t.icon"></i>
                <span>{{ t.name }}</span>
              </div>
              <small>{{ t.desc }}</small>
            </div>
          </div>
        </section>

        <section id="sec-build" class="about-section">
          <div class="sec-head">
            <span class="sec-num">07</span>
            <h3><i class="fa-solid fa-timeline"></i> 制作过程</h3>
          </div>
          <ol class="timeline">
            <li v-for="s in steps" :key="s.title">
              <span class="tl-dot"></span>
              <div class="tl-body">
                <div class="tl-title">{{ s.title }}</div>
                <div class="tl-desc">{{ s.desc }}</div>
              </div>
            </li>
          </ol>
        </section>

        <section id="sec-contact" class="about-section">
          <div class="sec-head">
            <span class="sec-num">08</span>
            <h3><i class="fa-solid fa-address-card"></i> 联系方式与维护</h3>
          </div>
          <div class="author-card">
            <div class="author-avatar">江</div>
            <div class="author-info">
              <div class="author-name">江乐瑜Rocky</div>
              <div class="author-bio">北京物资学院经济学院学生 · 本项目作者与维护者</div>
              <div class="author-links">
                <button class="author-phone" :class="{ copied: copiedKey === 'author' }" @click="copyPhone('author')" title="点击复制手机号（同时也是微信号）">
                  <i :class="copiedKey === 'author' ? 'fa-solid fa-check' : 'fa-solid fa-copy'"></i>
                  <span>13146617300</span>
                  <em>{{ copiedKey === 'author' ? '已复制' : '电话 / 微信 · 点击复制' }}</em>
                </button>
              </div>
            </div>
          </div>
          <div class="contact-duo">
            <button class="contact-tile" :class="{ copied: copiedKey === 'tile-phone' }" @click="copyPhone('tile-phone')">
              <span class="tile-icon"><i class="fa-solid fa-phone-volume"></i></span>
              <span class="tile-body">
                <b>电话</b>
                <em>13146617300</em>
                <small>{{ copiedKey === 'tile-phone' ? '已复制' : '点击复制手机号' }}</small>
              </span>
            </button>
            <button class="contact-tile" :class="{ copied: copiedKey === 'tile-wechat' }" @click="copyPhone('tile-wechat')">
              <span class="tile-icon wechat"><i class="fa-brands fa-weixin"></i></span>
              <span class="tile-body">
                <b>微信</b>
                <em>13146617300</em>
                <small>{{ copiedKey === 'tile-wechat' ? '已复制' : '手机号即微信号，加好友投稿或纠错' }}</small>
              </span>
            </button>
          </div>
          <div class="maintain-grid">
            <div class="maintain-card">
              <i class="fa-solid fa-pen-to-square"></i>
              <div>
                <b>信息有误？</b>
                <p>打电话或当面告诉作者建筑名与正确信息，通常在一天内更正。</p>
              </div>
            </div>
            <div class="maintain-card">
              <i class="fa-solid fa-location-dot"></i>
              <div>
                <b>位置投稿</b>
                <p>设施速查右上角「位置投稿」可在网页内直接提交新地点或纠错。</p>
              </div>
            </div>
            <div class="maintain-card">
              <i class="fa-solid fa-handshake-angle"></i>
              <div>
                <b>合作与建议</b>
                <p>功能建议、数据补充、部门对接等事宜，欢迎电话联系。</p>
              </div>
            </div>
          </div>
        </section>

        <section class="about-section disclaimer-section">
          <div class="sec-head">
            <span class="sec-num">09</span>
            <h3><i class="fa-solid fa-triangle-exclamation"></i> 免责声明</h3>
          </div>
          <ul>
            <li>本指南为个人整理项目，<strong>非学校官方发布</strong>，信息可能存在遗漏或误差。</li>
            <li>部分信息（如营业时间、开放状态）可能因学校安排临时变更，请以<strong>现场通知为准</strong>。</li>
            <li>本指南尽可能避免主观评价，仅提供客观设施信息供参考。</li>
            <li>如发现错误或需要更新，请联系维护者进行修正。</li>
          </ul>
        </section>

        <div class="about-footer">
          <span>北京物资学院 · 校园指南</span>
          <span class="dot">·</span>
          <button class="footer-copy" @click="copyPhone('footer')">
            <i :class="copiedKey === 'footer' ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
            {{ copiedKey === 'footer' ? '已复制' : '电话 / 微信 13146617300' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

defineEmits(['close', 'navigate'])

const props = defineProps({
  /** 学校信息：后台「学校信息」页维护，显示在本页最上方 */
  schoolProfile: { type: Object, default: null },
})

/* ---------------- 一键复制（电话 / 微信同一个号码） ---------------- */
const CONTACT_VALUE = '13146617300'
const copiedKey = ref('')
let copyTimer = 0
async function copyText(value, key) {
  const text = String(value || '')
  if (!text) return
  let ok = false
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      ok = true
    }
  } catch {
    ok = false
  }
  if (!ok) {
    const area = document.createElement('textarea')
    area.value = text
    area.setAttribute('readonly', '')
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    try { ok = document.execCommand('copy') } catch { ok = false }
    document.body.removeChild(area)
  }
  copiedKey.value = ok ? key : '__fail__'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copiedKey.value = '' }, 1800)
}
function copyPhone(key) {
  return copyText(CONTACT_VALUE, key)
}
onBeforeUnmount(() => clearTimeout(copyTimer))

/* ---------------- 学校信息（后台可编辑） ---------------- */
const FALLBACK_SCHOOL = {
  name: '北京物资学院',
  enName: 'Beijing Wuzi University',
  shortName: '北物院',
  level: '北京市属公办本科',
  intro: '',
  address: '北京市通州区富河大街 321 号',
  postcode: '101149',
  phone: '010-89534000',
  admissionPhone: '010-89534490',
  email: '',
  fax: '',
  website: 'https://www.bwu.edu.cn/',
  admissionUrl: '',
  location: '',
  lng: '',
  lat: '',
  mapUrl: '',
  items: [],
}

function str(v) {
  return v == null ? '' : String(v).trim()
}

const school = computed(() => {
  const raw = props.schoolProfile || {}
  const base = { ...FALLBACK_SCHOOL }
  for (const key of Object.keys(FALLBACK_SCHOOL)) {
    if (key === 'items') continue
    const v = str(raw[key])
    if (v) base[key] = v
  }
  base.items = (Array.isArray(raw.items) ? raw.items : [])
    .map((x) => ({ label: str(x?.label), value: str(x?.value) }))
    .filter((x) => x.label && x.value)

  // 地图链接：优先用手填的，否则按经纬度拼高德
  let mapUrl = base.mapUrl
  if (!mapUrl && /^-?\d+(\.\d+)?$/.test(base.lng) && /^-?\d+(\.\d+)?$/.test(base.lat)) {
    mapUrl = `https://uri.amap.com/marker?position=${base.lng},${base.lat}&name=${encodeURIComponent(base.name)}&src=mypage&coordinate=gaode&callnative=0`
  }
  base.mapUrl = mapUrl
  base.subtitle = [base.level].filter(Boolean).join(' · ')
  return base
})

const hasSchool = computed(() => Boolean(school.value.name || school.value.address))

const introLines = computed(() => String(school.value.intro || '').split(/\n+/).map((x) => x.trim()).filter(Boolean))

function withHttp(url) {
  const v = str(url)
  if (!v) return ''
  if (/^(https?:|mailto:|tel:)/i.test(v)) return v
  return 'https://' + v
}

const schoolRows = computed(() => {
  const s = school.value
  const rows = []
  if (s.address) rows.push({ icon: 'fa-solid fa-location-dot', label: '地址', value: s.address, copy: true })
  if (s.postcode) rows.push({ icon: 'fa-solid fa-envelope-open-text', label: '邮编', value: s.postcode, copy: true })
  if (s.phone) rows.push({ icon: 'fa-solid fa-phone', label: '总机', value: s.phone, href: 'tel:' + s.phone.replace(/[^\d+]/g, ''), copy: true })
  if (s.admissionPhone) rows.push({ icon: 'fa-solid fa-headset', label: '招生电话', value: s.admissionPhone, href: 'tel:' + s.admissionPhone.replace(/[^\d+]/g, ''), copy: true })
  if (s.email) rows.push({ icon: 'fa-solid fa-at', label: '邮箱', value: s.email, href: 'mailto:' + s.email, copy: true })
  if (s.fax) rows.push({ icon: 'fa-solid fa-fax', label: '传真', value: s.fax, copy: true })
  if (s.website) rows.push({ icon: 'fa-solid fa-globe', label: '学校官网', value: s.website.replace(/^https?:\/\//i, ''), href: withHttp(s.website) })
  if (s.admissionUrl) rows.push({ icon: 'fa-solid fa-user-graduate', label: '招生网址', value: s.admissionUrl.replace(/^https?:\/\//i, ''), href: withHttp(s.admissionUrl) })
  return rows
})

function openUrl(url) {
  const v = withHttp(url)
  if (!v) return
  window.open(v, '_blank', 'noopener')
}

const sections = computed(() => {
  const list = []
  if (hasSchool.value) list.push({ id: 'sec-school', title: '学校信息', icon: 'fa-solid fa-school' })
  list.push(
    { id: 'sec-intro', title: '项目介绍', icon: 'fa-solid fa-seedling' },
    { id: 'sec-guide', title: '功能详解', icon: 'fa-solid fa-diagram-project' },
    { id: 'sec-paths', title: '上手路径', icon: 'fa-solid fa-route' },
    { id: 'sec-features', title: '功能一览', icon: 'fa-solid fa-list-check' },
    { id: 'sec-tech', title: '技术栈', icon: 'fa-solid fa-code' },
    { id: 'sec-build', title: '制作过程', icon: 'fa-solid fa-timeline' },
    { id: 'sec-contact', title: '联系方式', icon: 'fa-solid fa-address-card' }
  )
  return list
})

/* ---------------- 功能详解：五大模块（可跳转） ---------------- */
const modules = [
  {
    id: 'map',
    name: '三维校园地图',
    tag: '看得见',
    icon: 'fa-solid fa-cube',
    keywords: ['旋转缩放', '点选建筑', '3D 定位', '第一人称', '准星'],
    summary: '以校内真实建筑位置与体量建成的三维白膜为底图，可以自由旋转、缩放、平移；点任何一栋楼就直接弹出它的完整档案。',
    points: [
      { k: '模型规模', v: '170 余个体块：教学楼、宿舍、食堂、体育馆、道路铺装、广场与绿化面，按校内实际位置与高度逐栋建模，不是示意图。' },
      { k: '视角操作', v: '左键拖动旋转、滚轮缩放、右键平移；双指收缩可同时缩放与平移。相机会自动避开楼体，贴近建筑也不会穿进模型内部。' },
      { k: '点选建筑', v: '鼠标悬浮即高亮并显示楼名，单击选中、弹出详情；点空白处取消选择。手机端手指点按同样有效。' },
      { k: '3D 定位', v: '详情页点「3D 定位」，镜头飞向该楼并让楼体自身呼吸式发光约 9 秒，不用另找参照物。' },
      { k: '第一人称', v: '从校门起步走进校园，WASD / 方向键前后左右移动，按住左键拖动转头，右下角滑块可调 0.5×–4× 移动速度；撞到楼体或围墙会停下，走不出校界。' },
      { k: '手机准星', v: '手机上可开启准星，把准星拖到想看的楼上方即可选中，避免手指挡住目标；准星只做提示，不影响正常的点击、旋转与缩放。' },
      { k: '分类筛选', v: '按教学区、宿舍区、餐饮区等筛选，非当前分类的楼体转为半透明，空间关系仍然看得见。' },
      { k: '地图工具', v: '右侧「地图工具」可收起成一条窄把手，含第一人称切换、准星、平移模式和放大 / 缩小 / 重置视角。' }
    ],
    tip: '搜索框输入楼名后回车，地图会直接飞到对应建筑并高亮，比自己拖着找快得多。',
    action: { label: '去地图看看', go: 'map', icon: 'fa-solid fa-map-location-dot' }
  },
  {
    id: 'browse',
    name: '设施速查',
    tag: '找得到',
    icon: 'fa-solid fa-layer-group',
    keywords: ['分类浏览', '模糊搜索', '全部建筑', '两套布局'],
    summary: '把全校近九十处地点按功能分类整理，电脑与手机各有一套布局，用来回答「我要去的地方在哪、怎么走」。',
    points: [
      { k: '分类浏览', v: '教学区、宿舍区、餐饮区、运动场馆、生活服务、校门、停车场等分类，点一下即筛出对应设施，右侧显示条目数。' },
      { k: '全部建筑', v: '「全部建筑」把所有地点平铺，不确定属于哪一类时从这一栏翻，支持按楼群分组展开。' },
      { k: '模糊搜索', v: '按楼名、别名、设施关键词匹配：输入「打印」「快递」「食堂」「二教」都能命中；多个词用空格分隔表示同时满足。' },
      { k: '详情面板', v: '选中地点后按标签分页展示：建筑信息、楼层详情、上课时间、设施设备、联系电话、周边设施、楼体相册。' },
      { k: '内容分层', v: '建筑信息按「时间 / 功能 / 价格 / 位置 / 预约 / 容纳人数 / 联系 / 备注」分块，每类一种视觉样式，不再是平铺的表格。' },
      { k: '设施分组', v: '设施设备按生活服务、餐饮、运动场地、学习空间、停车交通、安全急救自动归组，可点胶囊只看某一类。' },
      { k: '两套布局', v: '电脑端左侧分类列表 + 右侧详情，可收起成窄条；手机端顶部搜索 + 分类胶囊，选中后自动收起列表进入详情。' }
    ],
    tip: '详情页里点「3D 定位」跳回地图对应位置，「返回」还能回到原来的浏览进度。',
    action: { label: '打开设施速查', go: 'browse', icon: 'fa-solid fa-layer-group' }
  },
  {
    id: 'detail',
    name: '建筑档案',
    tag: '看得懂',
    icon: 'fa-solid fa-building-columns',
    keywords: ['楼层', '上课时间', '设备', '相册'],
    summary: '每处地点都有一份结构化档案：几点开门、哪层有什么、能办什么、打给谁、附近还有什么，一页看完。',
    points: [
      { k: '基础信息', v: '楼名、别称、所属学院或部门、分类、一句话简介，以及别名（同一栋楼可以有多个叫法，搜索都能命中）。' },
      { k: '楼层详情', v: '按楼层列出房间号与用途，并可给每层加「小模块」：开放时间、本层功能、价格、位置指引、设施、注意事项、联系方式、容纳人数，各用不同样式呈现。' },
      { k: '上课时间', v: '教学楼按第 1 节到第 12 节列出起止时间，自动统计总节数、最早开始、最晚结束与休息段数，课间与午休单独标出。' },
      { k: '设施设备', v: '这栋楼里有什么：自助终端、饮水机、打印机、便利店、AED、篮球场、自习室等，按类分组并支持筛选。' },
      { k: '联系电话', v: '相关部门电话直接列出，点一下即复制号码，不再需要手抄。' },
      { k: '周边设施', v: '列出步行范围内的相邻建筑、食堂、超市、快递点，方便判断「顺路还能办什么」。' },
      { k: '楼体相册', v: '每栋楼的实景照片，可点开大图左右翻看；照片按建筑归档、可排序，支持通过微信投稿补充。' }
    ],
    tip: '不确定某栋楼叫什么没关系——记住别名或用途关键词，比如「澡堂」「快递」「打印」，搜索都会命中。',
    action: { label: '去看一栋楼', go: 'browse', icon: 'fa-solid fa-address-book' }
  },
  {
    id: 'portal',
    name: '数字校园门户',
    tag: '一站式',
    icon: 'fa-solid fa-graduation-cap',
    keywords: ['常用系统', '分区', '与地图互通'],
    summary: '把平时要用的一堆校内系统收拢到一个入口，不用再翻收藏夹、翻聊天记录里别人发的链接。',
    points: [
      { k: '门户汇总', v: '统一门户、办事大厅、教务系统、网络缴费、图书馆、邮箱等常用入口集中排列，按用途分区。' },
      { k: '分区浏览', v: '按「学习」「生活」「办事」等用途分组，每项标注用途与使用提示，不是一串裸链接。' },
      { k: '与地图互通', v: '涉及实体地点的条目可以直接跳到地图对应位置，办完线上事就知道该去哪个楼。' },
      { k: '排版统一', v: '与设施速查共用顶栏、圆角卡片、配色与字号规范，两个页面来回切换不会有割裂感。' }
    ],
    tip: '门户里的入口会随学校系统调整而变化，发现链接失效可以联系作者更新。',
    action: { label: '打开数字校园', go: 'dcampus', icon: 'fa-solid fa-arrow-up-right-from-square' }
  },
  {
    id: 'admin',
    name: '管理后台',
    tag: '改得动',
    icon: 'fa-solid fa-sliders',
    keywords: ['建筑编辑', '3D 校准', '区域', '投稿审核'],
    summary: '前台展示的所有内容都由后台维护，改完即时生效，不需要改代码、也不需要重新部署。',
    points: [
      { k: '建筑管理', v: '增删改建筑：名称、别称、简介、分类、图标、配色、楼层、设备、电话、周边、相册，保存后前台立刻更新。' },
      { k: '分类与标签', v: '维护设施分类、图标与配色，以及搜索别名，让同一栋楼能被多个关键词搜到。' },
      { k: '3D 定位校准', v: '在三维视图里直接拖动标记点，或点选楼体自动绑定模型对象，避免标记漂移。' },
      { k: '区域与贴片', v: '可在地面画立体方块或平面区域，也可在楼体表面贴矩形 / 多边形贴片；贴片平时透明、悬浮时整栋楼高亮。' },
      { k: '半栋切线', v: '给一栋楼加一条可调角度与位置的切线，把楼切成两半，再绑定其中一半单独标注，另一半留空。' },
      { k: '楼体相册', v: '按建筑自动建文件夹，上传时压缩到 700KB–1MB，支持拖拽排序与微信投稿审核。' },
      { k: '投稿与维护', v: '处理「位置投稿」提交的新地点与纠错；提示条、日历事件、回收站、数据导入导出都有对应界面。' }
    ],
    tip: '后台入口不在前台导航里，需要访问 /admin 并登录管理员账号。',
    action: null
  }
]

/* ---------------- 上手路径 ---------------- */
const paths = [
  {
    icon: 'fa-solid fa-person-walking-arrow-right',
    who: '新生 / 访客',
    goal: '第一次来，先知道自己在哪',
    steps: ['打开地图，先看一遍全校俯视', '用分类筛出「教学区」，找到自己要去的楼', '点楼体看开放时间与楼层', '点「3D 定位」确认走法']
  },
  {
    icon: 'fa-solid fa-magnifying-glass',
    who: '在校生',
    goal: '找一个具体设施',
    steps: ['设施速查直接搜关键词，如「打印」「快递」', '按分类胶囊缩小范围', '看设施设备与联系电话', '需要实景就翻楼体相册']
  },
  {
    icon: 'fa-solid fa-route',
    who: '想逛校园',
    goal: '熟悉环境、拍点照片',
    steps: ['地图切「第一人称」从校门走进去', '用方向键或 WASD 沿主要道路走', '右下角滑块调快移动速度', '顺手给没照片的楼投稿几张']
  }
]

const features = [
  { icon: 'fa-solid fa-cube', title: '三维校园地图', desc: '真实白膜模型，可旋转、缩放，点击建筑直接看详情' },
  { icon: 'fa-solid fa-crosshairs', title: '手机准星选点', desc: '移动端用手指在屏幕上对准建筑即可选中' },
  { icon: 'fa-solid fa-magnifying-glass', title: '模糊搜索', desc: '按名称、门牌、设施关键词定位，支持别名' },
  { icon: 'fa-solid fa-layer-group', title: '设施速查', desc: '9 类设施分组浏览，电脑与手机两套布局' },
  { icon: 'fa-solid fa-building-columns', title: '数字校园入口', desc: '门户、办事大厅、教务、网费等常用系统汇总' },
  { icon: 'fa-solid fa-database', title: '后台维护', desc: '建筑、分类、提示、投稿审核全部可在线编辑' }
]

const techs = [
  { icon: 'fa-solid fa-cubes', name: 'Blender', desc: '校园白膜建模、材质贴图与坐标校准' },
  { icon: 'fa-brands fa-vuejs', name: 'Vue 3 + Vite', desc: '组件化前端与构建工具' },
  { icon: 'fa-solid fa-cube', name: 'three.js', desc: 'GLB 加载、相机控制、射线拾取与标记渲染' },
  { icon: 'fa-brands fa-node-js', name: 'Node.js + Express', desc: '接口服务与静态资源托管' },
  { icon: 'fa-solid fa-database', name: 'MySQL', desc: '建筑、分类、设备、提示与投稿数据' }
]

const steps = [
  { title: '建模：从白模到贴图', desc: '按校内实际布局建立建筑体块，逐栋校准位置与高度，补充道路、铺装与绿化面，再为教学楼、剧院、外卖柜等制作材质贴图。' },
  { title: '导出：轻量化网页模型', desc: '在三维软件中按材质合批导出 GLB，压缩到约 4MB，并生成建筑清单与海报图，保证网页首屏加载速度。' },
  { title: '校准：让标记落在正确位置', desc: '建立三维坐标到网页坐标的映射，逐条校对建筑标记位置，确保点击指哪打哪。' },
  { title: '数据：把信息结构化', desc: '整理 84 个地点的位置、简介、开放时间、设备、楼层、上课时间、联系方式与周边设施，录入数据库。' },
  { title: '界面：两套布局', desc: '电脑端左侧列表加右侧详情，手机端横向分类胶囊加卡片网格，并对齐数字校园门户的排版规则。' },
  { title: '运维：持续更新', desc: '通过管理后台增删建筑、维护分类与提示、审核位置投稿，持续保持信息准确。' }
]

const activeSection = ref(sections.value[0]?.id || 'sec-intro')
const contentEl = ref(null)
let observer = null

function scrollTo(id) {
  const el = contentEl.value?.querySelector('#' + id)
  if (el) contentEl.value.scrollTo({ top: el.offsetTop - 16, behavior: 'smooth' })
}
function onScroll() {
  const root = contentEl.value
  const list = sections.value
  if (!root || !list.length) return
  const top = root.getBoundingClientRect().top
  let current = list[0].id
  for (const s of list) {
    const el = root.querySelector('#' + s.id)
    if (el && el.getBoundingClientRect().top - top < 140) current = s.id
  }
  // 滚到底时强制高亮最后一项（末尾分区高度不足以滚到顶部时也能正确指示）
  if (root.scrollTop + root.clientHeight >= root.scrollHeight - 8) current = list[list.length - 1].id
  activeSection.value = current
}

onMounted(() => {
  nextTick(onScroll)
})
onBeforeUnmount(() => {
  observer = null
})
</script>

<style scoped>
.about-overlay {
  position: fixed; inset: 0; z-index: 195;
  display: flex; flex-direction: column;
  background: transparent; overflow: hidden; padding-top: 56px;
  animation: overlayEnter 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes overlayEnter { from { opacity:0; transform:scale(0.985); filter:blur(4px); } to { opacity:1; transform:scale(1); filter:blur(0); } }

/* ====== 顶栏（同数字校园/设施速查规格） ====== */
.about-overlay-header {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 24px;
  background: rgba(255,253,248,0.82);
  border-bottom: 1px solid rgba(27,67,50,0.12);
  backdrop-filter: blur(20px) saturate(1.15);
  flex-shrink: 0; z-index: 5;
}
.about-back-btn {
  width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
  border: 1.5px solid var(--border); background: var(--card); color: var(--primary);
  font-size: 15px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.about-back-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
.about-head-brand { display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1; }
.about-head-icon {
  width: 40px; height: 40px; border-radius: 11px; flex-shrink: 0;
  background: var(--primary); color: var(--accent);
  display: flex; align-items: center; justify-content: center; font-size: 16px;
}
.about-head-text { min-width: 0; }
.about-overlay-title { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 17px; color: var(--primary); line-height: 1.2; }
.about-overlay-sub { font-size: 10.5px; color: var(--fg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.about-call-btn {
  display: inline-flex; align-items: center; gap: 7px; flex-shrink: 0;
  padding: 9px 14px; border-radius: 9px; border: 1px solid rgba(27,67,50,0.16);
  background: rgba(255,253,248,0.9); color: var(--primary);
  font-family: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.about-call-btn i { color: var(--accent); font-size: 12px; }
.about-call-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
.about-call-btn.copied { background: rgba(39,174,96,0.14); border-color: rgba(39,174,96,0.4); color: #1d7a4f; }
.about-call-btn.copied i { color: #1d7a4f; }

/* 联系双卡（电话 / 微信） */
.contact-duo { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin: 12px 0 14px; }
.contact-tile {
  display: flex; align-items: center; gap: 11px; text-align: left; cursor: pointer;
  padding: 12px 14px; border-radius: 12px; font-family: inherit;
  border: 1px solid rgba(27,67,50,0.12); background: rgba(255,255,255,0.72);
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s, background 0.2s;
}
.contact-tile:hover { border-color: rgba(45,106,79,0.34); box-shadow: 0 8px 20px rgba(27,67,50,0.1); transform: translateY(-1px); }
.contact-tile.copied { border-color: rgba(39,174,96,0.45); background: rgba(213,245,227,0.6); }
.tile-icon {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  background: rgba(216,243,220,0.9); color: var(--primary);
}
.tile-icon.wechat { background: rgba(27,67,50,0.92); color: #7BE38B; }
.tile-body { display: flex; flex-direction: column; min-width: 0; }
.tile-body b { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: #9a7a3c; }
.tile-body em { font-style: normal; font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 15.5px; color: var(--primary); font-variant-numeric: tabular-nums; line-height: 1.35; }
.tile-body small { font-size: 10.5px; color: var(--fg-muted); }
.footer-copy {
  display: inline-flex; align-items: center; gap: 5px; border: none; background: none;
  font-family: inherit; font-size: 11.5px; color: var(--primary); font-weight: 600; cursor: pointer;
  font-variant-numeric: tabular-nums; padding: 0; transition: color 0.2s;
}
.footer-copy:hover { color: var(--primary-light); text-decoration: underline dotted; }

/* ====== 主体 ====== */
.about-overlay-body {
  flex: 1; display: flex; align-items: stretch; gap: 18px;
  width: 100%; max-width: 1180px; margin: 0 auto;
  padding: 18px 24px 26px; overflow: hidden; min-height: 0;
}
.about-rail {
  width: 188px; flex-shrink: 0; display: flex; flex-direction: column; gap: 2px; padding: 10px;
  border-radius: 15px; overflow-y: auto; align-self: flex-start;
  background: rgba(255,253,248,0.82);
  border: 1px solid rgba(27,67,50,0.12);
  backdrop-filter: blur(18px) saturate(1.1);
  box-shadow: 0 14px 36px rgba(27,67,50,0.08);
}
.rail-title { font-size: 9.5px; letter-spacing: 0.14em; color: var(--fg-muted); padding: 4px 10px 6px; text-transform: uppercase; }
.rail-item {
  display: flex; align-items: center; gap: 9px; padding: 8px 10px; border-radius: 9px;
  font-family: inherit; font-size: 12px; color: var(--fg); text-decoration: none;
  border: none; background: none; width: 100%; text-align: left; cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
.rail-item i { font-size: 11px; color: var(--fg-muted); width: 14px; text-align: center; }
.rail-item:hover { background: rgba(216,243,220,0.6); color: var(--primary); }
.rail-item.active { background: var(--primary); color: #fff; }
.rail-item.active i { color: var(--accent); }
.rail-divider { height: 1px; background: rgba(27,67,50,0.1); margin: 7px 6px; }
.rail-item-call { color: var(--primary); font-weight: 600; }
.rail-item-call i { color: var(--accent); }
.rail-item-call:hover { background: rgba(216,243,220,0.6); }

.about-content { flex: 1; min-width: 0; min-height: 0; overflow-y: auto; overflow-x: hidden; padding-right: 4px; display: flex; flex-direction: column; gap: 16px; }
/* 内容列是可滚动容器，子块一律按内容撑开，不被 flex 压缩 */
.about-content > * { flex: 0 0 auto; }
.about-hero, .about-section { flex-shrink: 0; }

/* ====== Hero ====== */
.about-hero {
  position: relative; overflow: hidden;
  border-radius: 18px; padding: 30px 28px 26px;
  background:
    radial-gradient(120% 140% at 100% 0%, rgba(212,168,83,0.16), transparent 60%),
    linear-gradient(160deg, rgba(216,243,220,0.85), rgba(255,253,248,0.94) 62%);
  border: 1px solid rgba(27,67,50,0.11);
  box-shadow: 0 18px 44px rgba(27,67,50,0.09);
}
.hero-eyebrow { font-size: 9.5px; letter-spacing: 0.22em; font-weight: 800; color: var(--accent); margin-bottom: 12px; }
.about-hero h2 { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 27px; color: var(--primary); line-height: 1.3; margin-bottom: 12px; }
.hero-lead { font-size: 13px; line-height: 1.9; color: var(--fg); max-width: 640px; }
.hero-metrics { display: flex; flex-wrap: wrap; gap: 28px; margin: 22px 0 20px; }
.metric { display: flex; flex-direction: column; }
.metric b { font-family: 'Noto Serif SC', serif; font-size: 24px; font-weight: 900; color: var(--primary); line-height: 1.1; font-variant-numeric: tabular-nums; }
.metric span { font-size: 10.5px; color: var(--fg-muted); margin-top: 3px; }
.hero-actions { display: flex; flex-wrap: wrap; gap: 10px; }
.btn-primary, .btn-ghost {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px;
  font-size: 12px; font-weight: 700; cursor: pointer; text-decoration: none; transition: all 0.2s;
}
.btn-primary {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; border-radius: 10px;
  background: var(--primary); color: #fff; border: 1px solid var(--primary);
  font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer;
  font-variant-numeric: tabular-nums; letter-spacing: 0.03em; transition: all 0.2s;
}
.btn-primary i { color: var(--accent); }
.btn-primary:hover { background: var(--primary-light); border-color: var(--primary-light); }
.btn-primary.copied { background: #1d7a4f; border-color: #1d7a4f; }
.btn-primary.copied i { color: #D5F5E3; }
.btn-ghost { background: rgba(255,253,248,0.9); color: var(--primary); border: 1px solid rgba(27,67,50,0.18); }
.btn-ghost:hover { background: var(--primary-pale); }

/* ====== 分区 ====== */
.about-section {
  border-radius: 15px; padding: 20px 22px;
  background: rgba(255,253,248,0.9);
  border: 1px solid rgba(27,67,50,0.1);
  box-shadow: 0 10px 28px rgba(27,67,50,0.05);
}
.sec-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.sec-num { font-family: 'Noto Serif SC', serif; font-size: 11px; font-weight: 900; color: var(--accent); letter-spacing: 0.06em; }
.sec-head h3 { font-family: 'Noto Serif SC', serif; font-size: 15px; font-weight: 900; color: var(--primary); display: flex; align-items: center; gap: 8px; }
.sec-head h3 i { font-size: 12.5px; color: var(--primary-light); }
.sec-side { margin-left: auto; font-size: 10.5px; color: var(--fg-muted); letter-spacing: 0.02em; }
.about-section p { font-size: 12.5px; line-height: 1.95; color: var(--fg); }
.about-section p + p { margin-top: 10px; }

/* ====== 学校信息 ====== */
.school-section {
  background:
    radial-gradient(120% 140% at 100% 0%, rgba(212,168,83,0.13), transparent 58%),
    linear-gradient(160deg, rgba(216,243,220,0.72), rgba(255,253,248,0.94) 58%);
  border-color: rgba(27,67,50,0.13);
}
.school-intro { margin-bottom: 14px; }
.school-intro p { font-size: 12.5px; line-height: 1.95; color: var(--fg); }
.school-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
.school-cell {
  display: flex; align-items: center; gap: 9px; padding: 9px 11px; border-radius: 10px;
  background: rgba(255,255,255,0.76); border: 1px solid rgba(27,67,50,0.09);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.school-cell:hover { border-color: rgba(45,106,79,0.3); box-shadow: 0 6px 16px rgba(27,67,50,0.06); }
.cell-icon {
  width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 11.5px;
  background: var(--primary-pale); color: var(--primary);
}
.cell-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; flex: 1; }
.cell-body b { font-size: 9.5px; font-weight: 700; letter-spacing: 0.08em; color: var(--fg-muted); }
.cell-body em, .cell-body a {
  font-style: normal; font-size: 12px; font-weight: 600; color: var(--primary);
  line-height: 1.5; text-decoration: none; word-break: break-all;
}
.cell-body a { text-decoration: underline; text-decoration-color: rgba(45,106,79,0.35); text-underline-offset: 2px; }
.cell-body a:hover { color: var(--primary-light); }
.cell-copy {
  width: 24px; height: 24px; flex-shrink: 0; border-radius: 6px; cursor: pointer;
  border: 1px solid rgba(27,67,50,0.12); background: rgba(255,253,248,0.9);
  color: var(--fg-muted); font-size: 10px;
  display: flex; align-items: center; justify-content: center; transition: all 0.18s;
}
.cell-copy:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
.cell-copy.copied { background: rgba(39,174,96,0.16); border-color: rgba(39,174,96,0.45); color: #1d7a4f; }
.school-extra {
  display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; padding-top: 12px;
  border-top: 1px dashed rgba(27,67,50,0.12);
}
.extra-item {
  display: flex; align-items: baseline; gap: 7px; padding: 5px 11px; border-radius: 999px;
  background: rgba(216,243,220,0.62); border: 1px solid rgba(45,106,79,0.14);
}
.extra-item b { font-size: 10px; font-weight: 700; color: var(--primary-light); letter-spacing: 0.04em; }
.extra-item span { font-size: 11.5px; font-weight: 600; color: var(--primary); }
.school-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 13px; }
.school-map-btn {
  display: inline-flex; align-items: center; gap: 7px; padding: 8px 14px; border-radius: 9px;
  border: 1px solid var(--primary); background: var(--primary); color: #fff;
  font-family: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.school-map-btn i { color: var(--accent); font-size: 11px; }
.school-map-btn:hover { background: var(--primary-light); border-color: var(--primary-light); }
.school-loc { font-size: 11px; color: var(--fg-muted); display: inline-flex; align-items: center; gap: 5px; }
.school-loc i { color: var(--accent); font-size: 10.5px; }

.quote-card {
  display: flex; gap: 12px; margin-top: 14px; padding: 14px 16px;
  border-radius: 12px; background: rgba(216,243,220,0.55);
  border-left: 3px solid var(--primary-light);
}
.quote-card i { color: var(--accent); font-size: 13px; margin-top: 3px; }
.quote-card p { font-family: 'Noto Serif SC', serif; font-size: 12.5px; color: var(--primary); }

/* ====== 功能详解 ====== */
.guide-lead { color: var(--fg-muted) !important; font-size: 12px !important; line-height: 1.85 !important; }

.guide-flow {
  display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 8px;
  margin: 16px 0 18px; padding: 12px; border-radius: 12px;
  background: linear-gradient(120deg, rgba(216,243,220,0.6), rgba(255,253,248,0.9));
  border: 1px solid rgba(27,67,50,0.09);
}
.flow-node {
  display: flex; flex-direction: column; gap: 3px; padding: 9px 10px; border-radius: 9px;
  background: rgba(255,255,255,0.8); border: 1px solid rgba(27,67,50,0.08);
  text-align: left; cursor: pointer; font-family: inherit;
  transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s, background 0.2s;
}
.flow-node:hover { border-color: var(--primary-light); transform: translateY(-1px); box-shadow: 0 6px 16px rgba(27,67,50,0.08); background: #fff; }
.flow-idx { font-family: 'Noto Serif SC', serif; font-size: 10px; font-weight: 900; color: var(--accent); letter-spacing: 0.08em; }
.flow-name { font-size: 12px; font-weight: 700; color: var(--primary); line-height: 1.3; }
.flow-tag {
  align-self: flex-start; font-size: 9.5px; font-weight: 700; color: var(--primary-light);
  padding: 1px 7px; border-radius: 999px; background: var(--primary-pale); letter-spacing: 0.04em;
}

/* 模块关键词胶囊 */
.mod-keys { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 8px; }
.mod-key {
  font-size: 9.5px; font-weight: 600; color: var(--primary-light);
  padding: 2px 8px; border-radius: 999px;
  background: rgba(216,243,220,0.55); border: 1px solid rgba(45,106,79,0.14);
}

/* 模块底部跳转 */
.mod-action { margin-top: 11px; }
.mod-go {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 14px; border-radius: 9px; cursor: pointer; font-family: inherit;
  border: 1px solid rgba(27,67,50,0.16); background: rgba(255,253,248,0.9);
  color: var(--primary); font-size: 11.5px; font-weight: 700;
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
}
.mod-go i:first-child { font-size: 11px; color: var(--accent); }
.mod-go-arrow { font-size: 9px; opacity: 0.5; transition: transform 0.2s, opacity 0.2s; }
.mod-go:hover { background: var(--primary); color: #fff; border-color: var(--primary); transform: translateY(-1px); }
.mod-go:hover i { color: var(--accent); }
.mod-go:hover .mod-go-arrow { transform: translateX(3px); opacity: 0.9; }

/* ====== 上手路径 ====== */
.path-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 13px; }
.path-card {
  padding: 15px 15px 14px; border-radius: 12px;
  background: rgba(255,255,255,0.72); border: 1px solid rgba(27,67,50,0.09);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.path-card:hover { border-color: rgba(45,106,79,0.3); box-shadow: 0 10px 24px rgba(27,67,50,0.07); }
.path-head { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 11px; }
.path-icon {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 12.5px;
  background: var(--primary); color: var(--accent);
}
.path-who { font-size: 12.5px; font-weight: 800; color: var(--primary); }
.path-goal { font-size: 10.5px; color: var(--fg-muted); margin-top: 2px; line-height: 1.5; }
.path-steps { list-style: none; display: flex; flex-direction: column; gap: 7px; }
.path-steps li { display: flex; gap: 8px; align-items: flex-start; }
.path-steps em {
  flex-shrink: 0; width: 16px; height: 16px; border-radius: 50%; font-style: normal;
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; font-weight: 800; color: var(--primary);
  background: rgba(216,243,220,0.85); margin-top: 1px;
}
.path-steps span { font-size: 11px; line-height: 1.65; color: var(--fg); }

.mod-list { display: flex; flex-direction: column; gap: 12px; }
.mod-card {
  padding: 16px 18px; border-radius: 13px;
  background: rgba(255,255,255,0.72); border: 1px solid rgba(27,67,50,0.09);
  transition: border-color 0.2s, box-shadow 0.2s;
}
.mod-card:hover { border-color: rgba(45,106,79,0.3); box-shadow: 0 10px 26px rgba(27,67,50,0.07); }
.mod-head { display: flex; gap: 13px; align-items: flex-start; margin-bottom: 12px; }
.mod-badge {
  width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 14px;
  background: var(--primary); color: var(--accent);
}
.mod-titlebox { min-width: 0; flex: 1; }
.mod-kicker { font-size: 9px; letter-spacing: 0.16em; font-weight: 800; color: var(--accent); text-transform: uppercase; }
.mod-titlebox h4 { font-family: 'Noto Serif SC', serif; font-size: 14.5px; font-weight: 900; color: var(--primary); line-height: 1.3; margin: 2px 0 4px; }
.mod-sum { font-size: 11.5px !important; line-height: 1.75 !important; color: var(--fg-muted) !important; }

.mod-points { list-style: none; display: flex; flex-direction: column; gap: 0; }
.mod-points li {
  display: grid; grid-template-columns: 74px minmax(0, 1fr); gap: 12px;
  padding: 7px 0; border-top: 1px dashed rgba(27,67,50,0.1);
}
.mod-points li:first-child { border-top: none; padding-top: 2px; }
.mod-points b {
  font-size: 11px; font-weight: 700; color: var(--primary); line-height: 1.75;
  letter-spacing: 0.02em;
}
.mod-points span { font-size: 11.5px; line-height: 1.8; color: var(--fg); }

.mod-tip {
  display: flex; gap: 9px; align-items: flex-start; margin-top: 10px; padding: 10px 12px;
  border-radius: 10px; background: rgba(255,238,204,0.5); border-left: 3px solid var(--accent);
}
.mod-tip i { color: var(--accent); font-size: 11.5px; margin-top: 2px; }
.mod-tip span { font-size: 11px; line-height: 1.7; color: #7A5B12; }

.feature-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.feature-card {
  display: flex; flex-direction: column; gap: 5px; padding: 14px 14px 13px;
  border-radius: 12px; background: rgba(255,255,255,0.7);
  border: 1px solid rgba(27,67,50,0.09); transition: border-color 0.2s, transform 0.2s;
}
.feature-card:hover { border-color: var(--primary-light); transform: translateY(-1px); }
.feature-icon {
  width: 30px; height: 30px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
  background: var(--primary-pale); color: var(--primary); font-size: 13px; margin-bottom: 3px;
}
.feature-name { font-size: 12.5px; font-weight: 700; color: var(--primary); }
.feature-card small { font-size: 11px; line-height: 1.6; color: var(--fg-muted); }

.tech-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.tech-card { padding: 12px 14px; border-radius: 11px; background: rgba(255,255,255,0.7); border: 1px solid rgba(27,67,50,0.09); }
.tech-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.tech-head i { font-size: 13px; color: var(--primary-light); width: 15px; text-align: center; }
.tech-head span { font-size: 12.5px; font-weight: 700; color: var(--primary); }
.tech-card small { font-size: 11px; color: var(--fg-muted); line-height: 1.6; }

.timeline { list-style: none; position: relative; padding-left: 18px; }
.timeline::before { content: ''; position: absolute; left: 3px; top: 6px; bottom: 6px; width: 1.5px; background: linear-gradient(180deg, var(--primary-pale), rgba(27,67,50,0.12)); }
.timeline li { position: relative; padding-bottom: 14px; }
.timeline li:last-child { padding-bottom: 0; }
.tl-dot { position: absolute; left: -18.5px; top: 5px; width: 8px; height: 8px; border-radius: 50%; background: var(--card); border: 2px solid var(--primary-light); }
.tl-title { font-size: 12.5px; font-weight: 700; color: var(--primary); margin-bottom: 3px; }
.tl-desc { font-size: 11.5px; line-height: 1.75; color: var(--fg-muted); }

.author-card {
  display: flex; gap: 14px; align-items: flex-start; padding: 16px;
  border-radius: 13px; background: linear-gradient(150deg, rgba(216,243,220,0.7), rgba(255,255,255,0.85));
  border: 1px solid rgba(27,67,50,0.11);
}
.author-avatar {
  width: 46px; height: 46px; border-radius: 50%; flex-shrink: 0;
  background: var(--primary); color: var(--accent);
  display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 19px;
  font-family: 'Noto Serif SC', serif;
}
.author-info { min-width: 0; }
.author-name { font-size: 15px; font-weight: 900; color: var(--primary); font-family: 'Noto Serif SC', serif; }
.author-bio { font-size: 11.5px; color: var(--fg-muted); margin-top: 3px; }
.author-links { margin-top: 10px; }
.author-phone {
  display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: 9px;
  border: none; font-family: inherit;
  background: var(--primary); color: #fff; cursor: pointer; transition: background 0.2s;
}
.author-phone i { color: var(--accent); font-size: 12px; }
.author-phone span { font-size: 13.5px; font-weight: 700; letter-spacing: 0.05em; font-variant-numeric: tabular-nums; }
.author-phone em { font-style: normal; font-size: 9.5px; opacity: 0.66; margin-left: 2px; }
.author-phone:hover { background: var(--primary-light); }
.author-phone.copied { background: #1d7a4f; }
.author-phone.copied i { color: #D5F5E3; }

.maintain-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 12px; }
.maintain-card {
  display: flex; gap: 10px; padding: 13px 14px; border-radius: 11px;
  background: rgba(255,255,255,0.7); border: 1px solid rgba(27,67,50,0.09);
}
.maintain-card > i { color: var(--accent); font-size: 13px; margin-top: 2px; }
.maintain-card b { font-size: 12px; color: var(--primary); display: block; margin-bottom: 3px; }
.maintain-card p { font-size: 11px; line-height: 1.65; color: var(--fg-muted); }

.disclaimer-section { background: rgba(255,248,225,0.86); border-color: rgba(245,127,23,0.28); box-shadow: none; }
.disclaimer-section .sec-head h3 { color: #A5610C; }
.disclaimer-section .sec-head h3 i, .disclaimer-section .sec-num { color: #E08A18; }
.disclaimer-section ul { list-style: none; }
.disclaimer-section li { font-size: 11.5px; color: #7A5B12; padding: 4px 0 4px 12px; position: relative; line-height: 1.7; }
.disclaimer-section li::before { content: '·'; position: absolute; left: 0; font-weight: bold; }

.about-footer {
  display: flex; align-items: center; gap: 7px; justify-content: center;
  padding: 6px 0 10px; font-size: 10.5px; color: var(--fg-muted);
}
.about-footer a { color: var(--primary); text-decoration: none; font-weight: 600; }
.about-footer .dot { opacity: 0.5; }

/* ====== 窄屏 ====== */
@media (max-width: 900px) {
  .about-overlay-header { padding: 8px 12px; gap: 8px; }
  .about-head-icon { width: 34px; height: 34px; border-radius: 10px; font-size: 14px; }
  .about-overlay-title { font-size: 15px; }
  .about-overlay-sub { font-size: 9.5px; }
  .about-call-btn { padding: 8px 11px; font-size: 11px; }
  .about-call-btn span { display: none; }
  .about-overlay-body {
    padding: 12px 12px 22px; max-width: none;
    /* 手机上正文整页滚动：内容不再自己滚，交给外层容器 */
    overflow-y: auto; overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
  }
  .about-rail { display: none; }
  .about-content { overflow: visible; gap: 12px; padding-right: 0; }
  .about-hero { padding: 22px 18px 20px; border-radius: 15px; }
  .about-hero h2 { font-size: 21px; }
  .hero-lead { font-size: 12.5px; }
  .hero-metrics { gap: 20px; margin: 18px 0 16px; }
  .metric b { font-size: 20px; }
  .metric span { font-size: 10px; }
  .about-section { padding: 16px 16px; border-radius: 13px; }
  .about-section p { font-size: 12px; }
  .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .tech-grid, .maintain-grid { grid-template-columns: 1fr; }
  .author-phone span { font-size: 13px; }
  .guide-flow { grid-template-columns: repeat(2, minmax(0, 1fr)); margin: 14px 0 14px; }
  .path-grid { grid-template-columns: 1fr; }
  .mod-card { padding: 14px 14px; border-radius: 12px; }
  .mod-points li { grid-template-columns: 62px minmax(0, 1fr); gap: 9px; }
  .mod-points b { font-size: 10.5px; }
  .mod-points span { font-size: 11px; }
  .school-grid { grid-template-columns: 1fr; }
  .school-actions { gap: 9px; }
  .school-map-btn { width: 100%; justify-content: center; }
}
@media (max-width: 420px) {
  .guide-flow { grid-template-columns: 1fr 1fr; }
  .mod-head { gap: 10px; }
  .mod-points li { grid-template-columns: 1fr; gap: 1px; padding: 8px 0; }
  .mod-points b { color: var(--primary-light); }
  .feature-grid { grid-template-columns: 1fr; }
  .hero-actions { width: 100%; }
  .btn-primary, .btn-ghost { flex: 1; justify-content: center; }
}
</style>