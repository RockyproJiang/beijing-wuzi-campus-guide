<template>
  <div class="dc-overlay" @keydown.escape="$emit('close')">
    <header class="dc-topbar">
      <button class="dc-back" title="返回" @click="$emit('close')">
        <i class="fa-solid fa-arrow-left"></i>
      </button>
      <div class="dc-brand">
        <div class="dc-brand-icon"><i class="fa-solid fa-globe"></i></div>
        <div>
          <div class="dc-brand-title">数字校园</div>
          <div class="dc-brand-sub">一站式的校园服务入口</div>
        </div>
      </div>

      <div class="dc-search-wrap">
        <i class="fa-solid fa-magnifying-glass dc-search-icon"></i>
        <input
          v-model="searchQuery"
          class="dc-search"
          type="text"
          placeholder="搜索应用、服务、部门或 VPN 资源…"
          @focus="searchOpen = true"
          @blur="onSearchBlur"
        />
        <button v-if="searchQuery" class="dc-search-clear" @mousedown.prevent="searchQuery = ''">
          <i class="fa-solid fa-xmark"></i>
        </button>
        <div v-if="searchOpen && searchQuery && results.length" class="dc-search-dropdown">
          <button
            v-for="r in results"
            :key="r.type + r.name"
            class="dc-search-item"
            @mousedown.prevent="selectResult(r)"
          >
            <span class="dc-result-icon" :class="'type-' + r.type"><i :class="resultIcon(r)"></i></span>
            <span class="dc-result-text">
              <strong>{{ r.name }}</strong>
              <small>{{ resultMeta(r) }}</small>
            </span>
            <i class="fa-solid fa-chevron-right dc-result-arrow"></i>
          </button>
        </div>
      </div>

      <button v-if="sectionUrl('portal')" class="dc-portal-btn" @click="openUrl(sectionUrl('portal'))">
        <i class="fa-solid fa-arrow-up-right-from-square"></i>
        {{ sectionLabel('portal') }}
      </button>
    </header>

    <div class="dc-body">
      <aside class="dc-side">
        <button
          v-for="s in sections"
          :key="s.id"
          class="dc-side-btn"
          :class="{ active: activeSection === s.id }"
          @click="activeSection = s.id"
        >
          <i :class="s.icon"></i>
          <span>{{ s.label }}</span>
        </button>
        <div class="dc-side-note">
          <i class="fa-solid fa-shield-halved"></i>
          校内系统需校园网或 WebVPN
        </div>
      </aside>

      <main class="dc-main">
        <!-- 首页 -->
        <section v-if="activeSection === 'home'" class="dc-section">
          <div class="dc-hero">
            <div>
              <div class="dc-eyebrow">DIGITAL CAMPUS · BWU</div>
              <h2>把校园服务收进一个入口</h2>
              <p>门户、教务、学工、办事大厅、网费和 VPN 资源，都在这里。</p>
            </div>
            <div class="dc-hero-actions">
              <button v-if="sectionUrl('portal')" class="dc-btn dc-btn-primary" @click="openUrl(sectionUrl('portal'))">
                <i class="fa-solid fa-arrow-up-right-from-square"></i> 进入{{ sectionLabel('portal') }}
              </button>
              <button v-if="sectionUrl('webvpn')" class="dc-btn" @click="openUrl(sectionUrl('webvpn'))">
                <i class="fa-solid fa-shield-halved"></i> {{ sectionLabel('webvpn') }}
              </button>
            </div>
          </div>

          <div class="dc-quick-grid">
            <button
              v-for="(link, i) in quickLinks"
              :key="i"
              class="dc-quick-card"
              @click="openUrl(link.url)"
            >
              <span class="dc-quick-icon" :style="{ background: link.bg, color: link.color }">
                <i :class="link.icon"></i>
              </span>
              <span class="dc-quick-text">
                <strong>{{ link.label }}</strong>
                <small v-if="link.desc">{{ link.desc }}</small>
              </span>
              <i class="fa-solid fa-arrow-up-right-from-square dc-quick-arrow"></i>
            </button>
          </div>

          <div class="dc-home-cols">
            <div class="dc-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-fire"></i> 热门服务</div>
                <button class="dc-link-btn" @click="activeSection = 'apps'">全部服务</button>
              </div>
              <div class="dc-hot-list">
                <button v-for="item in hotServices" :key="item.name" class="dc-hot-item" @click="openService(item)">
                  <i class="fa-solid fa-circle-chevron-right"></i>
                  <span>{{ item.name }}</span>
                </button>
                <div v-if="!hotServices.length" class="dc-empty">暂无热门服务</div>
              </div>
            </div>

            <div class="dc-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-calendar-days"></i> 近期校历</div>
                <button class="dc-link-btn" @click="activeSection = 'calendar'">完整校历</button>
              </div>
              <div class="dc-cal-mini">
                <div v-for="item in calendar.items.slice(0, 5)" :key="item.event" class="dc-cal-row">
                  <span class="dc-cal-date">{{ item.date }}</span>
                  <span class="dc-cal-event">{{ item.event }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="dc-card dc-apps-card">
            <div class="dc-card-head">
              <div class="dc-card-title"><i class="fa-solid fa-grip"></i> 常用应用</div>
              <div class="dc-head-actions">
                <div class="dc-tabs-mini">
                  <button
                    v-for="g in homeAppGroups"
                    :key="g.key"
                    class="dc-tab-mini"
                    :class="{ active: homeAppGroup === g.key }"
                    @click="homeAppGroup = g.key"
                  >
                    {{ g.label }}
                  </button>
                </div>
                <button class="dc-link-btn" @click="activeSection = 'apps'">全部应用</button>
              </div>
            </div>
            <div class="dc-app-grid">
              <button
                v-for="item in homeApps"
                :key="item.name"
                class="dc-app-card"
                @click="openApp(item)"
              >
                <span class="dc-app-icon" :style="appColor(item.color)"><i :class="appIcon(item.name)"></i></span>
                <span class="dc-app-name">{{ item.name }}</span>
              </button>
            </div>
            <div v-if="!homeApps.length" class="dc-empty">暂无应用</div>
          </div>
        </section>

        <!-- 应用 -->
        <section v-if="activeSection === 'apps'" class="dc-section">
          <div class="dc-hero dc-hero-compact">
            <div>
              <div class="dc-eyebrow">APPS &amp; SERVICES</div>
              <h2>应用与服务</h2>
              <p>按门类整理的应用入口，以及可以线上办理的校园服务事项。</p>
            </div>
            <div class="dc-hero-actions">
              <div class="dc-metrics">
                <div class="dc-metric"><b>{{ apps.length }}</b><span>应用</span></div>
                <div class="dc-metric"><b>{{ services.length }}</b><span>服务</span></div>
                <div class="dc-metric"><b>{{ appGroups.length }}</b><span>门类</span></div>
              </div>
            </div>
          </div>

          <div class="dc-toolbar">
            <label class="dc-toolbar-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input v-model="appQuery" type="text" placeholder="在应用里筛选，例如「成绩」「图书馆」…" />
              <button v-if="appQuery" class="dc-toolbar-clear" @click="appQuery = ''">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </label>
            <div class="dc-filter-chips">
              <button
                v-for="g in appGroupChips"
                :key="g.key"
                class="dc-chip-btn"
                :class="{ active: appFilter === g.key }"
                @click="appFilter = g.key"
              >
                <i :class="g.icon"></i>{{ g.label }}
                <em>{{ g.count }}</em>
              </button>
            </div>
          </div>

          <div v-for="grp in visibleAppGroups" :key="grp.key" class="dc-card dc-apps-card">
            <div class="dc-card-head">
              <div class="dc-card-title">
                <i :class="grp.icon"></i> {{ grp.label }}
                <span class="dc-group-count">{{ grp.items.length }}</span>
              </div>
              <span class="dc-group-hint">{{ grp.hint }}</span>
            </div>
            <div class="dc-app-grid dc-app-grid-wide">
              <button
                v-for="item in grp.items"
                :key="item.name"
                class="dc-app-card"
                @click="openApp(item)"
              >
                <span class="dc-app-icon" :style="appColor(item.color)"><i :class="appIcon(item.name)"></i></span>
                <span class="dc-app-name">{{ item.name }}</span>
              </button>
            </div>
          </div>
          <div v-if="!visibleAppGroups.length" class="dc-card"><div class="dc-empty">没有匹配的应用</div></div>

          <div class="dc-home-cols dc-services-row">
            <div class="dc-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-list-check"></i> 服务大厅</div>
                <button v-if="sectionUrl('serviceHall')" class="dc-link-btn" @click="openUrl(sectionUrl('serviceHall'))">打开{{ sectionLabel('serviceHall') }}</button>
              </div>
              <div class="dc-service-list">
                <button v-for="item in services" :key="item.name" class="dc-service-row" @click="openService(item)">
                  <span class="dc-service-name">{{ item.name }}</span>
                  <span class="dc-service-dept">{{ item.dept || '—' }}</span>
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div v-if="!services.length" class="dc-empty">暂无服务</div>
              </div>
            </div>
            <div class="dc-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-clipboard-list"></i> 办事大厅事项</div>
                <button v-if="sectionUrl('affairHall')" class="dc-link-btn" @click="openUrl(sectionUrl('affairHall'))">打开{{ sectionLabel('affairHall') }}</button>
              </div>
              <div class="dc-service-list">
                <button v-for="item in serviceHallItems" :key="item.name" class="dc-service-row" @click="openEntry(item, 'affairHall')">
                  <span class="dc-service-name">{{ item.name }}</span>
                  <span class="dc-service-dept">{{ item.dept || '—' }}</span>
                  <i class="fa-solid fa-chevron-right"></i>
                </button>
                <div v-if="!serviceHallItems.length" class="dc-empty">暂无事项</div>
              </div>
            </div>
          </div>

          <div class="dc-card dc-apps-card">
            <div class="dc-card-head">
              <div class="dc-card-title"><i class="fa-solid fa-calendar-check"></i> 预约大厅</div>
              <button v-if="sectionUrl('bookingHall')" class="dc-link-btn" @click="openUrl(sectionUrl('bookingHall'))">打开{{ sectionLabel('bookingHall') }}</button>
            </div>
            <div class="dc-book-grid">
              <button v-for="item in bookingHallItems" :key="item.name" class="dc-book-card" @click="openEntry(item, 'bookingHall')">
                <span class="dc-book-icon"><i class="fa-solid fa-calendar-check"></i></span>
                <span class="dc-book-text">
                  <strong>{{ item.name }}</strong>
                  <small>{{ item.dept || '预约大厅' }}</small>
                </span>
                <i class="fa-solid fa-chevron-right dc-book-arrow"></i>
              </button>
              <div v-if="!bookingHallItems.length" class="dc-empty">暂无预约项目</div>
            </div>
          </div>
        </section>

        <!-- 学生系统 -->
        <section v-if="activeSection === 'student'" class="dc-section">
          <div class="dc-section-head">
            <div>
              <div class="dc-eyebrow">STUDENT SYSTEM</div>
              <h2>{{ stuMenu.name || '学生管理系统' }}</h2>
            </div>
            <button v-if="sectionUrl('stuSystem')" class="dc-btn dc-btn-primary" @click="openUrl(sectionUrl('stuSystem'))">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开{{ sectionLabel('stuSystem') }}
            </button>
          </div>
          <div class="dc-menu-grid">
            <div v-for="group in stuMenu.groups" :key="group.name" class="dc-card dc-menu-card">
              <div class="dc-menu-head" :style="{ background: group.color, color: group.textColor }">
                <i :class="group.icon"></i>
                <strong>{{ group.name }}</strong>
                <span>{{ group.items?.length || 0 }} 项</span>
              </div>
              <div class="dc-chip-wrap">
                <button
                  v-for="item in toEntries(group.items)"
                  :key="item.name"
                  class="dc-chip"
                  @click="openEntry(item, 'stuSystem')"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="!stuMenu.groups?.length" class="dc-empty">暂无学生系统菜单</div>
        </section>

        <!-- 教务系统 -->
        <section v-if="activeSection === 'edu'" class="dc-section">
          <div class="dc-section-head">
            <div>
              <div class="dc-eyebrow">ACADEMIC SYSTEM</div>
              <h2>{{ eduMenu.name || '教务服务' }}</h2>
            </div>
            <button v-if="sectionUrl('eduSystem')" class="dc-btn dc-btn-primary" @click="openUrl(sectionUrl('eduSystem'))">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> 打开{{ sectionLabel('eduSystem') }}
            </button>
          </div>
          <div class="dc-menu-grid">
            <div v-for="section in eduMenu.sections" :key="section.name" class="dc-card dc-menu-card">
              <div class="dc-menu-head" :style="{ background: section.color, color: section.textColor }">
                <i :class="section.icon"></i>
                <strong>{{ section.name }}</strong>
                <span>{{ section.items?.length || 0 }} 项</span>
              </div>
              <div class="dc-chip-wrap">
                <button
                  v-for="item in toEntries(section.items)"
                  :key="item.name"
                  class="dc-chip"
                  @click="openEntry(item, 'eduSystem')"
                >
                  {{ item.name }}
                </button>
              </div>
            </div>
          </div>
          <div v-if="!eduMenu.sections?.length" class="dc-empty">暂无教务菜单</div>
        </section>

        <!-- 网费 -->
        <section v-if="activeSection === 'netfee'" class="dc-section">
          <div class="dc-section-head">
            <div>
              <div class="dc-eyebrow">NETWORK FEE</div>
              <h2>{{ netFee.title || '网费服务' }}</h2>
            </div>
            <button v-if="netFee.url" class="dc-btn dc-btn-primary" @click="openUrl(netFee.url)">
              <i class="fa-solid fa-arrow-up-right-from-square"></i> 去充值
            </button>
          </div>

          <div class="dc-home-cols">
            <div class="dc-card dc-net-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-calculator"></i> 流量费用估算</div>
              </div>
              <div class="dc-net-calc">
                <label class="dc-net-input">
                  <span>本月预计使用</span>
                  <div><input v-model.number="gb" type="number" min="0" step="1" /> GB</div>
                </label>
                <div class="dc-net-result">
                  <span>预计网费</span>
                  <strong>¥ {{ cost }}</strong>
                  <small>每月赠送 5GB，1 元/GB，30 元封顶</small>
                </div>
              </div>
              <div class="dc-net-note">{{ netFee.calc }}</div>
              <div v-if="netFee.rechargeTime" class="dc-net-time">
                <i class="fa-solid fa-clock"></i> 充值时间：{{ netFee.rechargeTime }}
              </div>
            </div>

            <div class="dc-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-lightbulb"></i> 小提示</div>
              </div>
              <ul class="dc-tips">
                <li v-for="tip in netFee.tips" :key="tip">{{ tip }}</li>
              </ul>
              <div v-if="netFee.contacts?.length" class="dc-net-contacts">
                <span v-for="c in netFee.contacts" :key="c" class="dc-net-contact">{{ c }}</span>
              </div>
              <div v-if="netFee.note" class="dc-net-note" style="margin-top:10px;">{{ netFee.note }}</div>
            </div>
          </div>
        </section>

        <!-- 部门 -->
        <section v-if="activeSection === 'departments'" class="dc-section">
          <div class="dc-section-head">
            <div>
              <div class="dc-eyebrow">DEPARTMENTS</div>
              <h2>部门通讯录</h2>
            </div>
            <label class="dc-inline-search">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input v-model="deptQuery" placeholder="搜索部门、电话或地址…" />
            </label>
          </div>
          <div class="dc-dept-grid">
            <div v-for="d in filteredDepartments" :key="d.name" class="dc-card dc-dept-card">
              <div class="dc-dept-name"><i class="fa-solid fa-building-columns"></i> {{ d.name }}</div>
              <div v-if="d.addr" class="dc-dept-line"><i class="fa-solid fa-location-dot"></i> {{ d.addr }}</div>
              <div v-if="d.tel" class="dc-dept-line">
                <i class="fa-solid fa-phone"></i>
                <a :href="'tel:' + d.tel">{{ d.tel }}</a>
              </div>
              <div v-if="d.fax" class="dc-dept-line"><i class="fa-solid fa-fax"></i> {{ d.fax }}</div>
              <div v-if="d.email" class="dc-dept-line">
                <i class="fa-solid fa-envelope"></i>
                <a :href="'mailto:' + d.email">{{ d.email }}</a>
              </div>
              <div v-if="d.web" class="dc-dept-line">
                <i class="fa-solid fa-globe"></i>
                <button class="dc-text-link" @click="openUrl(d.web)">访问网站</button>
              </div>
            </div>
          </div>
          <div v-if="!filteredDepartments.length" class="dc-empty">没有匹配的部门</div>
        </section>

        <!-- VPN -->
        <section v-if="activeSection === 'vpn'" class="dc-section">
          <div class="dc-section-head">
            <div>
              <div class="dc-eyebrow">WEBVPN RESOURCES</div>
              <h2>校外访问资源</h2>
            </div>
            <button v-if="sectionUrl('webvpn')" class="dc-btn dc-btn-primary" @click="openUrl(sectionUrl('webvpn'))">
              <i class="fa-solid fa-shield-halved"></i> 打开 {{ sectionLabel('webvpn') }}
            </button>
          </div>
          <div class="dc-home-cols">
            <div class="dc-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-link"></i> 业务系统</div>
              </div>
              <div class="dc-link-list">
                <button v-for="item in vpnBusiness" :key="item.name" class="dc-link-row" @click="openUrl(item.url)">
                  <span>{{ item.name }}</span>
                  <code>{{ item.url }}</code>
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
                <div v-if="!vpnBusiness.length" class="dc-empty">暂无资源</div>
              </div>
            </div>
            <div class="dc-card">
              <div class="dc-card-head">
                <div class="dc-card-title"><i class="fa-solid fa-book"></i> 图书馆资源</div>
              </div>
              <div class="dc-link-list">
                <button v-for="item in vpnLibrary" :key="item.name" class="dc-link-row" @click="openUrl(item.url)">
                  <span>{{ item.name }}</span>
                  <code>{{ item.url }}</code>
                  <i class="fa-solid fa-arrow-up-right-from-square"></i>
                </button>
                <div v-if="!vpnLibrary.length" class="dc-empty">暂无资源</div>
              </div>
            </div>
          </div>
        </section>

        <!-- 校历 -->
        <section v-if="activeSection === 'calendar'" class="dc-section">
          <div class="dc-section-head">
            <div>
              <div class="dc-eyebrow">ACADEMIC CALENDAR</div>
              <h2>{{ calendar.title || '校历' }}</h2>
            </div>
          </div>
          <div class="dc-card dc-calendar-card">
            <div class="dc-cal-timeline">
              <div v-for="item in calendar.items" :key="item.event" class="dc-cal-event">
                <div class="dc-cal-dot"></div>
                <div class="dc-cal-content">
                  <div class="dc-cal-event-name">{{ item.event }}</div>
                  <div class="dc-cal-event-date">{{ item.date }}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>

    <!-- 搜索结果详情 -->
    <div v-if="selected" class="dc-modal-backdrop" @click.self="selected = null">
      <div class="dc-modal">
        <div class="dc-modal-head">
          <div class="dc-modal-title">{{ selected.name }}</div>
          <button class="dc-modal-close" @click="selected = null"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="dc-modal-body">
          <template v-if="selected.kind === 'dept'">
            <div v-if="selected.addr" class="dc-modal-line"><i class="fa-solid fa-location-dot"></i> {{ selected.addr }}</div>
            <div v-if="selected.tel" class="dc-modal-line"><i class="fa-solid fa-phone"></i> <a :href="'tel:' + selected.tel">{{ selected.tel }}</a></div>
            <div v-if="selected.email" class="dc-modal-line"><i class="fa-solid fa-envelope"></i> <a :href="'mailto:' + selected.email">{{ selected.email }}</a></div>
            <div v-if="selected.web" class="dc-modal-line"><i class="fa-solid fa-globe"></i> <a :href="normalizeUrl(selected.web)" target="_blank" rel="noopener">访问网站</a></div>
          </template>
          <template v-else-if="selected.kind === 'service'">
            <div class="dc-modal-desc">{{ selected.dept || '校园服务事项' }}</div>
            <div class="dc-modal-actions">
              <button v-if="sectionUrl('serviceHall')" class="dc-btn dc-btn-primary" @click="openUrl(sectionUrl('serviceHall'))">打开{{ sectionLabel('serviceHall') }}</button>
              <button v-if="sectionUrl('portal')" class="dc-btn" @click="openUrl(sectionUrl('portal'))">{{ sectionLabel('portal') }}</button>
            </div>
          </template>
          <template v-else>
            <div class="dc-modal-desc">该应用需要在{{ sectionLabel('portal') }}中打开，登录后即可使用。</div>
            <div class="dc-modal-actions">
              <button v-if="sectionUrl('portal')" class="dc-btn dc-btn-primary" @click="openUrl(sectionUrl('portal'))">进入{{ sectionLabel('portal') }}</button>
              <button v-if="sectionUrl('webvpn')" class="dc-btn" @click="openUrl(sectionUrl('webvpn'))">通过 {{ sectionLabel('webvpn') }} 访问</button>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  calendar: { type: Object, default: () => ({ title: '', items: [] }) },
  digitalCampus: { type: Object, default: () => ({}) },
})
defineEmits(['close'])

const activeSection = ref('home')
const searchQuery = ref('')
const searchOpen = ref(false)
const deptQuery = ref('')
const selected = ref(null)
const gb = ref(10)

const dc = computed(() => props.digitalCampus || {})

// 后台可以给每一条填「名称 + 链接 + 简介」；老数据是纯字符串，这里统一成对象
function toEntry(x) {
  if (typeof x === 'string') return { name: x, dept: '', url: '', desc: '' }
  if (x && typeof x === 'object') {
    return {
      name: String(x.name ?? ''),
      dept: String(x.dept ?? ''),
      url: String(x.url ?? ''),
      desc: String(x.desc ?? ''),
    }
  }
  return { name: '', dept: '', url: '', desc: '' }
}
function toEntries(list) {
  return (Array.isArray(list) ? list : []).map(toEntry).filter((x) => x.name || x.url)
}

// 老数据的 7 个固定入口（仅在没有 entries 时使用）
const LEGACY_LABELS = {
  portal: '数字校园门户',
  affairHall: '办事大厅',
  serviceHall: '服务大厅',
  bookingHall: '预约大厅',
  eduSystem: '教务系统',
  stuSystem: '学生管理系统',
  webvpn: 'WebVPN',
}
// 越靠前越具体，先认领，避免「教务处」被教务系统抢走
const SECTION_MATCH = [
  ['webvpn', /vpn/i],
  ['bookingHall', /预约/],
  ['stuSystem', /学生管理|学工/],
  ['eduSystem', /教务系统|教务服务|^教务$/],
  ['serviceHall', /服务大厅|服务平台|教务处/],
  ['affairHall', /办事|办公室/],
  ['portal', /门户|数字校园/],
]

// 版块按钮用的名字/链接：在入口清单里按名字认领，认领不到再退回老字段
const sectionMap = computed(() => {
  const list = toEntries(dc.value.entries).filter((x) => x.url)
  const used = new Set()
  const map = {}
  for (const [key, test] of SECTION_MATCH) {
    const hit = list.find((x, i) => !used.has(i) && test.test(x.name))
    if (!hit) continue
    used.add(list.indexOf(hit))
    map[key] = hit
  }
  const labels = dc.value.linkLabels || {}
  for (const key of Object.keys(LEGACY_LABELS)) {
    if (map[key]) continue
    const url = String(dc.value[key] || '').trim()
    if (!url) continue
    const custom = String(labels[key] || '').trim()
    map[key] = { name: custom || LEGACY_LABELS[key], url, desc: '', dept: '' }
  }
  return map
})

function sectionUrl(key) {
  const hit = sectionMap.value[key]
  return hit ? hit.url : ''
}
function sectionLabel(key) {
  const hit = sectionMap.value[key]
  return (hit && hit.name) || LEGACY_LABELS[key] || key
}

const apps = computed(() => toEntries(dc.value.apps))
const hotServices = computed(() => toEntries(dc.value.hotServices))
const services = computed(() => toEntries(dc.value.services))
const serviceHallItems = computed(() => toEntries(dc.value.serviceHallItems))
const bookingHallItems = computed(() => toEntries(dc.value.bookingHallItems))
const departments = computed(() => dc.value.departments || [])
const vpnBusiness = computed(() => dc.value.vpnBusiness || [])
const vpnLibrary = computed(() => dc.value.vpnLibrary || [])
const stuMenu = computed(() => dc.value.stuSystemMenu || { name: '学生管理系统', groups: [] })
const eduMenu = computed(() => dc.value.eduSystemMenu || { name: '教务服务', sections: [] })
const netFee = computed(() => ({
  title: '网费服务',
  url: '',
  calc: '',
  tips: [],
  rechargeTime: '',
  contacts: [],
  note: '',
  ...(dc.value.netFee || {}),
}))

const sections = [
  { id: 'home', label: '首页', icon: 'fa-solid fa-house' },
  { id: 'apps', label: '应用与服务', icon: 'fa-solid fa-grid-2' },
  { id: 'student', label: '学生系统', icon: 'fa-solid fa-user-graduate' },
  { id: 'edu', label: '教务系统', icon: 'fa-solid fa-book-open' },
  { id: 'netfee', label: '网费', icon: 'fa-solid fa-wifi' },
  { id: 'departments', label: '部门', icon: 'fa-solid fa-building' },
  { id: 'vpn', label: 'VPN', icon: 'fa-solid fa-shield-halved' },
  { id: 'calendar', label: '校历', icon: 'fa-solid fa-calendar-days' },
]

// ===== 应用分组：把扁平的应用名归纳到门类，避免「全堆在一起」 =====
const APP_GROUPS = [
  {
    key: 'study',
    label: '教学与学业',
    icon: 'fa-solid fa-book-open',
    hint: '选课、课表、成绩、评教与教学平台',
    test: /课表|选课|评教|成绩|考试|教务|教学|培养|实践|实习|毕设|论文|慕课|云平台|学习/,
  },
  {
    key: 'library',
    label: '图书与科研',
    icon: 'fa-solid fa-book',
    hint: '借阅、检索、知网与科研管理',
    test: /图书|借阅|检索|知网|文献|论文|科研|知识产权|期刊/,
  },
  {
    key: 'affairs',
    label: '学工与生活',
    icon: 'fa-solid fa-user-graduate',
    hint: '学籍、奖惩、资助、请假与宿舍',
    test: /学籍|奖|助|困难|资助|励志|勤工|请假|去向|留校|宿舍|文明|入学|迎新|毕业|就业|招聘|档案|心理|社团|志愿/,
  },
  {
    key: 'money',
    label: '财务与校园卡',
    icon: 'fa-solid fa-credit-card',
    hint: '校园卡、网费、缴费与报销',
    test: /校园卡|一卡通|流水|计费|网费|财务|缴费|报销|发票|收费/,
  },
  {
    key: 'it',
    label: '网络与安全',
    icon: 'fa-solid fa-shield-halved',
    hint: 'VPN、邮箱、正版软件与安全服务',
    test: /VPN|vpn|邮箱|正版|软件|网络|安全|门户|认证|云盘|密码/,
  },
]

function guessGroup(name) {
  for (const g of APP_GROUPS) if (g.test.test(name)) return g.key
  return 'other'
}

const appList = computed(() => {
  const list = apps.value
    .filter((x) => x.name.trim())
    .map((item, i) => ({
      name: item.name,
      url: item.url,
      color: i,
      group: guessGroup(item.name),
    }))
  return list
})

const appGroups = computed(() => {
  const map = new Map()
  for (const item of appList.value) {
    if (!map.has(item.group)) map.set(item.group, [])
    map.get(item.group).push(item)
  }
  const order = [...APP_GROUPS.map((g) => g.key), 'other']
  return order
    .filter((k) => map.has(k))
    .map((k) => {
      const meta = APP_GROUPS.find((g) => g.key === k) || {
        key: 'other',
        label: '其他应用',
        icon: 'fa-solid fa-ellipsis',
        hint: '暂未归类的入口',
      }
      return { ...meta, items: map.get(k) }
    })
})

const appFilter = ref('all')
const appQuery = ref('')

const appGroupChips = computed(() => [
  { key: 'all', label: '全部', icon: 'fa-solid fa-grip', count: appList.value.length },
  ...appGroups.value.map((g) => ({ key: g.key, label: g.label, icon: g.icon, count: g.items.length })),
])

const visibleAppGroups = computed(() => {
  const q = appQuery.value.trim().toLowerCase()
  return appGroups.value
    .filter((g) => appFilter.value === 'all' || g.key === appFilter.value)
    .map((g) => ({
      ...g,
      items: q ? g.items.filter((x) => x.name.toLowerCase().includes(q)) : g.items,
    }))
    .filter((g) => g.items.length)
})

const homeAppGroup = ref('quick')
const homeAppGroups = computed(() => [
  { key: 'quick', label: '高频' },
  ...appGroups.value.slice(0, 2).map((g) => ({ key: g.key, label: g.label })),
])

const homeApps = computed(() => {
  if (homeAppGroup.value === 'quick') {
    const picked = []
    for (const g of appGroups.value) {
      if (g.items[0]) picked.push(g.items[0])
    }
    return picked.slice(0, 8)
  }
  const g = appGroups.value.find((x) => x.key === homeAppGroup.value)
  return (g ? g.items : []).slice(0, 12)
})

const QUICK_PALETTE = [
  { icon: 'fa-solid fa-house', bg: '#D8F3DC', color: '#1B4332' },
  { icon: 'fa-solid fa-clipboard-list', bg: '#FDEBD0', color: '#935116' },
  { icon: 'fa-solid fa-headset', bg: '#D6EAF8', color: '#1A5276' },
  { icon: 'fa-solid fa-calendar-check', bg: '#F4ECF7', color: '#7A4B8C' },
  { icon: 'fa-solid fa-book-open', bg: '#D5F5E3', color: '#145A32' },
  { icon: 'fa-solid fa-user-graduate', bg: '#FADBD8', color: '#943126' },
  { icon: 'fa-solid fa-shield-halved', bg: '#E8EAF6', color: '#283593' },
  { icon: 'fa-solid fa-globe', bg: '#E0F2F1', color: '#004D40' },
]

// 入口清单：后台维护「名称 + 链接 + 简介」；老数据没有 entries 就用 7 个固定入口兜底
const entries = computed(() => {
  const list = toEntries(dc.value.entries)
  if (list.length) return list.filter((x) => x.url)
  return [
    { label: sectionLabel('portal'), url: sectionUrl('portal'), desc: '统一身份认证入口' },
    { label: sectionLabel('affairHall'), url: sectionUrl('affairHall'), desc: '线上办理校园事务' },
    { label: sectionLabel('serviceHall'), url: sectionUrl('serviceHall'), desc: '服务事项与进度' },
    { label: sectionLabel('bookingHall'), url: sectionUrl('bookingHall'), desc: '空间与场馆预约' },
    { label: sectionLabel('eduSystem'), url: sectionUrl('eduSystem'), desc: '选课、课表、成绩' },
    { label: sectionLabel('stuSystem'), url: sectionUrl('stuSystem'), desc: '学籍、资助、请假' },
    { label: sectionLabel('webvpn'), url: sectionUrl('webvpn'), desc: '校外访问校内资源' },
  ].filter((x) => x.url)
})

const quickLinks = computed(() =>
  entries.value.map((item, i) => {
    const skin = QUICK_PALETTE[i % QUICK_PALETTE.length]
    return {
      label: item.name || item.label || '',
      url: item.url,
      desc: item.desc || '',
      icon: skin.icon,
      bg: skin.bg,
      color: skin.color,
    }
  })
)

const filteredDepartments = computed(() => {
  const q = deptQuery.value.trim().toLowerCase()
  if (!q) return departments.value
  return departments.value.filter((d) =>
    `${d.name} ${d.addr} ${d.tel} ${d.email} ${d.web}`.toLowerCase().includes(q)
  )
})

const results = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const list = []
  for (const app of apps.value) {
    if (app.name.toLowerCase().includes(q)) list.push({ type: 'app', name: app.name, url: app.url })
  }
  for (const item of services.value) {
    if (`${item.name} ${item.dept}`.toLowerCase().includes(q)) list.push({ type: 'service', name: item.name, dept: item.dept, url: item.url })
  }
  for (const item of [...serviceHallItems.value, ...bookingHallItems.value]) {
    if (`${item.name} ${item.dept}`.toLowerCase().includes(q) && !list.some((x) => x.name === item.name)) {
      list.push({ type: 'service', name: item.name, dept: item.dept, url: item.url })
    }
  }
  for (const item of hotServices.value) {
    if (item.name.toLowerCase().includes(q)) list.push({ type: 'hot', name: item.name, url: item.url })
  }
  for (const d of departments.value) {
    if (`${d.name} ${d.addr} ${d.tel} ${d.email}`.toLowerCase().includes(q)) list.push({ type: 'dept', name: d.name, ...d })
  }
  for (const v of [...vpnBusiness.value, ...vpnLibrary.value]) {
    if (v.name.toLowerCase().includes(q)) list.push({ type: 'vpn', name: v.name, url: v.url })
  }
  for (const g of stuMenu.value.groups || []) {
    for (const item of toEntries(g.items)) {
      if (item.name.toLowerCase().includes(q)) list.push({ type: 'menu', name: item.name, url: item.url, system: 'student' })
    }
  }
  for (const s of eduMenu.value.sections || []) {
    for (const item of toEntries(s.items)) {
      if (item.name.toLowerCase().includes(q)) list.push({ type: 'menu', name: item.name, url: item.url, system: 'edu' })
    }
  }
  return list.slice(0, 12)
})

const cost = computed(() => {
  const value = Math.max(0, Number(gb.value) || 0)
  return Math.min(30, Math.max(0, value - 5))
})

const palettes = [
  ['#E3F0E6', '#1B4332'],
  ['#F6ECD6', '#8A6420'],
  ['#E7EEF8', '#3C5F85'],
  ['#F4ECF7', '#7A4B8C'],
  ['#FDEBE8', '#A55B34'],
  ['#E8F6F3', '#1F6F63'],
]

function appColor(index) {
  const [bg, color] = palettes[index % palettes.length]
  return { background: bg, color }
}

function appIcon(name) {
  if (/课表|选课|评教|成绩|教务|考试|教学/.test(name)) return 'fa-solid fa-book-open'
  if (/借阅|图书馆|论文|知网/.test(name)) return 'fa-solid fa-book'
  if (/校园卡|流水|计费|网费|财务/.test(name)) return 'fa-solid fa-credit-card'
  if (/就业|招聘|毕业/.test(name)) return 'fa-solid fa-briefcase'
  if (/请假|去向|留校|假期/.test(name)) return 'fa-solid fa-calendar-check'
  if (/宿舍|文明/.test(name)) return 'fa-solid fa-bed'
  if (/奖|助|困难|资助|励志/.test(name)) return 'fa-solid fa-award'
  if (/慕课|教学云|平台/.test(name)) return 'fa-solid fa-laptop'
  if (/导师|研究生/.test(name)) return 'fa-solid fa-user-graduate'
  if (/VPN|vpn/.test(name)) return 'fa-solid fa-shield-halved'
  return 'fa-solid fa-circle-nodes'
}

function normalizeUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (/^\d{1,3}(\.\d{1,3}){3}/.test(url)) return 'http://' + url
  return 'https://' + url
}

function openUrl(url) {
  const target = normalizeUrl(url)
  if (!target) return
  window.open(target, '_blank', 'noopener')
}

// 条目自带链接就打开它，否则退回该版块的默认入口
function openEntry(item, fallbackKey) {
  const own = item && item.url
  if (own) {
    openUrl(own)
    return
  }
  openUrl(sectionUrl(fallbackKey))
}

function openApp(item) {
  const entry = typeof item === 'string' ? toEntry(item) : item
  if (entry && entry.url) {
    openUrl(entry.url)
    return
  }
  selected.value = { kind: 'app', name: entry?.name || '' }
}

function openService(item) {
  const entry = typeof item === 'string' ? toEntry(item) : item
  const name = entry?.name || ''
  if (entry && entry.url) {
    openUrl(entry.url)
    return
  }
  const found = services.value.find((x) => x.name === name)
  selected.value = { kind: 'service', name, dept: found?.dept || '' }
}

function resultIcon(r) {
  if (r.type === 'app') return appIcon(r.name)
  if (r.type === 'service') return 'fa-solid fa-headset'
  if (r.type === 'hot') return 'fa-solid fa-fire'
  if (r.type === 'dept') return 'fa-solid fa-building-columns'
  if (r.type === 'vpn') return 'fa-solid fa-shield-halved'
  return 'fa-solid fa-list-check'
}

function resultMeta(r) {
  if (r.type === 'app') return '应用'
  if (r.type === 'service') return r.dept || '服务事项'
  if (r.type === 'hot') return '热门服务'
  if (r.type === 'dept') return r.addr || '部门'
  if (r.type === 'vpn') return 'VPN 资源'
  return r.system === 'student' ? '学生系统菜单' : '教务系统菜单'
}

function selectResult(r) {
  searchQuery.value = ''
  searchOpen.value = false
  if (r.type === 'dept') {
    activeSection.value = 'departments'
    deptQuery.value = r.name
    return
  }
  if (r.type === 'service') {
    openService({ name: r.name, dept: r.dept || '', url: r.url || '' })
    return
  }
  if (r.type === 'app' || r.type === 'hot') {
    openApp({ name: r.name, url: r.url || '' })
    return
  }
  if (r.type === 'vpn') {
    openUrl(r.url)
    return
  }
  if (r.type === 'menu') {
    openEntry({ name: r.name, url: r.url || '' }, r.system === 'student' ? 'stuSystem' : 'eduSystem')
  }
}

function onSearchBlur() {
  setTimeout(() => { searchOpen.value = false }, 150)
}
</script>

<style scoped>
.dc-overlay {
  position: fixed;
  inset: 0;
  z-index: 195;
  padding-top: 56px;
  overflow-y: auto;
  background: transparent;
  animation: dcIn 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes dcIn { from { opacity: 0; transform: scale(0.985); filter: blur(5px); } to { opacity: 1; transform: scale(1); filter: blur(0); } }

.dc-topbar {
  position: sticky;
  top: 0;
  z-index: 8;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background: rgba(255, 253, 248, 0.82);
  border-bottom: 1px solid rgba(27, 67, 50, 0.12);
  backdrop-filter: blur(20px) saturate(1.15);
}
.dc-back { width: 38px; height: 38px; border-radius: 10px; border: 1.5px solid var(--border); background: var(--card); color: var(--primary); cursor: pointer; flex-shrink: 0; }
.dc-back:hover { background: var(--primary); color: #fff; border-color: var(--primary); }
.dc-brand { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.dc-brand-icon { width: 40px; height: 40px; border-radius: 11px; background: var(--primary); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 17px; }
.dc-brand-title { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 17px; color: var(--primary); line-height: 1.2; }
.dc-brand-sub { font-size: 10.5px; color: var(--fg-muted); }
.dc-search-wrap { position: relative; flex: 1; max-width: 480px; margin-left: auto; z-index: 20; }
.dc-search { width: 100%; padding: 9px 38px; border-radius: 10px; border: 1.5px solid var(--border); background: rgba(255, 253, 248, 0.9); font-size: 12.5px; font-family: inherit; outline: none; }
.dc-search:focus { border-color: var(--primary-light); box-shadow: 0 0 0 4px rgba(216, 243, 220, 0.65); }
.dc-search-icon { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); color: var(--fg-muted); font-size: 13px; }
.dc-search-clear { position: absolute; right: 9px; top: 50%; transform: translateY(-50%); border: none; background: none; color: var(--fg-muted); cursor: pointer; }
.dc-search-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: rgba(255, 253, 248, 0.98); border: 1px solid rgba(27, 67, 50, 0.14); border-radius: 12px; box-shadow: 0 20px 50px rgba(27, 67, 50, 0.2); overflow: hidden; max-height: 380px; overflow-y: auto; }
.dc-search-item { display: flex; align-items: center; gap: 9px; width: 100%; padding: 9px 12px; border: none; background: none; text-align: left; cursor: pointer; }
.dc-search-item:hover { background: rgba(216, 243, 220, 0.55); }
.dc-result-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; background: var(--primary-pale); color: var(--primary); flex-shrink: 0; }
.dc-result-icon.type-dept { background: #E7EEF8; color: #3C5F85; }
.dc-result-icon.type-vpn { background: #E8EAF6; color: #283593; }
.dc-result-icon.type-hot { background: #FDEBE8; color: #A55B34; }
.dc-result-text { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.dc-result-text strong { font-size: 12px; color: var(--fg); }
.dc-result-text small { font-size: 10px; color: var(--fg-muted); }
.dc-result-arrow { font-size: 9px; color: var(--border); }
.dc-portal-btn { flex-shrink: 0; padding: 9px 14px; border-radius: 9px; border: none; background: var(--primary); color: #fff; font-size: 12px; font-weight: 600; cursor: pointer; }
.dc-portal-btn:hover { background: var(--primary-light); }

.dc-body { display: flex; gap: 18px; max-width: 1320px; margin: 0 auto; padding: 18px 24px 50px; }
.dc-side {
  width: 190px;
  flex-shrink: 0;
  align-self: flex-start;
  position: sticky;
  top: 70px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px;
  border-radius: 15px;
  background: rgba(255, 253, 248, 0.78);
  border: 1px solid rgba(27, 67, 50, 0.12);
  backdrop-filter: blur(18px) saturate(1.1);
  box-shadow: 0 14px 36px rgba(27, 67, 50, 0.08);
}
.dc-side-btn { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border: none; border-radius: 9px; background: transparent; color: var(--fg-muted); font-size: 12px; text-align: left; cursor: pointer; }
.dc-side-btn i { width: 15px; text-align: center; font-size: 11px; }
.dc-side-btn:hover { background: rgba(216, 243, 220, 0.55); color: var(--primary); }
.dc-side-btn.active { background: var(--primary); color: #fff; font-weight: 600; }
.dc-side-btn.active i { color: var(--accent); }
.dc-side-note { margin-top: 10px; padding: 9px; border-top: 1px dashed rgba(27, 67, 50, 0.12); font-size: 9.5px; line-height: 1.6; color: var(--fg-muted); }
.dc-side-note i { color: var(--accent); margin-right: 4px; }
.dc-main { flex: 1; min-width: 0; overflow-x: hidden; }

.dc-section { animation: dcSectionIn 0.28s ease; }
@keyframes dcSectionIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
.dc-hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 24px 26px;
  border-radius: 18px;
  background:
    linear-gradient(120deg, rgba(255, 253, 248, 0.94), rgba(216, 243, 220, 0.66)),
    radial-gradient(ellipse at 80% 20%, rgba(212, 168, 83, 0.18), transparent 60%);
  border: 1px solid rgba(27, 67, 50, 0.12);
  box-shadow: 0 18px 50px rgba(27, 67, 50, 0.1);
  backdrop-filter: blur(18px);
}
.dc-eyebrow { font-size: 9.5px; letter-spacing: 0.2em; font-weight: 700; color: #9a7a3c; }
.dc-hero h2, .dc-section-head h2 { margin: 4px 0 6px; font-family: 'Noto Serif SC', serif; font-size: 24px; color: var(--primary); }
.dc-hero p { margin: 0; font-size: 12px; color: var(--fg-muted); }
.dc-hero-actions { display: flex; gap: 8px; flex-wrap: wrap; flex-shrink: 0; }
.dc-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 15px; border-radius: 9px; border: 1px solid rgba(27, 67, 50, 0.16); background: rgba(255, 253, 248, 0.9); color: var(--primary); font-size: 11.5px; font-weight: 600; cursor: pointer; }
.dc-btn:hover { border-color: var(--primary-light); background: #fff; }
.dc-btn-primary { background: var(--primary); color: #fff; border-color: var(--primary); }
.dc-btn-primary:hover { background: var(--primary-light); border-color: var(--primary-light); color: #fff; }

.dc-quick-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 9px; margin-top: 13px; }
.dc-quick-card { display: flex; align-items: center; gap: 9px; padding: 11px 12px; border-radius: 12px; background: rgba(255, 253, 248, 0.9); border: 1px solid rgba(27, 67, 50, 0.1); cursor: pointer; text-align: left; backdrop-filter: blur(10px); transition: all 0.2s; }
.dc-quick-card:hover { transform: translateY(-2px); border-color: rgba(45, 106, 79, 0.35); box-shadow: 0 10px 26px rgba(27, 67, 50, 0.12); }
.dc-quick-icon { width: 34px; height: 34px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }
.dc-quick-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dc-quick-text strong { font-size: 11.5px; color: var(--fg); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dc-quick-text small { font-size: 9.5px; color: var(--fg-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dc-quick-arrow { font-size: 8px; color: var(--border); }

.dc-home-cols { display: grid; grid-template-columns: 1.15fr 1fr; gap: 14px; margin-top: 14px; align-items: start; }
.dc-card { background: rgba(255, 253, 248, 0.9); border: 1px solid rgba(27, 67, 50, 0.11); border-radius: 15px; box-shadow: 0 10px 30px rgba(27, 67, 50, 0.07); backdrop-filter: blur(16px) saturate(1.05); overflow: hidden; }
.dc-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 13px 16px; border-bottom: 1px solid rgba(27, 67, 50, 0.08); }
.dc-card-title { display: flex; align-items: center; gap: 7px; font-family: 'Noto Serif SC', serif; font-size: 13px; font-weight: 900; color: var(--primary); }
.dc-card-title i { color: var(--accent); font-size: 12px; }
.dc-link-btn { border: none; background: none; color: var(--primary); font-size: 10.5px; font-weight: 700; cursor: pointer; text-decoration: underline; text-underline-offset: 2px; }

.dc-hot-list { padding: 8px; }
.dc-hot-item { display: flex; align-items: center; gap: 8px; width: 100%; padding: 8px 9px; border: none; background: none; border-radius: 8px; color: var(--fg); font-size: 11.5px; text-align: left; cursor: pointer; }
.dc-hot-item:hover { background: rgba(216, 243, 220, 0.5); }
.dc-hot-item i { color: var(--accent); font-size: 10px; }
.dc-cal-mini { padding: 8px 16px 12px; }
.dc-cal-row { display: flex; gap: 10px; padding: 7px 0; border-bottom: 1px dashed rgba(27, 67, 50, 0.08); font-size: 11.5px; }
.dc-cal-row:last-child { border-bottom: none; }
.dc-cal-date { width: 82px; flex-shrink: 0; color: var(--primary); font-weight: 700; font-size: 10.5px; }
.dc-cal-event { color: var(--fg-muted); }

.dc-app-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 8px; padding: 12px; }
.dc-app-grid-wide { grid-template-columns: repeat(auto-fill, minmax(112px, 1fr)); }
.dc-app-card { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 12px 7px; border-radius: 11px; border: 1px solid transparent; background: rgba(255, 255, 255, 0.42); cursor: pointer; transition: all 0.2s; }
.dc-app-card:hover { background: #fff; border-color: rgba(27, 67, 50, 0.14); transform: translateY(-2px); box-shadow: 0 8px 20px rgba(27, 67, 50, 0.1); }
.dc-app-icon { width: 38px; height: 38px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 15px; }
.dc-app-name { font-size: 10.5px; color: var(--fg); text-align: center; line-height: 1.35; }

/* ===== 应用与服务：门类分组、筛选栏、指标 ===== */
.dc-apps-card { margin-top: 14px; }
.dc-apps-card:first-of-type { margin-top: 0; }
.dc-head-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; justify-content: flex-end; }
.dc-tabs-mini { display: inline-flex; padding: 3px; gap: 2px; border-radius: 9px; background: rgba(27, 67, 50, 0.06); }
.dc-tab-mini { border: none; background: none; padding: 4px 10px; border-radius: 7px; font-size: 10.5px; font-weight: 600; color: var(--fg-muted); cursor: pointer; font-family: inherit; transition: all 0.18s; }
.dc-tab-mini:hover { color: var(--primary); }
.dc-tab-mini.active { background: #fff; color: var(--primary); box-shadow: 0 2px 6px rgba(27, 67, 50, 0.1); }
.dc-group-count { margin-left: 2px; padding: 1px 6px; border-radius: 20px; background: var(--primary-pale); color: var(--primary); font-size: 9.5px; font-weight: 700; font-family: 'Noto Sans SC', sans-serif; }
.dc-group-hint { font-size: 10px; color: var(--fg-muted); text-align: right; }

.dc-hero-compact { padding: 20px 24px; }
.dc-metrics { display: flex; gap: 10px; }
.dc-metric { display: flex; flex-direction: column; align-items: center; min-width: 62px; padding: 8px 12px; border-radius: 11px; background: rgba(255, 255, 255, 0.72); border: 1px solid rgba(27, 67, 50, 0.1); }
.dc-metric b { font-family: 'Noto Serif SC', serif; font-size: 18px; color: var(--primary); line-height: 1.1; font-variant-numeric: tabular-nums; }
.dc-metric span { font-size: 9.5px; color: var(--fg-muted); margin-top: 2px; }

.dc-toolbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 14px 0; padding: 10px 12px; border-radius: 13px; background: rgba(255, 253, 248, 0.88); border: 1px solid rgba(27, 67, 50, 0.1); box-shadow: 0 8px 22px rgba(27, 67, 50, 0.05); }
.dc-toolbar-search { position: relative; display: flex; align-items: center; gap: 8px; flex: 0 1 300px; min-width: 190px; padding: 0 12px; height: 34px; border-radius: 9px; background: #fff; border: 1.5px solid var(--border); transition: border-color 0.18s, box-shadow 0.18s; }
.dc-toolbar-search:focus-within { border-color: var(--primary-light); box-shadow: 0 0 0 4px rgba(216, 243, 220, 0.6); }
.dc-toolbar-search i { font-size: 11px; color: var(--fg-muted); }
.dc-toolbar-search input { flex: 1; min-width: 0; border: none; outline: none; background: none; font-size: 11.5px; font-family: inherit; color: var(--fg); }
.dc-toolbar-clear { border: none; background: none; color: var(--fg-muted); cursor: pointer; padding: 0 2px; }
.dc-filter-chips { display: flex; gap: 6px; flex-wrap: wrap; }
.dc-chip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 6px 11px; border-radius: 20px; border: 1px solid rgba(27, 67, 50, 0.14); background: rgba(255, 255, 255, 0.7); color: var(--fg); font-size: 11px; font-weight: 600; font-family: inherit; cursor: pointer; transition: all 0.18s; }
.dc-chip-btn i { font-size: 10px; color: var(--primary-light); }
.dc-chip-btn em { font-style: normal; font-size: 9.5px; opacity: 0.6; font-variant-numeric: tabular-nums; }
.dc-chip-btn:hover { border-color: rgba(45, 106, 79, 0.4); background: #fff; }
.dc-chip-btn.active { background: var(--primary); color: #fff; border-color: var(--primary); }
.dc-chip-btn.active i, .dc-chip-btn.active em { color: var(--accent); opacity: 0.95; }

.dc-services-row { margin-top: 14px; }
.dc-book-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 8px; padding: 12px; }
.dc-book-card { display: flex; align-items: center; gap: 10px; padding: 11px 13px; border-radius: 11px; border: 1px solid rgba(27, 67, 50, 0.1); background: rgba(255, 255, 255, 0.6); text-align: left; cursor: pointer; transition: all 0.2s; }
.dc-book-card:hover { background: #fff; border-color: rgba(45, 106, 79, 0.32); transform: translateY(-1px); box-shadow: 0 8px 18px rgba(27, 67, 50, 0.09); }
.dc-book-icon { width: 32px; height: 32px; border-radius: 9px; display: flex; align-items: center; justify-content: center; background: var(--primary-pale); color: var(--primary); font-size: 12px; flex-shrink: 0; }
.dc-book-text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.dc-book-text strong { font-size: 11.5px; color: var(--fg); }
.dc-book-text small { font-size: 9.5px; color: var(--fg-muted); }
.dc-book-arrow { font-size: 8px; color: var(--border); }

.dc-section-head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 13px; }
.dc-count { font-size: 10.5px; color: var(--fg-muted); }
.dc-service-list { padding: 6px 8px 10px; }
.dc-service-row { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 10px; border: none; background: none; border-radius: 8px; text-align: left; cursor: pointer; }
.dc-service-row:hover { background: rgba(216, 243, 220, 0.5); }
.dc-service-name { flex: 1; font-size: 11.5px; color: var(--fg); font-weight: 600; }
.dc-service-dept { font-size: 9.5px; color: var(--fg-muted); max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dc-service-row i { font-size: 8px; color: var(--border); }

.dc-menu-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 13px; }
.dc-menu-card { overflow: hidden; }
.dc-menu-head { display: flex; align-items: center; gap: 8px; padding: 12px 15px; }
.dc-menu-head i { font-size: 15px; }
.dc-menu-head strong { flex: 1; font-size: 12.5px; }
.dc-menu-head span { font-size: 9.5px; opacity: 0.7; }
.dc-chip-wrap { display: flex; flex-wrap: wrap; gap: 5px; padding: 12px 15px 15px; }
.dc-chip { padding: 4px 8px; border-radius: 6px; border: 1px solid rgba(27, 67, 50, 0.1); background: rgba(255, 255, 255, 0.55); color: var(--fg); font-size: 10px; cursor: pointer; text-align: left; }
.dc-chip:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

.dc-net-card .dc-card-head { border-bottom: none; }
.dc-net-calc { display: flex; gap: 18px; padding: 16px; align-items: center; }
.dc-net-input { display: flex; flex-direction: column; gap: 4px; font-size: 10.5px; color: var(--fg-muted); }
.dc-net-input div { display: flex; align-items: center; gap: 6px; }
.dc-net-input input { width: 90px; padding: 8px 10px; border: 1.5px solid var(--border); border-radius: 8px; font-size: 14px; font-family: inherit; outline: none; }
.dc-net-input input:focus { border-color: var(--primary-light); }
.dc-net-result { display: flex; flex-direction: column; gap: 2px; padding-left: 16px; border-left: 1px dashed rgba(27, 67, 50, 0.15); }
.dc-net-result span { font-size: 10px; color: var(--fg-muted); }
.dc-net-result strong { font-family: 'Noto Serif SC', serif; font-size: 26px; color: var(--primary); line-height: 1.1; }
.dc-net-result small { font-size: 9px; color: var(--fg-muted); }
.dc-net-note { padding: 0 16px 12px; font-size: 10.5px; line-height: 1.65; color: var(--fg-muted); }
.dc-net-time { padding: 0 16px 16px; font-size: 10.5px; color: var(--primary); }
.dc-net-time i { color: var(--accent); margin-right: 4px; }
.dc-net-contacts { display: flex; flex-wrap: wrap; gap: 5px; padding: 0 16px 14px; }
.dc-net-contact { padding: 3px 8px; border-radius: 6px; background: var(--bg); border: 1px solid var(--border); font-size: 10px; color: var(--fg-muted); }
.dc-tips { margin: 0; padding: 14px 16px 10px 30px; font-size: 10.5px; line-height: 1.8; color: var(--fg-muted); }
.dc-tips li::marker { color: var(--accent); }

.dc-inline-search { display: inline-flex; align-items: center; gap: 8px; width: 220px; padding: 0 12px; height: 34px; border: 1.5px solid var(--border); border-radius: 9px; background: rgba(255, 253, 248, 0.9); transition: border-color 0.18s, box-shadow 0.18s; }
.dc-inline-search:focus-within { border-color: var(--primary-light); box-shadow: 0 0 0 4px rgba(216, 243, 220, 0.6); }
.dc-inline-search i { font-size: 11px; color: var(--fg-muted); }
.dc-inline-search input { flex: 1; min-width: 0; border: none; outline: none; background: none; font-size: 11px; font-family: inherit; color: var(--fg); }
.dc-dept-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dc-dept-card { padding: 14px 15px; }
.dc-dept-name { display: flex; align-items: center; gap: 7px; font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 13px; color: var(--primary); margin-bottom: 7px; }
.dc-dept-name i { color: var(--accent); font-size: 12px; }
.dc-dept-line { display: flex; align-items: flex-start; gap: 7px; font-size: 10.5px; color: var(--fg-muted); line-height: 1.6; margin-top: 2px; }
.dc-dept-line i { width: 12px; color: var(--primary-light); font-size: 9px; margin-top: 3px; }
.dc-dept-line a { color: var(--primary); text-decoration: none; }
.dc-text-link { border: none; background: none; padding: 0; color: var(--primary); font-size: 10.5px; cursor: pointer; text-decoration: underline; }

.dc-link-list { padding: 7px 9px 11px; }
.dc-link-row { display: flex; align-items: center; gap: 9px; width: 100%; padding: 8px 9px; border: none; background: none; border-radius: 7px; text-align: left; cursor: pointer; }
.dc-link-row:hover { background: rgba(216, 243, 220, 0.5); }
.dc-link-row span { flex: 1; font-size: 11px; color: var(--fg); }
.dc-link-row code { font-size: 9px; color: var(--fg-muted); max-width: 45%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dc-link-row i { font-size: 8px; color: var(--border); }

.dc-calendar-card { padding: 6px 18px 16px; }
.dc-cal-timeline { position: relative; padding-left: 22px; border-left: 2px solid rgba(216, 243, 220, 0.9); margin-left: 6px; }
.dc-cal-event { position: relative; padding: 11px 0; }
.dc-cal-dot { position: absolute; left: -29px; top: 16px; width: 10px; height: 10px; border-radius: 50%; background: var(--primary); border: 2px solid #fff; box-shadow: 0 0 0 2px var(--primary); }
.dc-cal-event-name { font-weight: 700; font-size: 12.5px; color: var(--primary); }
.dc-cal-event-date { font-size: 10.5px; color: var(--fg-muted); }

.dc-empty { padding: 26px 18px; text-align: center; font-size: 11px; color: var(--fg-muted); }
.dc-modal-backdrop { position: fixed; inset: 0; z-index: 260; background: rgba(15, 30, 22, 0.42); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; padding: 20px; }
.dc-modal { width: min(460px, 100%); background: rgba(255, 253, 248, 0.98); border-radius: 16px; box-shadow: 0 28px 70px rgba(15, 30, 22, 0.3); border: 1px solid rgba(27, 67, 50, 0.12); }
.dc-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 16px 18px; border-bottom: 1px solid rgba(27, 67, 50, 0.08); }
.dc-modal-title { font-family: 'Noto Serif SC', serif; font-size: 16px; font-weight: 900; color: var(--primary); }
.dc-modal-close { width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border); background: #fff; color: var(--fg-muted); cursor: pointer; }
.dc-modal-body { padding: 16px 18px; }
.dc-modal-desc { font-size: 11.5px; color: var(--fg-muted); line-height: 1.7; margin-bottom: 14px; }
.dc-modal-line { display: flex; gap: 8px; font-size: 11.5px; color: var(--fg); line-height: 1.8; }
.dc-modal-line i { width: 13px; color: var(--primary-light); font-size: 10px; margin-top: 3px; }
.dc-modal-line a { color: var(--primary); }
.dc-modal-actions { display: flex; gap: 8px; flex-wrap: wrap; }

@media (max-width: 1000px) {
  .dc-quick-grid { grid-template-columns: 1fr 1fr; }
  .dc-menu-grid, .dc-dept-grid { grid-template-columns: 1fr; }
}
@media (max-width: 760px) {
  .dc-topbar { flex-wrap: wrap; padding: 8px 12px; }
  .dc-brand-sub { display: none; }
  .dc-search-wrap { order: 5; flex-basis: 100%; max-width: none; }
  .dc-portal-btn { margin-left: auto; }
  .dc-body { flex-direction: column; padding: 12px 12px 40px; gap: 12px; }
  .dc-side { position: static; width: 100%; flex-direction: row; overflow-x: auto; padding: 7px; gap: 4px; }
  .dc-side-btn { flex-shrink: 0; padding: 7px 10px; font-size: 10.5px; }
  .dc-side-note { display: none; }
  .dc-hero { flex-direction: column; align-items: flex-start; padding: 18px; }
  .dc-hero h2 { font-size: 20px; }
  .dc-home-cols { grid-template-columns: 1fr; }
  .dc-quick-grid { grid-template-columns: 1fr 1fr; }
  .dc-app-grid { grid-template-columns: repeat(3, 1fr); }
  .dc-dept-grid { grid-template-columns: 1fr; }
  .dc-section-head { flex-wrap: wrap; align-items: flex-start; }
  .dc-inline-search { width: 100%; }
  .dc-net-calc { flex-direction: column; align-items: flex-start; }
  .dc-net-result { border-left: none; border-top: 1px dashed rgba(27, 67, 50, 0.15); padding: 10px 0 0; width: 100%; }
  .dc-toolbar { flex-direction: column; align-items: stretch; gap: 9px; }
  .dc-toolbar-search { flex: 1 1 auto; min-width: 0; width: 100%; }
  .dc-filter-chips { width: 100%; max-width: 100%; overflow-x: auto; flex-wrap: nowrap; padding-bottom: 2px; }
  .dc-chip-btn { flex-shrink: 0; }
  .dc-metrics { margin-top: 12px; }
  .dc-head-actions { width: 100%; justify-content: space-between; }
  .dc-group-hint { display: none; }
  .dc-book-grid { grid-template-columns: 1fr; }
  .dc-app-grid-wide { grid-template-columns: repeat(3, 1fr); }
}
</style>
