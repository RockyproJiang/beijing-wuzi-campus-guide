<template>
  <div class="inline-panel">
    <div class="inline-panel-header">
      <div class="content-panel-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">
        <i :class="selectedBldg.icon"></i>
      </div>
      <div class="inline-panel-titles">
        <div class="inline-crumb">{{ selectedBldg.catName || activeCategory?.name || '' }}</div>
        <div class="content-panel-title">{{ selectedBldg.name }}</div>
        <div class="content-panel-sub">{{ selectedBldg.sub }}</div>
      </div>
      <button
        v-if="selectedBldg.modelObjects?.length || selectedBldg.pin"
        class="map-pin-btn"
        title="在三维地图中定位"
        @click="$emit('locate', selectedBldg.id)"
      >
        <i class="fa-solid fa-location-crosshairs"></i> <span>3D 定位</span>
      </button>
    </div>

    <div v-if="selectedBldg.intro" class="inline-intro">
      <i class="fa-solid fa-quote-left"></i>
      <p>{{ selectedBldg.intro }}</p>
    </div>

    <div class="l2-tabs">
      <button class="l2-tab-btn" :class="{ active: l2tab === 'info' }" @click="$emit('update:l2tab', 'info')">
        <i class="fa-solid fa-circle-info"></i><span>建筑信息</span>
      </button>
      <button
        v-if="selectedBldg.equipment && selectedBldg.equipment.length > 0"
        class="l2-tab-btn" :class="{ active: l2tab === 'equipment' }"
        @click="$emit('update:l2tab', 'equipment')"
      >
        <i class="fa-solid fa-toolbox"></i><span>设施设备</span>
      </button>
      <button
        v-if="selectedBldg.floors && selectedBldg.floors.length > 0"
        class="l2-tab-btn" :class="{ active: l2tab === 'floors' }"
        @click="$emit('update:l2tab', 'floors')"
      >
        <i class="fa-solid fa-layer-group"></i><span>楼层详情</span>
      </button>
      <button
        v-if="selectedBldg.schedule"
        class="l2-tab-btn" :class="{ active: l2tab === 'schedule' }"
        @click="$emit('update:l2tab', 'schedule')"
      >
        <i class="fa-solid fa-clock"></i><span>上课时间</span>
      </button>
      <button
        v-if="selectedBldg.contacts && selectedBldg.contacts.length"
        class="l2-tab-btn" :class="{ active: l2tab === 'contacts' }"
        @click="$emit('update:l2tab', 'contacts')"
      >
        <i class="fa-solid fa-phone"></i><span>联系电话</span>
      </button>
      <button
        v-if="selectedBldg.surroundings && selectedBldg.surroundings.length"
        class="l2-tab-btn" :class="{ active: l2tab === 'surroundings' }"
        @click="$emit('update:l2tab', 'surroundings')"
      >
        <i class="fa-solid fa-map-location-dot"></i><span>周边设施</span>
      </button>
      <button
        class="l2-tab-btn l2-tab-album" :class="{ active: l2tab === 'album' }"
        @click="$emit('update:l2tab', 'album')"
      >
        <i class="fa-solid fa-images"></i><span>楼体相册</span>
        <em v-if="photoList.length" class="l2-tab-badge">{{ photoList.length }}</em>
      </button>
    </div>

    <div class="inline-body">
      <template v-if="l2tab === 'info'">
        <div v-if="!infoGroups.length && !selectedBldg.timetable" class="el-empty">暂无基础信息</div>

        <!-- 时间：横排时间条 -->
        <section v-for="g in infoGroups" :key="g.key" class="info-block" :class="'ib-' + g.key">
          <div class="info-section-title">
            <span><i :class="g.icon" class="ipt-icon"></i>{{ g.label }}</span>
            <em v-if="g.items.length > 1" class="ipt-count">{{ g.items.length }}</em>
          </div>

          <!-- 时间 -->
          <div v-if="g.key === 'time'" class="ib-time">
            <div v-for="item in g.items" :key="item.label" class="ib-time-row">
              <span class="ib-time-label">{{ item.label }}</span>
              <span class="ib-time-value">{{ item.value }}</span>
            </div>
          </div>

          <!-- 功能：标签云 -->
          <div v-else-if="g.key === 'function'" class="ib-func">
            <div v-for="item in g.items" :key="item.label" class="ib-func-item">
              <span class="ib-func-label">{{ item.label }}</span>
              <span v-for="tag in splitDesc(item.value)" :key="tag" class="ib-func-tag">{{ tag }}</span>
            </div>
          </div>

          <!-- 价格：价目卡 -->
          <div v-else-if="g.key === 'price'" class="ib-price">
            <div v-for="item in g.items" :key="item.label" class="ib-price-row">
              <span class="ib-price-label">{{ item.label }}</span>
              <span class="ib-price-value">{{ item.value }}</span>
            </div>
          </div>

          <!-- 位置：带定位符的一行 -->
          <div v-else-if="g.key === 'location'" class="ib-loc">
            <div v-for="item in g.items" :key="item.label" class="ib-loc-row">
              <i class="fa-solid fa-location-dot"></i>
              <div>
                <div class="ib-loc-value">{{ item.value }}</div>
                <div v-if="item.label !== '位置' && item.label !== '地址'" class="ib-loc-label">{{ item.label }}</div>
              </div>
            </div>
          </div>

          <!-- 预约 / 容纳人数 / 联系：贴身小卡 -->
          <div v-else-if="g.key === 'booking' || g.key === 'capacity' || g.key === 'contact'" class="ib-meta">
            <div v-for="item in g.items" :key="item.label" class="ib-meta-card">
              <div class="ib-meta-label">{{ item.label }}</div>
              <div class="ib-meta-value">{{ item.value }}</div>
            </div>
          </div>

          <!-- 备注：浅底提示条 -->
          <div v-else-if="g.key === 'note'" class="ib-note">
            <div v-for="item in g.items" :key="item.label" class="ib-note-row">
              <i class="fa-solid fa-circle-info"></i>
              <div>
                <b v-if="item.label !== '备注'">{{ item.label }}：</b>{{ item.value }}
              </div>
            </div>
          </div>

          <!-- 普通文字 / 自定义：原来的信息卡 -->
          <div v-else class="info-grid">
            <div v-for="item in g.items" :key="item.label" class="info-card">
              <div class="info-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }"><i :class="infoIcon(item.label)"></i></div>
              <div class="info-text">
                <div class="info-label">{{ item.label }}</div>
                <div class="info-value">{{ item.value }}</div>
              </div>
            </div>
          </div>
        </section>

        <div v-if="selectedBldg.timetable && selectedBldg.timetable.groups && selectedBldg.timetable.groups.length" class="timetable-view" style="margin-top:18px;">
          <div class="info-section-title"><span>开放时间</span></div>
          <div v-for="(group, gi) in selectedBldg.timetable.groups" :key="gi" class="tt-group">
            <div class="tt-days">{{ group.days }}</div>
            <div class="tt-blocks">
              <div v-for="(block, bi) in group.blocks" :key="bi" class="tt-block" :class="'tt-' + block.status">
                <div class="tt-time">{{ block.time }}</div>
                <div class="tt-label">{{ block.label }}</div>
                <div class="tt-bar" :class="'tt-bar-' + block.status"></div>
              </div>
            </div>
            <div v-if="group.note" class="tt-note"><i class="fa-solid fa-circle-info"></i> {{ group.note }}</div>
          </div>
        </div>
      </template>

      <template v-if="l2tab === 'equipment'">
        <div v-if="equipGroups.length" class="equip-topbar">
          <div class="equip-topbar-txt">
            <i class="fa-solid fa-toolbox"></i>
            <span>共 <b>{{ selectedBldg.equipment.length }}</b> 项设施<em v-if="equipGroups.length > 1">· {{ equipGroups.length }} 类</em></span>
          </div>
          <div class="equip-chips">
            <button
              type="button" class="equip-chip" :class="{ active: equipFilter === 'all' }"
              @click="equipFilter = 'all'"
            ><i class="fa-solid fa-layer-group chip-i"></i>全部<em>{{ selectedBldg.equipment.length }}</em></button>
            <button
              v-for="g in equipGroups" :key="g.key"
              type="button" class="equip-chip" :class="{ active: equipFilter === g.key }"
              @click="equipFilter = g.key"
            ><i :class="g.icon" class="chip-i"></i>{{ g.label }}<em>{{ g.items.length }}</em></button>
          </div>
        </div>

        <!-- 分类视图：按类别分节，节标题带色条 -->
        <template v-if="equipFilter === 'all'">
          <section v-for="g in equipGroups" :key="'sec-' + g.key" class="equip-sec" :class="'es-' + g.key">
            <div class="equip-sec-head">
              <i :class="g.icon"></i>
              <span>{{ g.label }}</span>
              <em>{{ g.items.length }}</em>
            </div>
            <div v-for="equip in g.items" :key="equip.name" class="equip-card">
              <div class="equip-card-header">
                <div class="equip-card-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">
                  <i :class="equip.icon"></i>
                </div>
                <div class="equip-card-name">{{ equip.name }}</div>
              </div>
              <div class="equip-card-body">
                <div class="info-grid">
                  <div v-for="d in equip.details" :key="d.label" class="info-item">
                    <div class="ilabel">{{ d.label }}</div>
                    <div class="ivalue">{{ d.value }}</div>
                  </div>
                </div>
                <div v-if="equip.priceTable" class="price-divider"></div>
                <div v-if="equip.priceTable" class="price-tables">
                  <div v-for="(rows, section) in equip.priceTable" :key="section" class="price-section">
                    <div class="price-section-title">{{ section }}</div>
                    <table class="price-table">
                      <tbody>
                        <template v-for="row in rows" :key="row[0]">
                          <tr>
                            <td class="price-label">{{ row[0] }}</td>
                            <td class="price-value">{{ row[1] }}</td>
                          </tr>
                          <tr v-if="row[2]" class="price-note-row">
                            <td colspan="2" class="price-note">{{ row[2] }}</td>
                          </tr>
                        </template>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </template>

        <!-- 单类视图 -->
        <template v-else>
          <div v-for="equip in equipVisible" :key="equip.name" class="equip-card">
            <div class="equip-card-header">
              <div class="equip-card-icon" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">
                <i :class="equip.icon"></i>
              </div>
              <div class="equip-card-name">{{ equip.name }}</div>
            </div>
            <div class="equip-card-body">
              <div class="info-grid">
                <div v-for="d in equip.details" :key="d.label" class="info-item">
                  <div class="ilabel">{{ d.label }}</div>
                  <div class="ivalue">{{ d.value }}</div>
                </div>
              </div>
              <div v-if="equip.priceTable" class="price-divider"></div>
              <div v-if="equip.priceTable" class="price-tables">
                <div v-for="(rows, section) in equip.priceTable" :key="section" class="price-section">
                  <div class="price-section-title">{{ section }}</div>
                  <table class="price-table">
                    <tbody>
                      <template v-for="row in rows" :key="row[0]">
                        <tr>
                          <td class="price-label">{{ row[0] }}</td>
                          <td class="price-value">{{ row[1] }}</td>
                        </tr>
                        <tr v-if="row[2]" class="price-note-row">
                          <td colspan="2" class="price-note">{{ row[2] }}</td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div v-if="!equipVisible.length" class="el-empty">该分类下暂无设施</div>
      </template>

      <template v-if="l2tab === 'floors'">
        <div class="floor-list">
          <div v-for="f in selectedBldg.floors" :key="f.name" class="floor-card">
            <div class="floor-badge" :style="{ background: selectedBldg.color }">{{ f.name }}</div>
            <div class="floor-body">
              <div v-if="f.highlights && f.highlights.length" class="floor-highlights">
                <span v-for="h in f.highlights" :key="h" class="floor-tag" :style="{ background: selectedBldg.bgColor, color: selectedBldg.color }">{{ h }}</span>
              </div>
              <div v-if="f.rooms && f.rooms.length" class="floor-rooms">
                <div v-for="r in f.rooms" :key="r.number" class="floor-room-item">
                  <span class="floor-room-num">{{ r.number }}</span>
                  <span class="floor-room-name">{{ r.name }}</span>
                </div>
              </div>
              <div v-if="f.layout" class="floor-layout">
                <div v-for="(val, key) in f.layout" :key="key" class="floor-layout-item">
                  <span class="floor-layout-pos">{{ key }}</span>
                  <span class="floor-layout-text">{{ val }}</span>
                </div>
              </div>
              <div v-if="!f.highlights && !f.layout && f.desc" class="floor-desc">
                <span v-for="(part, i) in splitDesc(f.desc)" :key="i" class="floor-desc-item">{{ part }}</span>
              </div>

              <!-- 本层小模块：按类型不同样式 -->
              <div v-if="f.modules && f.modules.length" class="fl-mod-wrap">
                <template v-for="(mod, mi) in f.modules" :key="mi">
                  <!-- 开放时间 -->
                  <div v-if="mod.kind === 'time'" class="fl-mod fl-mod-time">
                    <i class="fa-solid fa-clock"></i>
                    <span class="fl-mod-label">{{ mod.label || '开放时间' }}</span>
                    <span class="fl-mod-value">{{ mod.value }}</span>
                  </div>

                  <!-- 功能：标签云 -->
                  <div v-else-if="mod.kind === 'function'" class="fl-mod fl-mod-func">
                    <span class="fl-mod-label"><i class="fa-solid fa-list-check"></i>{{ mod.label || '功能' }}</span>
                    <span class="fl-mod-tags">
                      <span v-for="tag in splitDesc(mod.value)" :key="tag" class="fl-mod-tag">{{ tag }}</span>
                    </span>
                  </div>

                  <!-- 价格 -->
                  <div v-else-if="mod.kind === 'price'" class="fl-mod fl-mod-price">
                    <span class="fl-mod-label"><i class="fa-solid fa-tag"></i>{{ mod.label || '价格' }}</span>
                    <span class="fl-mod-value">{{ mod.value }}</span>
                  </div>

                  <!-- 位置 -->
                  <div v-else-if="mod.kind === 'location'" class="fl-mod fl-mod-loc">
                    <i class="fa-solid fa-location-dot"></i>
                    <span class="fl-mod-label">{{ mod.label || '位置' }}</span>
                    <span class="fl-mod-value">{{ mod.value }}</span>
                  </div>

                  <!-- 设施设备 -->
                  <div v-else-if="mod.kind === 'facility'" class="fl-mod fl-mod-fac">
                    <span class="fl-mod-label"><i class="fa-solid fa-toolbox"></i>{{ mod.label || '设施设备' }}</span>
                    <span class="fl-mod-tags">
                      <span v-for="tag in splitDesc(mod.value)" :key="tag" class="fl-mod-tag fl-mod-tag-fac">{{ tag }}</span>
                    </span>
                  </div>

                  <!-- 注意事项 -->
                  <div v-else-if="mod.kind === 'notice'" class="fl-mod fl-mod-notice">
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <div>
                      <div class="fl-mod-label">{{ mod.label || '注意事项' }}</div>
                      <div class="fl-mod-value">{{ mod.value }}</div>
                    </div>
                  </div>

                  <!-- 联系方式 -->
                  <div v-else-if="mod.kind === 'contact'" class="fl-mod fl-mod-contact">
                    <i class="fa-solid fa-phone"></i>
                    <span class="fl-mod-label">{{ mod.label || '联系方式' }}</span>
                    <span class="fl-mod-value">{{ mod.value }}</span>
                  </div>

                  <!-- 容纳人数 -->
                  <div v-else-if="mod.kind === 'capacity'" class="fl-mod fl-mod-cap">
                    <i class="fa-solid fa-users"></i>
                    <span class="fl-mod-label">{{ mod.label || '容纳人数' }}</span>
                    <span class="fl-mod-value">{{ mod.value }}</span>
                  </div>

                  <!-- 普通文字 -->
                  <div v-else class="fl-mod fl-mod-text">
                    <span class="fl-mod-label">{{ mod.label }}</span>
                    <span class="fl-mod-value">{{ mod.value }}</span>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-if="l2tab === 'schedule'">
        <div v-if="scheduleList.length" class="sched-summary">
          <div class="sched-stat">
            <span class="sched-stat-num">{{ scheduleList.filter(s => !s.isBreak).length }}</span>
            <span class="sched-stat-label">节课</span>
          </div>
          <div class="sched-stat">
            <span class="sched-stat-num">{{ scheduleList[0].time.split('-')[0] }}</span>
            <span class="sched-stat-label">最早开始</span>
          </div>
          <div class="sched-stat">
            <span class="sched-stat-num">{{ lastPeriodEnd }}</span>
            <span class="sched-stat-label">最晚结束</span>
          </div>
          <div class="sched-stat">
            <span class="sched-stat-num">{{ scheduleList.filter(s => s.isBreak).length }}</span>
            <span class="sched-stat-label">段休息</span>
          </div>
        </div>
        <div v-if="scheduleList.length" class="sched-wrap">
          <div v-for="(item, i) in scheduleList" :key="i" class="sched-row" :class="item.isBreak ? 'sched-row-break' : 'sched-row-class'">
            <template v-if="item.isBreak">
              <span class="sched-break"><i class="fa-solid fa-mug-hot"></i>{{ item.label }}</span>
            </template>
            <template v-else>
              <span class="sched-idx">{{ item.index }}</span>
              <span class="sched-name">{{ item.period }}</span>
              <span class="sched-clock">
                <i class="fa-regular fa-clock"></i>
                <b>{{ item.start }}</b>
                <em>—</em>
                <b>{{ item.end }}</b>
              </span>
              <span class="sched-bar"><i :style="{ width: item.durationPct + '%' }"></i></span>
            </template>
          </div>
        </div>
        <div v-else class="el-empty">暂无上课时间</div>
        <p class="sched-tip"><i class="fa-solid fa-circle-info"></i> 时间仅供参考，以教务通知与现场铃声为准。</p>
      </template>

      <template v-if="l2tab === 'contacts'">
        <div class="copy-hint">
          <i class="fa-solid fa-circle-info"></i>
          <span>点击电话或微信号即可复制</span>
        </div>
        <div class="contact-grid">
          <div v-for="c in selectedBldg.contacts" :key="c.label" class="contact-card">
            <div class="contact-icon"><i class="fa-solid fa-phone-volume"></i></div>
            <div class="contact-info">
              <div class="clabel">{{ c.label }}</div>
              <button
                type="button"
                class="cvalue"
                :class="{ copied: copiedLabel === c.label }"
                :title="'点击复制 ' + c.value"
                @click="copyText(c.value, c.label)"
              >
                {{ c.value }}
              </button>
            </div>
            <span class="copy-tag" :class="{ done: copiedLabel === c.label }">
              <i :class="copiedLabel === c.label ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
              {{ copiedLabel === c.label ? '已复制' : '复制' }}
            </span>
          </div>
        </div>
        <div class="wechat-block">
          <div class="wechat-icon"><i class="fa-brands fa-weixin"></i></div>
          <div class="wechat-info">
            <div class="wechat-label">微信投稿 / 联系作者</div>
            <div class="wechat-value">13146617300</div>
            <div class="wechat-note">若信息有误、想补充照片或建议，可加微信说明，谢谢！</div>
          </div>
          <button type="button" class="wechat-copy" @click="copyText('13146617300', '__wechat__')">
            <i :class="copiedLabel === '__wechat__' ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
            {{ copiedLabel === '__wechat__' ? '已复制' : '复制微信号' }}
          </button>
        </div>
      </template>

      <template v-if="l2tab === 'album'">
        <div class="album-bar">
          <span class="album-count"><i class="fa-solid fa-images"></i> 共 {{ photoList.length }} 张照片</span>
          <button type="button" class="album-submit" @click="toggleWechatHint">
            <i class="fa-brands fa-weixin"></i> 微信投稿照片
          </button>
        </div>

        <!-- 微信投稿说明卡（不跳转位置投稿） -->
        <div v-if="showWechatHint" class="wx-card">
          <div class="wx-card-head">
            <span class="wx-card-icon"><i class="fa-brands fa-weixin"></i></span>
            <div class="wx-card-title">
              <b>加微信把照片发给我</b>
              <span>{{ selectedBldg.name }} · 照片投稿</span>
            </div>
            <button type="button" class="wx-card-close" @click="showWechatHint = false">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
          <div class="wx-card-body">
            <p>添加作者微信，把照片直接发过来即可。审核通过后会出现在这栋楼的相册里。</p>
            <ol class="wx-steps">
              <li>复制下面的手机号</li>
              <li>微信里搜索并添加好友</li>
              <li>发送照片，可附一句这是哪栋楼</li>
            </ol>
          </div>
          <div class="wx-card-foot">
            <span class="wx-card-num">13146617300</span>
            <button type="button" class="wx-card-copy" :class="{ copied: copiedLabel === '__album_wx__' }" @click="copyText('13146617300', '__album_wx__')">
              <i :class="copiedLabel === '__album_wx__' ? 'fa-solid fa-check' : 'fa-regular fa-copy'"></i>
              {{ copiedLabel === '__album_wx__' ? '已复制，去微信添加' : '一键复制手机号' }}
            </button>
          </div>
        </div>

        <div v-if="photoList.length" class="album-grid">
          <button
            v-for="(photo, i) in photoList" :key="photo.id"
            type="button" class="album-cell" @click="openViewer(i)"
          >
            <img :src="photo.src" :alt="photo.title || selectedBldg.name" loading="lazy" />
            <span v-if="photo.title" class="album-cell-title">{{ photo.title }}</span>
          </button>
        </div>
        <div v-else class="album-empty">
          <i class="fa-regular fa-images"></i>
          <p class="album-empty-title">还没有这栋楼的照片</p>
          <p class="album-empty-desc">如果你拍到了，欢迎加微信 <b>13146617300</b> 投稿，审核后会出现在这里。</p>
          <button type="button" class="album-empty-btn" @click="showWechatHint = true">
            <i class="fa-brands fa-weixin"></i> 我要投稿
          </button>
        </div>
        <p class="album-tip">照片由同学投稿整理，仅用于校园导览，侵删请联系作者。</p>

        <!-- 同分组照片：查看本次分类下所有建筑的照片 -->
        <button
          v-if="groupPhotos && groupPhotos.length"
          type="button" class="album-group-btn"
          @click="groupMode = !groupMode"
        >
          <span class="agb-icon"><i class="fa-solid fa-images"></i></span>
          <span class="agb-text">
            <b>{{ groupMode ? '只看这栋楼' : `查看${groupLabel}的所有照片` }}</b>
            <em>{{ groupMode ? `共 ${photoList.length} 张` : `${groupPhotos.length} 张 · 含其他楼` }}</em>
          </span>
          <i class="fa-solid" :class="groupMode ? 'fa-rotate-left' : 'fa-arrow-right'"></i>
        </button>

        <!-- 分组模式：把同分类所有照片铺开，按楼名标注 -->
        <template v-if="groupMode">
          <div class="album-group-head">
            <i class="fa-solid fa-layer-group"></i>
            {{ groupLabel }} · {{ groupPhotos.length }} 张
          </div>
          <div class="album-grid">
            <button
              v-for="(photo, i) in groupPhotos" :key="'g' + photo.id"
              type="button" class="album-cell" @click="openGroupViewer(i)"
            >
              <img :src="photo.src" :alt="photo.title || photo.buildingName" loading="lazy" />
              <span class="album-cell-title">{{ photo.buildingName }}</span>
            </button>
          </div>
        </template>
      </template>
    </div>

    <!-- 大图查看：挂到 body，避免被面板的 overflow 裁切或跟着滚动 -->
    <Teleport to="body">
    <div v-if="viewerList && viewerIndex !== null" class="album-viewer" @click.self="viewerIndex = null">
      <button type="button" class="viewer-close" @click="viewerIndex = null"><i class="fa-solid fa-xmark"></i></button>
      <button type="button" class="viewer-nav viewer-prev" @click="stepViewer(-1)"><i class="fa-solid fa-chevron-left"></i></button>
      <figure class="viewer-stage">
        <img :src="viewerList[viewerIndex]?.src" :alt="viewerList[viewerIndex]?.title || selectedBldg.name" />
        <figcaption v-if="viewerList[viewerIndex]?.title || viewerList[viewerIndex]?.caption || viewerList[viewerIndex]?.buildingName">
          <b v-if="viewerList[viewerIndex]?.title">{{ viewerList[viewerIndex].title }}</b>
          <span v-if="viewerList[viewerIndex]?.buildingName" class="viewer-from">{{ viewerList[viewerIndex].buildingName }}</span>
          <span v-if="viewerList[viewerIndex]?.caption">{{ viewerList[viewerIndex].caption }}</span>
        </figcaption>
      </figure>
      <button type="button" class="viewer-nav viewer-next" @click="stepViewer(1)"><i class="fa-solid fa-chevron-right"></i></button>
      <div class="viewer-counter">{{ viewerIndex + 1 }} / {{ viewerList.length }}</div>
    </div>
    </Teleport>
      <template v-if="l2tab === 'surroundings'">
        <div v-if="(selectedBldg.surroundings || []).length" class="surroundings-list">
          <button
            v-for="s in selectedBldg.surroundings" :key="s.name"
            type="button"
            class="surrounding-card" :class="'dir-' + dirKey(s.direction)"
            :title="surroundTarget(s.name) ? `查看「${s.name}」` : s.name"
            @click="openSurround(s)"
          >
            <span class="surrounding-arrow" :style="{ transform: `rotate(${dirAngle(s.direction)}deg)` }">
              <i class="fa-solid fa-location-arrow"></i>
            </span>
            <span class="surrounding-info">
              <span class="surrounding-name">{{ s.name }}</span>
              <span class="surrounding-desc">{{ s.desc }}</span>
            </span>
            <span class="surrounding-tag">{{ s.direction }}</span>
            <i v-if="surroundTarget(s.name)" class="fa-solid fa-chevron-right surrounding-go"></i>
          </button>
        </div>
        <div v-else class="el-empty">暂无周边设施</div>
      </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  selectedBldg: Object,
  activeCategory: Object,
  l2tab: String,
  albumPhotos: { type: Array, default: () => [] },
  groupPhotos: { type: Array, default: () => [] },
  allBuildings: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:l2tab', 'locate', 'submit-photo', 'open-building'])

/* ---------------- 一键复制 ---------------- */
const copiedLabel = ref('')
let copyTimer = 0
async function copyText(value, label) {
  const text = String(value || '').trim()
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
  copiedLabel.value = ok ? label : '复制失败'
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copiedLabel.value = '' }, 1600)
}
onBeforeUnmount(() => clearTimeout(copyTimer))

/* ---------------- 设施设备分组 ---------------- */
const EQUIP_GROUPS = [
  { key: 'life', label: '生活服务', icon: 'fa-solid fa-basket-shopping', re: /充电|饮水|洗衣|热水|快递|超市|售货|售卖|便利店|自助|打印|外卖|浴室|洗浴|货币|储物|母婴|垃圾桶/ },
  { key: 'eat', label: '餐饮', icon: 'fa-solid fa-utensils', re: /餐|食堂|饮品|咖啡|窗口|售饭|美食/ },
  { key: 'sport', label: '运动场地', icon: 'fa-solid fa-futbol', re: /球|跑道|健身|游泳|场地|运动/ },
  { key: 'study', label: '学习空间', icon: 'fa-solid fa-book-open', re: /自习|图书|阅览|机房|实验室|教室/ },
  { key: 'park', label: '停车交通', icon: 'fa-solid fa-square-parking', re: /停车|车棚|充电桩|地库|共享单车/ },
  { key: 'safety', label: '安全急救', icon: 'fa-solid fa-kit-medical', re: /AED|除颤|急救|消防|灭火|监控|报警/ },
]
function equipGroupOf(name) {
  const n = String(name || '')
  for (const g of EQUIP_GROUPS) if (g.re.test(n)) return g.key
  return 'other'
}
const equipGroups = computed(() => {
  const list = props.selectedBldg?.equipment || []
  const map = new Map()
  for (const e of list) {
    const k = equipGroupOf(e.name)
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(e)
  }
  const order = [...EQUIP_GROUPS.map(g => g.key), 'other']
  return order
    .filter(k => map.has(k))
    .map(k => {
      const g = EQUIP_GROUPS.find(x => x.key === k) || { label: '其他设施', icon: 'fa-solid fa-circle-dot' }
      return { key: k, label: g.label, icon: g.icon, items: map.get(k) }
    })
})
const equipFilter = ref('all')
const equipVisible = computed(() => {
  const list = props.selectedBldg?.equipment || []
  if (equipFilter.value === 'all') return list
  return list.filter(e => equipGroupOf(e.name) === equipFilter.value)
})
watch(() => props.selectedBldg?.id, () => { equipFilter.value = 'all' })

/* ---------------- 楼体相册 ---------------- */
const photoList = computed(() => (props.albumPhotos || []).filter((p) => p && p.src))

/* 同分组照片（整个分类下的所有楼） */
const groupMode = ref(false)
const groupPhotos = computed(() => (props.groupPhotos || []).filter((p) => p && p.src))
const groupLabel = computed(() => {
  const name = props.selectedBldg?.catName
  return name ? `${name}` : '本分类'
})

/* 大图查看：普通模式看本楼，分组模式看全组 */
const viewerSource = ref('self')
const viewerList = computed(() => (viewerSource.value === 'group' ? groupPhotos.value : photoList.value))
function openGroupViewer(index) { viewerSource.value = 'group'; viewerIndex.value = index }
function openViewer(index) { viewerSource.value = 'self'; viewerIndex.value = index }
function stepViewer(delta) {
  const total = viewerList.value.length
  if (!total || viewerIndex.value === null) return
  viewerIndex.value = (viewerIndex.value + delta + total) % total
}

// 投稿说明卡：相册投稿走微信，不跳“位置投稿”
const showWechatHint = ref(false)
function toggleWechatHint() { showWechatHint.value = !showWechatHint.value }

const viewerIndex = ref(null)
/** 大图打开期间锁住院落滚动，关闭后恢复原位 */
let scrollLockY = 0
watch(() => viewerIndex.value, (v) => {
  if (typeof document === 'undefined') return
  const body = document.body
  if (v !== null) {
    scrollLockY = window.scrollY || 0
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollLockY}px`
    body.style.width = '100%'
  } else {
    body.style.overflow = ''
    body.style.position = ''
    body.style.top = ''
    body.style.width = ''
    window.scrollTo(0, scrollLockY)
  }
})
onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.body.style.position = ''
  document.body.style.top = ''
  document.body.style.width = ''
})
function onKeydown(event) {
  if (viewerIndex.value === null) return
  if (event.key === 'Escape') viewerIndex.value = null
  else if (event.key === 'ArrowLeft') stepViewer(-1)
  else if (event.key === 'ArrowRight') stepViewer(1)
}
watch(viewerIndex, (value) => {
  if (value !== null) window.addEventListener('keydown', onKeydown)
  else window.removeEventListener('keydown', onKeydown)
})
watch(() => props.selectedBldg?.id, () => {
  viewerIndex.value = null
  viewerSource.value = 'self'
  groupMode.value = false
  copiedLabel.value = ''
  showWechatHint.value = false
})
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

function splitDesc(desc) { return String(desc || '').split(/[；;]/).map(s => s.trim()).filter(Boolean) }

/* ---------------- 周边设施：方位箭头 ---------------- */
const DIR_MAP = {
  北: ['n', 0], 东北: ['ne', 45], 东: ['e', 90], 东南: ['se', 135],
  南: ['s', 180], 西南: ['sw', 225], 西: ['w', 270], 西北: ['nw', 315],
}
function dirKey(text) {
  const t = String(text || '')
  for (const k of ['东北', '东南', '西南', '西北', '北', '东', '南', '西']) if (t.includes(k)) return DIR_MAP[k][0]
  return 'n'
}
function dirAngle(text) {
  const t = String(text || '')
  for (const k of ['东北', '东南', '西南', '西北', '北', '东', '南', '西']) if (t.includes(k)) return DIR_MAP[k][1]
  return 0
}

/* 周边设施点击跳转：按名字在全部建筑里找到目标 */
const surroundTarget = (name) => {
  const list = props.allBuildings || []
  return list.find((b) => b.name === name) || null
}
function openSurround(s) {
  const target = surroundTarget(s?.name)
  if (target) emit('open-building', target.id)
}

/* ---------------- 建筑信息：按类别分组（每类不同样式） ---------------- */
const INFO_GROUPS = [
  { key: 'time', label: '时间', icon: 'fa-solid fa-clock' },
  { key: 'function', label: '功能', icon: 'fa-solid fa-list-check' },
  { key: 'price', label: '价格', icon: 'fa-solid fa-tag' },
  { key: 'location', label: '位置', icon: 'fa-solid fa-location-dot' },
  { key: 'booking', label: '预约', icon: 'fa-solid fa-calendar-check' },
  { key: 'capacity', label: '容纳人数', icon: 'fa-solid fa-users' },
  { key: 'contact', label: '联系方式', icon: 'fa-solid fa-phone' },
  { key: 'note', label: '备注', icon: 'fa-solid fa-note-sticky' },
  { key: 'text', label: '其他信息', icon: 'fa-solid fa-circle-info' },
]

// 老数据没有 kind：按标签关键字猜一个类别
function guessKind(label) {
  const s = String(label || '')
  if (/时间|开门|关门|营业|开放|开馆|闭馆|入馆|宵禁|时段|大课间|供水|断电|节假日|寒暑假|周末|周一|周二|周三|周四|周五|周六|周日/.test(s)) return 'time'
  if (/功能|服务|项目|内容/.test(s)) return 'function'
  if (/价格|费用|收费|票价|元/.test(s)) return 'price'
  if (/位置|地址|地点|楼层/.test(s)) return 'location'
  if (/预约|预订|申请/.test(s)) return 'booking'
  if (/人数|容纳|容量|座位/.test(s)) return 'capacity'
  if (/电话|联系|微信|邮箱/.test(s)) return 'contact'
  if (/备注|说明|提示|注意/.test(s)) return 'note'
  return 'text'
}

// 值里根本没有时间信息时，别硬塞进「时间」样式
function looksLikeTime(v) {
  return /\d{1,2}\s*[:：]\s*\d{2}|周[一二三四五六日天]|每[天日周月]|全天|闭馆|开门|关门|小时|分钟|上午|下午|晚上|早上|凌晨|至\d/.test(String(v || ''))
}

// 标签本身就明确是时间类时，即使暂时写着「待补充」也保留在「时间」分组
function labelIsTime(label) {
  return /时间|开门|关门|营业|开放|开馆|闭馆|入馆|宵禁|时段/.test(String(label || ''))
}

const infoGroups = computed(() => {
  const list = props.selectedBldg?.info || []
  const map = new Map()
  for (const item of list) {
    if (!item) continue
    let k = INFO_GROUPS.some(g => g.key === item.kind) ? item.kind : guessKind(item.label)
    if (k === 'time' && !looksLikeTime(item.value) && !labelIsTime(item.label)) k = 'text'
    if (!map.has(k)) map.set(k, [])
    map.get(k).push(item)
  }
  return INFO_GROUPS
    .filter(g => map.has(g.key))
    .map(g => ({ key: g.key, label: g.label, icon: g.icon, items: map.get(g.key) }))
})

function infoIcon(label) {
  const map = { '开门':'fa-solid fa-door-open','关门':'fa-solid fa-door-closed','宵禁':'fa-solid fa-moon','断电':'fa-solid fa-bolt','限电':'fa-solid fa-bolt-lightning','电费':'fa-solid fa-coins','功率':'fa-solid fa-gauge-high','营业':'fa-solid fa-clock','开放':'fa-solid fa-clock','支付':'fa-solid fa-credit-card','外来':'fa-solid fa-user-group','价格':'fa-solid fa-tag','禁止':'fa-solid fa-ban','状态':'fa-solid fa-circle-info','备注':'fa-solid fa-note-sticky','位置':'fa-solid fa-location-dot','电话':'fa-solid fa-phone','楼层':'fa-solid fa-layer-group','充电桩':'fa-solid fa-charging-station','饮水':'fa-solid fa-droplet','设施':'fa-solid fa-toolbox','时间':'fa-solid fa-clock','规格':'fa-solid fa-ruler','封闭':'fa-solid fa-lock','开馆':'fa-solid fa-book-open','入馆':'fa-solid fa-id-card','每周':'fa-solid fa-hourglass-half','免费':'fa-solid fa-gift','监督':'fa-solid fa-shield-halved','小型车':'fa-solid fa-car','大型车':'fa-solid fa-truck','夜间':'fa-solid fa-moon','方式':'fa-solid fa-qrcode','电费标准':'fa-solid fa-bolt' }
  for (const [k,v] of Object.entries(map)) if (label.includes(k)) return v
  return 'fa-solid fa-circle-info'
}
function parseSchedule(raw) {
  return raw.split('\n').filter(Boolean).map(line => {
    const m = line.match(/^(.+?)\s+(\d{2}:\d{2})\s*[-~—]\s*(\d{2}:\d{2})$/)
    if (m) return { period: m[1], start: m[2], end: m[3], time: `${m[2]}-${m[3]}`, isBreak: false }
    return { label: line, isBreak: true }
  })
}
function toMin(t) {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + m
}
const scheduleList = computed(() => {
  const raw = props.selectedBldg?.schedule
  if (!raw) return []
  const rows = parseSchedule(String(raw))
  const maxDur = Math.max(45, ...rows.filter(r => !r.isBreak).map(r => toMin(r.end) - toMin(r.start)))
  let idx = 0
  return rows.map((r) => {
    if (r.isBreak) return r
    idx += 1
    return { ...r, index: idx, durationPct: Math.round(((toMin(r.end) - toMin(r.start)) / maxDur) * 100) }
  })
})
const lastPeriodEnd = computed(() => {
  const rows = scheduleList.value.filter((r) => !r.isBreak)
  return rows.length ? rows[rows.length - 1].end : '—'
})
</script>

<style scoped>
/* ============ 面板容器 ============ */
.inline-panel {
  background: rgba(255,253,248,0.92);
  border: 1px solid rgba(27,67,50,0.11);
  border-radius: 15px;
  overflow: hidden;
  backdrop-filter: blur(18px) saturate(1.08);
  box-shadow: 0 14px 36px rgba(27,67,50,0.08);
}

/* ============ 头部 ============ */
.inline-panel-header {
  display: flex; align-items: center; gap: 13px;
  padding: 16px 18px 14px;
  background: linear-gradient(135deg, rgba(255,255,255,0.66), rgba(216,243,220,0.28));
  border-bottom: 1px solid rgba(27,67,50,0.08);
}
.content-panel-icon { width: 42px; height: 42px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
.inline-panel-titles { flex: 1; min-width: 0; }
.inline-crumb { font-size: 9.5px; font-weight: 700; letter-spacing: 0.14em; color: #9a7a3c; margin-bottom: 1px; }
.content-panel-title { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: clamp(16px, 3.4vw, 20px); color: var(--primary); line-height: 1.25; }
.content-panel-sub { font-size: 11.5px; color: var(--fg-muted); margin-top: 1px; }

.map-pin-btn {
  display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  padding: 8px 13px; border-radius: 9px; border: 1px solid rgba(27,67,50,0.16);
  background: rgba(255,255,255,0.8); color: var(--primary);
  font-size: 11.5px; font-weight: 600; cursor: pointer; white-space: nowrap;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.map-pin-btn i { font-size: 11px; }
.map-pin-btn:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

/* ============ 简介 ============ */
.inline-intro { display: flex; gap: 10px; padding: 12px 18px; background: rgba(216,243,220,0.22); border-bottom: 1px solid rgba(27,67,50,0.06); }
.inline-intro > i { color: var(--accent); font-size: 11px; margin-top: 4px; flex-shrink: 0; }
.inline-intro p { font-size: 12px; color: var(--fg-muted); line-height: 1.7; }

/* ============ 标签页 ============ */
.l2-tabs {
  display: flex; gap: 2px; padding: 0 12px;
  border-bottom: 1px solid rgba(27,67,50,0.09);
  background: rgba(255,255,255,0.35);
  overflow-x: auto; scrollbar-width: none;
}
.l2-tabs::-webkit-scrollbar { display: none; }
.l2-tab-btn {
  position: relative; display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  padding: 11px 10px 10px; border: none; background: none;
  font-size: 12px; font-weight: 500; color: var(--fg-muted);
  cursor: pointer; white-space: nowrap; transition: color 0.2s;
}
.l2-tab-btn i { font-size: 10.5px; opacity: 0.8; }
.l2-tab-btn:hover { color: var(--primary); }
.l2-tab-btn.active { color: var(--primary); font-weight: 700; }
.l2-tab-btn.active i { opacity: 1; color: var(--accent); }
.l2-tab-btn.active::after { content: ''; position: absolute; left: 8px; right: 8px; bottom: -1px; height: 2.5px; background: var(--primary); border-radius: 3px 3px 0 0; }

/* ============ 内容 ============ */
.inline-body { padding: 16px 18px 20px; }
.info-section-title { display: flex; align-items: center; gap: 8px; margin-bottom: 9px; }
.info-section-title span { font-family: 'Noto Serif SC', serif; font-size: 12px; font-weight: 900; color: var(--primary); }
.info-section-title::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(27,67,50,0.14), transparent); }

.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 9px; }
.info-card {
  display: flex; gap: 11px; align-items: flex-start; padding: 12px 13px;
  background: rgba(255,255,255,0.6); border: 1px solid rgba(27,67,50,0.08);
  border-radius: 11px; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}
.info-card:hover { background: #fff; border-color: rgba(45,106,79,0.3); box-shadow: 0 6px 18px rgba(27,67,50,0.08); }
.info-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.info-text { flex: 1; min-width: 0; }
.info-label { font-size: 9.5px; font-weight: 700; color: var(--fg-muted); letter-spacing: 0.06em; margin-bottom: 3px; }
.info-value { font-weight: 600; font-size: 13px; color: var(--primary); white-space: pre-line; line-height: 1.5; word-break: break-word; }

/* ============ 建筑信息：按类别分区（每类不同样式） ============ */
.info-block { margin-bottom: 16px; }
.info-block:last-child { margin-bottom: 0; }
.ipt-icon { font-size: 9.5px; color: var(--accent); margin-right: 5px; opacity: 0.9; }
.ipt-count {
  font-style: normal; font-size: 9.5px; font-weight: 700; color: var(--accent);
  background: rgba(246,236,214,0.9); border-radius: 999px; padding: 1px 6px;
  margin-left: auto; margin-right: 6px;
}

/* 时间：左边标签 右边等宽数字，一眼扫完 */
.ib-time { display: flex; flex-direction: column; gap: 1px; }
.ib-time-row {
  display: flex; align-items: baseline; gap: 12px; padding: 8px 12px;
  background: rgba(255,255,255,0.62); border-left: 2px solid rgba(212,168,83,0.55);
  border-radius: 0 8px 8px 0;
}
.ib-time-row:nth-child(even) { background: rgba(246,236,214,0.28); }
.ib-time-label { flex-shrink: 0; min-width: 78px; font-size: 11px; font-weight: 700; color: var(--fg-muted); }
.ib-time-value { font-size: 13px; font-weight: 700; color: var(--primary); font-variant-numeric: tabular-nums; letter-spacing: 0.01em; }

/* 功能：标签云 */
.ib-func { display: flex; flex-direction: column; gap: 8px; }
.ib-func-item { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; }
.ib-func-label { font-size: 10.5px; font-weight: 700; color: var(--fg-muted); margin-right: 2px; }
.ib-func-tag {
  display: inline-block; padding: 3px 10px; border-radius: 999px;
  font-size: 11.5px; font-weight: 600; color: #2D6A4F;
  background: rgba(216,243,220,0.7); border: 1px solid rgba(45,106,79,0.14);
}

/* 价格：价目卡，数值右对齐 */
.ib-price { display: flex; flex-direction: column; gap: 6px; }
.ib-price-row {
  display: flex; align-items: baseline; justify-content: space-between; gap: 14px;
  padding: 9px 13px; border-radius: 9px;
  background: linear-gradient(180deg, rgba(255,252,244,0.95), rgba(250,244,230,0.75));
  border: 1px solid rgba(212,168,83,0.22);
}
.ib-price-label { font-size: 11px; font-weight: 600; color: var(--fg-muted); }
.ib-price-value { font-size: 13px; font-weight: 800; color: #8A6320; font-variant-numeric: tabular-nums; text-align: right; }

/* 位置：带定位符的一行 */
.ib-loc { display: flex; flex-direction: column; gap: 7px; }
.ib-loc-row {
  display: flex; align-items: flex-start; gap: 10px; padding: 10px 13px;
  border-radius: 9px; background: rgba(232,244,255,0.55); border: 1px solid rgba(79,139,201,0.18);
}
.ib-loc-row > i { color: #4F8BC9; font-size: 12px; margin-top: 2px; }
.ib-loc-label { font-size: 9.5px; font-weight: 700; color: var(--fg-muted); letter-spacing: 0.06em; margin-top: 3px; opacity: 0.75; }
.ib-loc-value { font-size: 12.5px; font-weight: 600; color: var(--primary); line-height: 1.55; }

/* 预约 / 人数 / 联系：小卡 */
.ib-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.ib-meta-card {
  padding: 10px 12px; border-radius: 9px;
  background: rgba(255,255,255,0.7); border: 1px solid rgba(27,67,50,0.1);
}
.ib-meta-label { font-size: 9.5px; font-weight: 700; color: var(--fg-muted); letter-spacing: 0.06em; margin-bottom: 3px; }
.ib-meta-value { font-size: 12.5px; font-weight: 700; color: var(--primary); line-height: 1.5; word-break: break-word; }

/* 备注：浅底提示条 */
.ib-note { display: flex; flex-direction: column; gap: 7px; }
.ib-note-row {
  display: flex; align-items: flex-start; gap: 9px; padding: 10px 13px;
  border-radius: 9px; background: rgba(250,247,238,0.9); border: 1px dashed rgba(27,67,50,0.16);
  font-size: 12px; line-height: 1.65; color: var(--fg-muted);
}
.ib-note-row > i { color: rgba(212,168,83,0.9); font-size: 11px; margin-top: 2px; }
.ib-note-row b { color: var(--primary); font-weight: 700; }

.ilabel { font-size: 9.5px; font-weight: 700; color: var(--fg-muted); letter-spacing: 0.06em; margin-bottom: 2px; }
.ivalue { font-weight: 600; font-size: 12.5px; color: var(--primary); white-space: pre-line; line-height: 1.5; }

/* 设备卡片 */
/* 设施设备：顶部分组筛选 */
.equip-topbar { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 12px; padding-bottom: 11px; border-bottom: 1px dashed rgba(27,67,50,0.13); }
.equip-topbar-txt { display: inline-flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--fg-muted); }
.equip-topbar-txt i { color: var(--accent); font-size: 11px; }
.equip-topbar-txt b { color: var(--primary); font-family: 'Noto Serif SC', serif; font-size: 14px; }
.equip-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.equip-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 10px; border-radius: 20px; cursor: pointer;
  font-size: 11px; color: var(--fg-muted);
  background: rgba(255,255,255,0.7); border: 1px solid rgba(27,67,50,0.12);
  transition: all 0.16s;
}
.equip-chip em { font-style: normal; font-size: 9.5px; opacity: 0.65; font-variant-numeric: tabular-nums; }
.equip-chip:hover { border-color: rgba(45,106,79,0.35); color: var(--primary); }
.equip-chip.active { background: var(--primary); border-color: var(--primary); color: #fff; }
.equip-chip.active em { opacity: 0.85; }
.chip-i { font-size: 9.5px; margin-right: 4px; opacity: 0.8; }
.equip-topbar-txt em { font-style: normal; color: rgba(27,67,50,0.45); }

/* 设施分类分节 */
.equip-sec { margin-bottom: 16px; }
.equip-sec:last-child { margin-bottom: 0; }
.equip-sec-head {
  display: flex; align-items: center; gap: 7px; margin-bottom: 9px;
  font-size: 11.5px; font-weight: 800; color: var(--primary);
  font-family: 'Noto Serif SC', serif; letter-spacing: 0.02em;
}
.equip-sec-head i { font-size: 10px; color: var(--accent); }
.equip-sec-head em {
  font-style: normal; font-size: 9.5px; font-weight: 700; color: var(--accent);
  background: rgba(246,236,214,0.9); border-radius: 999px; padding: 1px 6px;
}
.equip-sec-head::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, rgba(27,67,50,0.13), transparent); }
.equip-sec.es-life .equip-sec-head i { color: #2D6A4F; }
.equip-sec.es-eat .equip-sec-head i { color: #B5733C; }
.equip-sec.es-sport .equip-sec-head i { color: #3F7FA6; }
.equip-sec.es-study .equip-sec-head i { color: #6B5B95; }
.equip-sec.es-park .equip-sec-head i { color: #7A6A4F; }
.equip-sec.es-safety .equip-sec-head i { color: #B23A34; }
@media (max-width: 900px) {
  .equip-topbar { gap: 9px; }
  .equip-chip { padding: 6px 13px; font-size: 11.5px; }
  .sched-summary { gap: 6px; }
  .sched-stat { padding: 9px 4px; border-radius: 9px; }
  .sched-stat-num { font-size: 15px; }
  .sched-row { gap: 8px; padding: 8px 9px; }
  .sched-name { font-size: 12px; }
  .sched-clock { font-size: 11px; }
}
.equip-card { background: rgba(255,255,255,0.5); border: 1px solid rgba(27,67,50,0.08); border-radius: 12px; margin-bottom: 11px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; }
.equip-card:hover { border-color: rgba(45,106,79,0.26); box-shadow: 0 7px 20px rgba(27,67,50,0.07); }
.equip-card:last-child { margin-bottom: 0; }
.equip-card-header { display: flex; align-items: center; gap: 9px; padding: 11px 14px; background: rgba(216,243,220,0.55); border-bottom: 1px solid rgba(27,67,50,0.06); }
.equip-card-icon { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.equip-card-name { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 13px; color: var(--primary); }
.equip-card-body { padding: 13px 14px; }
.equip-card-body .info-grid { grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); }

/* 价格表 */
.price-divider { height: 1px; background: rgba(27,67,50,0.09); margin: 13px 0 11px; }
.price-tables { display: flex; flex-direction: column; gap: 11px; }
.price-section { background: rgba(255,255,255,0.7); border: 1px solid rgba(27,67,50,0.07); border-radius: 9px; overflow: hidden; }
.price-section-title { font-size: 11px; font-weight: 700; color: var(--primary); padding: 7px 13px; background: rgba(216,243,220,0.5); }
.price-table { width: 100%; border-collapse: collapse; }
.price-table td { padding: 7px 13px; font-size: 12px; border-bottom: 1px solid rgba(27,67,50,0.06); }
.price-table tr:last-child td { border-bottom: none; }
.price-label { color: var(--fg); font-weight: 500; }
.price-value { color: var(--primary); font-weight: 700; text-align: right; white-space: nowrap; font-variant-numeric: tabular-nums; }
.price-note-row td { border-bottom: none; padding-top: 0; }
.price-note { font-size: 10.5px; color: var(--fg-muted); font-style: italic; }

/* 楼层 */
.floor-list { display: flex; flex-direction: column; gap: 11px; }
.floor-card { background: rgba(255,255,255,0.5); border: 1px solid rgba(27,67,50,0.08); border-radius: 11px; overflow: hidden; }
.floor-badge { color: #fff; font-weight: 700; font-size: 12px; padding: 6px 14px; display: inline-block; border-radius: 0 0 10px 0; letter-spacing: 0.03em; }
.floor-body { padding: 12px 14px; }
.floor-highlights { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 9px; }
.floor-tag { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 6px; }
.floor-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; }
.floor-layout-item { background: rgba(255,255,255,0.6); border: 1px solid rgba(27,67,50,0.06); border-radius: 7px; padding: 7px 9px; display: flex; gap: 6px; align-items: flex-start; }
.floor-layout-pos { font-size: 9.5px; font-weight: 700; color: #fff; background: var(--primary); padding: 1px 6px; border-radius: 4px; white-space: nowrap; flex-shrink: 0; }
.floor-layout-text { font-size: 11.5px; color: var(--fg); line-height: 1.5; }
.floor-desc { display: flex; flex-direction: column; gap: 7px; }
.floor-rooms { display: flex; flex-direction: column; gap: 1px; }
.floor-room-item { display: flex; align-items: center; gap: 9px; padding: 5px 8px; border-radius: 6px; transition: background 0.15s; }
.floor-room-item:hover { background: rgba(216,243,220,0.45); }
.floor-room-num { font-size: 11px; font-weight: 700; color: var(--primary); background: rgba(216,243,220,0.85); padding: 1px 7px; border-radius: 4px; min-width: 40px; text-align: center; flex-shrink: 0; font-variant-numeric: tabular-nums; }
.floor-room-name { font-size: 12px; color: var(--fg); line-height: 1.4; }
.floor-desc-item { background: rgba(255,255,255,0.6); padding: 9px 12px; border-radius: 7px; font-size: 12px; color: var(--fg); line-height: 1.6; border-left: 2.5px solid var(--primary); }

/* ============ 楼层小模块（按类型不同样式） ============ */
.fl-mod-wrap { display: flex; flex-direction: column; gap: 7px; margin-top: 10px; }
.fl-mod { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; line-height: 1.6; }
.fl-mod > i { font-size: 10.5px; margin-top: 3px; flex-shrink: 0; }
.fl-mod-label { font-weight: 700; flex-shrink: 0; }
.fl-mod-value { color: var(--fg); }

/* 开放时间：左侧金色竖条 */
.fl-mod-time {
  padding: 8px 12px; border-radius: 0 8px 8px 0;
  background: rgba(255,255,255,0.7); border-left: 2px solid rgba(212,168,83,0.6);
  align-items: baseline;
}
.fl-mod-time > i { color: var(--accent); }
.fl-mod-time .fl-mod-label { color: var(--fg-muted); font-size: 11px; min-width: 68px; }
.fl-mod-time .fl-mod-value { font-weight: 700; color: var(--primary); font-variant-numeric: tabular-nums; }

/* 功能：标签云 */
.fl-mod-func { flex-direction: column; gap: 5px; }
.fl-mod-func .fl-mod-label { font-size: 10.5px; color: var(--fg-muted); }
.fl-mod-func .fl-mod-label i { font-size: 9.5px; margin-right: 4px; color: #6B5B95; }
.fl-mod-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.fl-mod-tag {
  padding: 2px 9px; border-radius: 999px; font-size: 11px; font-weight: 600;
  color: #6B5B95; background: rgba(240,236,250,0.85); border: 1px solid rgba(107,91,149,0.18);
}
.fl-mod-tag-fac { color: #2D6A4F; background: rgba(216,243,220,0.75); border-color: rgba(45,106,79,0.16); }

/* 价格：米金底 + 右对齐 */
.fl-mod-price {
  justify-content: space-between; align-items: baseline;
  padding: 8px 12px; border-radius: 8px;
  background: linear-gradient(180deg, rgba(255,252,244,0.95), rgba(250,244,230,0.7));
  border: 1px solid rgba(212,168,83,0.24);
}
.fl-mod-price > .fl-mod-label { color: var(--fg-muted); font-size: 11px; }
.fl-mod-price > .fl-mod-label i { color: #B58A3C; margin-right: 4px; }
.fl-mod-price > .fl-mod-value { font-weight: 800; color: #8A6320; font-variant-numeric: tabular-nums; }

/* 位置：淡蓝底 */
.fl-mod-loc {
  padding: 8px 12px; border-radius: 8px; align-items: baseline;
  background: rgba(232,244,255,0.6); border: 1px solid rgba(79,139,201,0.18);
}
.fl-mod-loc > i { color: #4F8BC9; }
.fl-mod-loc .fl-mod-label { color: var(--fg-muted); font-size: 11px; }
.fl-mod-loc .fl-mod-value { color: var(--primary); font-weight: 600; }

/* 设施：绿色标签云（复用 func 结构） */
.fl-mod-fac { flex-direction: column; gap: 5px; }
.fl-mod-fac .fl-mod-label { font-size: 10.5px; color: var(--fg-muted); }
.fl-mod-fac .fl-mod-label i { font-size: 9.5px; margin-right: 4px; color: #2D6A4F; }

/* 注意事项：浅红提示条 */
.fl-mod-notice {
  padding: 9px 12px; border-radius: 8px;
  background: rgba(253,240,238,0.92); border: 1px dashed rgba(154,59,46,0.28);
  color: #7A2E24;
}
.fl-mod-notice > i { color: rgba(154,59,46,0.8); }
.fl-mod-notice .fl-mod-label { font-size: 10.5px; letter-spacing: 0.04em; margin-bottom: 2px; }
.fl-mod-notice .fl-mod-value { color: #7A2E24; font-size: 11.5px; }

/* 联系方式：可点复制的胶囊 */
.fl-mod-contact {
  padding: 8px 12px; border-radius: 8px; align-items: baseline;
  background: rgba(216,243,220,0.5); border: 1px solid rgba(45,106,79,0.16);
}
.fl-mod-contact > i { color: #2D6A4F; }
.fl-mod-contact .fl-mod-label { color: var(--fg-muted); font-size: 11px; }
.fl-mod-contact .fl-mod-value { color: var(--primary); font-weight: 700; font-variant-numeric: tabular-nums; }

/* 容纳人数 */
.fl-mod-cap {
  padding: 8px 12px; border-radius: 8px; align-items: baseline;
  background: rgba(246,236,214,0.55); border: 1px solid rgba(212,168,83,0.2);
}
.fl-mod-cap > i { color: #B58A3C; }
.fl-mod-cap .fl-mod-label { color: var(--fg-muted); font-size: 11px; }
.fl-mod-cap .fl-mod-value { color: #8A6320; font-weight: 800; }

/* 普通文字 */
.fl-mod-text { flex-direction: column; gap: 2px; }
.fl-mod-text .fl-mod-label { font-size: 10.5px; color: var(--fg-muted); }
.fl-mod-text .fl-mod-value { color: var(--fg); }

/* 上课时间 */
.schedule-wrap { max-width: 420px; display: flex; flex-direction: column; gap: 1px; }
/* ---- 上课时间：统计 + 时间轴列表 ---- */
.sched-summary { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
.sched-stat {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 10px 6px; border-radius: 11px;
  background: linear-gradient(160deg, rgba(255,255,255,0.86), rgba(216,243,220,0.32));
  border: 1px solid rgba(27,67,50,0.09);
}
.sched-stat-num { font-family: 'Noto Serif SC', serif; font-size: 17px; font-weight: 900; color: var(--primary); line-height: 1.1; font-variant-numeric: tabular-nums; }
.sched-stat-label { font-size: 9.5px; letter-spacing: 0.06em; color: var(--fg-muted); }
.sched-wrap { display: flex; flex-direction: column; gap: 4px; }
.sched-row { display: flex; align-items: center; gap: 10px; border-radius: 9px; padding: 8px 11px; }
.sched-row-class { background: rgba(255,255,255,0.62); border: 1px solid rgba(27,67,50,0.07); transition: background 0.16s, border-color 0.16s, transform 0.16s; }
.sched-row-class:hover { background: #fff; border-color: rgba(45,106,79,0.28); transform: translateX(2px); }
.sched-idx {
  width: 21px; height: 21px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 800; color: #fff; background: var(--primary);
  font-variant-numeric: tabular-nums;
}
.sched-name { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 700; color: var(--primary); }
.sched-clock { display: inline-flex; align-items: center; gap: 4px; font-size: 11.5px; color: var(--fg-muted); flex-shrink: 0; }
.sched-clock i { font-size: 9.5px; color: var(--accent); }
.sched-clock b { font-weight: 700; color: var(--fg); font-variant-numeric: tabular-nums; }
.sched-clock em { font-style: normal; opacity: 0.5; }
.sched-bar { display: none; }
.sched-row-break { justify-content: center; padding: 5px 11px; }
.sched-break {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600; color: #8a6a2e;
  background: rgba(212,168,83,0.14); border: 1px dashed rgba(212,168,83,0.45);
  padding: 3px 12px; border-radius: 20px;
}
.sched-break i { font-size: 9px; }
.sched-tip { margin-top: 12px; font-size: 10px; color: rgba(107,107,128,0.85); display: flex; align-items: center; gap: 5px; }
.sched-row { display: flex; align-items: center; padding: 9px 14px; border-radius: 8px; transition: background 0.15s; }
.sched-row:not(.sched-break):nth-child(odd) { background: rgba(255,255,255,0.5); }
.sched-row:not(.sched-break):hover { background: rgba(216,243,220,0.6); }
.sched-period { flex: 1; font-weight: 600; font-size: 12.5px; color: var(--primary); }
.sched-time { font-size: 12px; color: var(--fg-muted); font-variant-numeric: tabular-nums; }
.sched-break { justify-content: center; padding: 7px 14px; }
.sched-break-label { font-size: 10.5px; font-weight: 600; color: var(--primary); background: rgba(216,243,220,0.8); padding: 4px 13px; border-radius: 20px; }

/* 联系电话（点击复制） */
.contact-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px; }
.contact-card { display: flex; gap: 10px; align-items: center; padding: 11px 13px; background: rgba(255,255,255,0.6); border: 1px solid rgba(27,67,50,0.08); border-radius: 10px; transition: border-color 0.2s, background 0.2s; }
.contact-card:hover { border-color: rgba(45,106,79,0.28); background: rgba(255,255,255,0.85); }
.contact-icon { width: 30px; height: 30px; border-radius: 9px; background: rgba(216,243,220,0.85); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 11px; flex-shrink: 0; }
.contact-info { min-width: 0; flex: 1; text-align: left; }
.contact-card .clabel { font-size: 9.5px; color: var(--fg-muted); letter-spacing: 0.05em; }
.contact-card .cvalue {
  display: inline-block; max-width: 100%; padding: 0; border: none; background: none;
  font-family: inherit; font-size: 13px; color: var(--primary); font-weight: 700;
  font-variant-numeric: tabular-nums; word-break: break-all; cursor: pointer; text-align: left;
  transition: color 0.2s;
}
.contact-card .cvalue:hover { color: var(--primary-light); text-decoration: underline dotted; }
.contact-card .cvalue.copied { color: #1d7a4f; }
.copy-tag {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 600; color: var(--fg-muted);
  background: rgba(216,243,220,0.6); border-radius: 6px; padding: 3px 7px;
  transition: background 0.2s, color 0.2s;
}
.copy-tag.done { background: rgba(39,174,96,0.16); color: #1d7a4f; }
.copy-hint { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--fg-muted); margin-bottom: 9px; }
.copy-hint i { color: var(--accent); font-size: 10px; }

.wechat-block {
  display: flex; align-items: center; gap: 12px; margin-top: 11px; padding: 13px 15px;
  border-radius: 12px; border: 1px solid rgba(27,67,50,0.1);
  background: linear-gradient(135deg, rgba(216,243,220,0.55), rgba(255,255,255,0.75));
}
.wechat-icon { width: 34px; height: 34px; border-radius: 10px; background: var(--primary); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.wechat-info { flex: 1; min-width: 0; }
.wechat-label { font-size: 9.5px; font-weight: 700; letter-spacing: 0.1em; color: #9a7a3c; }
.wechat-value { font-family: 'Noto Serif SC', serif; font-size: 16px; font-weight: 900; color: var(--primary); font-variant-numeric: tabular-nums; }
.wechat-note { font-size: 10.5px; color: var(--fg-muted); line-height: 1.5; margin-top: 1px; }
.wechat-copy {
  flex-shrink: 0; display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 11px; border-radius: 8px; border: 1px solid rgba(27,67,50,0.18);
  background: rgba(255,255,255,0.85); color: var(--primary);
  font-family: inherit; font-size: 11px; font-weight: 600; cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.wechat-copy:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

/* ============ 投稿说明卡（微信） ============ */
.wx-card {
  margin: 0 0 12px; padding: 15px 16px 14px; border-radius: 13px;
  border: 1px solid rgba(27,67,50,0.14);
  background:
    radial-gradient(ellipse at 92% 0%, rgba(123,227,139,0.22), transparent 62%),
    linear-gradient(135deg, rgba(216,243,220,0.62), rgba(255,253,248,0.94));
  box-shadow: 0 12px 30px rgba(27,67,50,0.09);
  animation: wxCardIn 0.26s cubic-bezier(0.4, 0, 0.2, 1);
}
@keyframes wxCardIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
.wx-card-head { display: flex; align-items: center; gap: 11px; }
.wx-card-icon {
  width: 38px; height: 38px; border-radius: 11px; flex-shrink: 0;
  background: var(--primary); color: #7BE38B;
  display: flex; align-items: center; justify-content: center; font-size: 19px;
}
.wx-card-title { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.wx-card-title b { font-family: 'Noto Serif SC', serif; font-size: 14px; color: var(--primary); }
.wx-card-title span { font-size: 10.5px; color: var(--fg-muted); margin-top: 1px; }
.wx-card-close {
  width: 26px; height: 26px; border-radius: 8px; border: none; background: transparent;
  color: var(--fg-muted); cursor: pointer; flex-shrink: 0;
}
.wx-card-close:hover { background: rgba(27,67,50,0.08); color: var(--primary); }
.wx-card-body { margin-top: 11px; }
.wx-card-body p { font-size: 11.5px; line-height: 1.68; color: var(--fg-muted); }
.wx-steps { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 9px; counter-reset: wxstep; list-style: none; padding: 0; }
.wx-steps li {
  counter-increment: wxstep; display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 10px 4px 5px; border-radius: 20px; font-size: 10.5px; color: var(--primary);
  background: rgba(255,255,255,0.82); border: 1px solid rgba(27,67,50,0.12);
}
.wx-steps li::before {
  content: counter(wxstep); width: 17px; height: 17px; border-radius: 50%;
  background: var(--primary); color: #fff; font-size: 9.5px; font-weight: 700;
  display: inline-flex; align-items: center; justify-content: center;
}
.wx-card-foot { display: flex; align-items: center; gap: 12px; margin-top: 13px; padding-top: 12px; border-top: 1px dashed rgba(27,67,50,0.16); }
.wx-card-num {
  font-family: 'Noto Serif SC', serif; font-size: 19px; font-weight: 900; color: var(--primary);
  letter-spacing: 0.05em; font-variant-numeric: tabular-nums;
}
.wx-card-copy {
  margin-left: auto; display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: 9px; border: none;
  background: var(--primary); color: #fff;
  font-family: inherit; font-size: 11.5px; font-weight: 700; cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}
.wx-card-copy:hover { background: var(--primary-light); transform: translateY(-1px); }
.wx-card-copy i { color: var(--accent); }
.wx-card-copy.copied { background: #1d7a4f; }
.wx-card-copy.copied i { color: #D5F5E3; }

/* ============ 楼体相册 ============ */
.l2-tab-album { position: relative; }
.l2-tab-badge {
  margin-left: 4px; font-style: normal; font-size: 9.5px; font-weight: 700;
  background: rgba(212,168,83,0.22); color: #9a7a3c; border-radius: 20px; padding: 0 5px; line-height: 1.5;
}
.album-bar { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 11px; }
.album-count { font-size: 11px; color: var(--fg-muted); display: inline-flex; align-items: center; gap: 6px; }
.album-count i { color: var(--accent); font-size: 10.5px; }
.album-submit {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 7px 12px; border-radius: 8px; border: 1px solid rgba(27,67,50,0.2);
  background: rgba(255,255,255,0.85); color: var(--primary);
  font-family: inherit; font-size: 11px; font-weight: 600; cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
}
.album-submit:hover { background: var(--primary); color: #fff; border-color: var(--primary); }

.album-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(148px, 1fr)); gap: 8px; }
.album-cell {
  position: relative; padding: 0; border: 1px solid rgba(27,67,50,0.09); border-radius: 10px;
  overflow: hidden; background: rgba(255,255,255,0.6); cursor: zoom-in;
  aspect-ratio: 4 / 3; transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}
.album-cell img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.35s ease; }
.album-cell:hover { border-color: rgba(45,106,79,0.35); box-shadow: 0 8px 20px rgba(27,67,50,0.14); }
.album-cell:hover img { transform: scale(1.05); }
.album-cell-title {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 14px 8px 6px; font-size: 10.5px; font-weight: 600; color: #fff; text-align: left;
  background: linear-gradient(to top, rgba(10,26,19,0.72), rgba(10,26,19,0));
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.album-empty {
  display: flex; flex-direction: column; align-items: center; text-align: center;
  padding: 30px 20px; border-radius: 12px; border: 1px dashed rgba(27,67,50,0.16);
  background: rgba(255,255,255,0.45);
}
.album-empty > i { font-size: 26px; color: rgba(27,67,50,0.28); margin-bottom: 9px; }
.album-empty-title { font-family: 'Noto Serif SC', serif; font-weight: 900; font-size: 14px; color: var(--primary); }
.album-empty-desc { font-size: 11.5px; color: var(--fg-muted); line-height: 1.65; margin-top: 4px; max-width: 320px; }
.album-empty-desc b { color: var(--primary); font-variant-numeric: tabular-nums; }
.album-empty-btn {
  margin-top: 13px; display: inline-flex; align-items: center; gap: 5px;
  padding: 8px 15px; border-radius: 9px; border: none; cursor: pointer;
  background: var(--primary); color: #fff; font-family: inherit; font-size: 11.5px; font-weight: 600;
  transition: background 0.2s, transform 0.2s;
}
.album-empty-btn:hover { background: var(--primary-light); transform: translateY(-1px); }
.album-tip { margin-top: 11px; font-size: 10px; color: rgba(107,107,128,0.85); text-align: center; }

/* 同分组照片入口 */
.album-group-btn {
  display: flex; align-items: center; gap: 11px; width: 100%; margin-top: 13px;
  padding: 11px 13px; border-radius: 11px; cursor: pointer; font-family: inherit; text-align: left;
  border: 1px dashed rgba(27,67,50,0.22); background: rgba(246,236,214,0.42);
  transition: background 0.2s, border-color 0.2s, transform 0.2s;
}
.album-group-btn:hover {
  background: rgba(246,236,214,0.75); border-color: rgba(212,168,83,0.6); transform: translateY(-1px);
}
.agb-icon {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--primary); color: var(--accent); font-size: 12px;
}
.agb-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.agb-text b { font-size: 11.5px; font-weight: 700; color: var(--primary); }
.agb-text em { font-style: normal; font-size: 10px; color: var(--fg-muted); }
.album-group-btn > i { font-size: 10px; color: rgba(27,67,50,0.45); }
.album-group-head {
  display: flex; align-items: center; gap: 6px; margin: 13px 0 9px;
  font-size: 10.5px; font-weight: 700; color: var(--fg-muted);
}
.album-group-head i { color: var(--accent); font-size: 10px; }
.viewer-from {
  font-size: 10.5px; font-weight: 700; color: var(--accent);
  padding: 1px 7px; border-radius: 999px; background: rgba(212,168,83,0.2); margin-left: 6px;
}

/* 大图查看 */
.album-viewer {
  position: fixed; inset: 0; z-index: 3200; display: flex; align-items: center; justify-content: center;
  background: rgba(12,20,17,0.86); backdrop-filter: blur(6px); padding: 48px 64px;
  overscroll-behavior: contain;
}
.viewer-stage { max-width: 100%; max-height: 100%; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.viewer-stage img { max-width: 100%; max-height: calc(100vh - 170px); object-fit: contain; border-radius: 8px; box-shadow: 0 24px 60px rgba(0,0,0,0.45); }
.viewer-stage figcaption { display: flex; flex-direction: column; align-items: center; gap: 3px; color: rgba(255,255,255,0.9); font-size: 12.5px; text-align: center; }
.viewer-stage figcaption b { font-size: 14px; }
.viewer-stage figcaption span { color: rgba(255,255,255,0.62); font-size: 11.5px; }
.viewer-close, .viewer-nav {
  position: absolute; display: flex; align-items: center; justify-content: center;
  width: 40px; height: 40px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.2);
  background: rgba(255,255,255,0.1); color: #fff; cursor: pointer; font-size: 15px;
  transition: background 0.2s, transform 0.2s;
}
.viewer-close:hover, .viewer-nav:hover { background: rgba(255,255,255,0.24); }
.viewer-close { top: 18px; right: 20px; }
.viewer-prev { left: 16px; top: 50%; transform: translateY(-50%); }
.viewer-next { right: 16px; top: 50%; transform: translateY(-50%); }
.viewer-counter { position: absolute; bottom: 18px; left: 50%; transform: translateX(-50%); font-size: 11.5px; color: rgba(255,255,255,0.7); font-variant-numeric: tabular-nums; }

/* 周边设施 */
.surroundings-list { display: flex; flex-direction: column; gap: 7px; }
.surrounding-card {
  display: flex; align-items: center; gap: 11px;
  width: 100%; text-align: left; font-family: inherit; cursor: pointer;
  padding: 11px 13px 11px 12px; border-radius: 11px;
  background: rgba(255,255,255,0.66);
  border: 1px solid rgba(27,67,50,0.09);
  border-left: 3px solid rgba(45,106,79,0.35);
  transition: border-color 0.2s, background 0.2s, transform 0.2s;
}
.surrounding-card:hover { background: #fff; border-color: rgba(45,106,79,0.28); transform: translateX(2px); }
.surrounding-card:hover .surrounding-go { opacity: 1; transform: translateX(0); }
.surrounding-go {
  flex-shrink: 0; font-size: 9px; color: rgba(27,67,50,0.4);
  opacity: 0; transform: translateX(-3px); transition: opacity 0.2s, transform 0.2s;
}
.surrounding-card.dir-n  { border-left-color: #4f8bc9; }
.surrounding-card.dir-ne { border-left-color: #3fa39a; }
.surrounding-card.dir-e  { border-left-color: #b8892b; }
.surrounding-card.dir-se { border-left-color: #c07a3e; }
.surrounding-card.dir-s  { border-left-color: #a8402f; }
.surrounding-card.dir-sw { border-left-color: #8e2e66; }
.surrounding-card.dir-w  { border-left-color: #6b5b95; }
.surrounding-card.dir-nw { border-left-color: #2d6a4f; }

.surrounding-arrow {
  width: 26px; height: 26px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font-size: 11px;
  background: rgba(216,243,220,0.7); color: #2d6a4f;
  transition: transform 0.25s;
}
.surrounding-card.dir-s .surrounding-arrow  { background: rgba(252,228,224,0.8); color: #a8402f; }
.surrounding-card.dir-e .surrounding-arrow  { background: rgba(253,240,213,0.85); color: #8a5b0a; }
.surrounding-card.dir-w .surrounding-arrow  { background: rgba(234,226,246,0.85); color: #4e3585; }
.surrounding-card.dir-n .surrounding-arrow  { background: rgba(227,235,250,0.85); color: #2b4c8c; }

.surrounding-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.surrounding-name { font-weight: 700; font-size: 12.5px; color: var(--primary); }
.surrounding-desc { font-size: 10.5px; color: var(--fg-muted); line-height: 1.5; }
.surrounding-tag {
  flex-shrink: 0; font-size: 9.5px; font-weight: 700; letter-spacing: 0.04em;
  color: rgba(27,67,50,0.45); padding: 2px 7px; border-radius: 999px;
  background: rgba(27,67,50,0.05);
}

/* 空状态 */
.el-empty { padding: 26px 16px; text-align: center; font-size: 11.5px; color: var(--fg-muted); background: rgba(255,255,255,0.4); border-radius: 10px; border: 1px dashed rgba(27,67,50,0.14); }

/* 开放时间 时间线 */
.timetable-view { display: flex; flex-direction: column; gap: 9px; }
.tt-group { background: rgba(255,255,255,0.55); border: 1px solid rgba(27,67,50,0.08); border-radius: 10px; overflow: hidden; }
.tt-days { font-weight: 700; font-size: 11.5px; color: var(--primary); background: rgba(216,243,220,0.55); padding: 8px 14px; display: flex; align-items: center; gap: 6px; }
.tt-days::before { content: '\f073'; font-family: 'Font Awesome 6 Free'; font-weight: 900; font-size: 11px; color: var(--accent); }
.tt-blocks { display: flex; flex-wrap: wrap; }
.tt-block { flex: 1; min-width: 88px; padding: 10px 12px; text-align: center; position: relative; overflow: hidden; transition: filter 0.2s; }
.tt-block:hover { filter: brightness(0.97); }
.tt-time { font-weight: 700; font-size: 12px; color: var(--fg); margin-bottom: 3px; font-variant-numeric: tabular-nums; }
.tt-label { font-size: 10.5px; font-weight: 500; }
.tt-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 2.5px; }

.tt-open { background: #D5F5E3; }
.tt-open .tt-label { color: #145A32; }
.tt-open .tt-bar-open { background: #27AE60; }

.tt-closed { background: #FDEDEC; }
.tt-closed .tt-label { color: #922B21; }
.tt-closed .tt-bar-closed { background: #E74C3C; }

.tt-mixed { background: #FEF9E7; }
.tt-mixed .tt-label { color: #7D6608; }
.tt-mixed .tt-bar-mixed { background: repeating-linear-gradient(90deg, #27AE60 0px, #27AE60 6px, #E74C3C 6px, #E74C3C 12px); }

.tt-note { font-size: 10.5px; color: var(--fg-muted); padding: 7px 14px 10px; border-top: 1px dashed rgba(27,67,50,0.1); display: flex; align-items: center; gap: 4px; }
.tt-note i { color: var(--accent); font-size: 11px; }

/* ============ 响应式 ============ */
@media (max-width: 900px) {
  .inline-panel-header { padding: 13px 14px 12px; gap: 10px; }
  .content-panel-icon { width: 36px; height: 36px; font-size: 15px; border-radius: 10px; }
  .content-panel-title { font-size: 16px; }
  .content-panel-sub { font-size: 10.5px; }
  .map-pin-btn { padding: 7px 10px; font-size: 10.5px; }
  .map-pin-btn span { display: none; }
  .inline-intro { padding: 10px 14px; }
  .inline-intro p { font-size: 11.5px; }
  .l2-tabs { padding: 0 8px; }
  .l2-tab-btn { padding: 10px 8px 9px; font-size: 11.5px; }
  .inline-body { padding: 13px 14px 16px; }
  .info-grid { grid-template-columns: 1fr 1fr; gap: 7px; }
  .info-card { padding: 10px; gap: 8px; }
  .info-icon { width: 26px; height: 26px; font-size: 11px; }
  .info-value { font-size: 12px; }
  .floor-layout { grid-template-columns: 1fr; }
  .contact-grid { grid-template-columns: 1fr; }
  .equip-card-body .info-grid { grid-template-columns: 1fr; }
  .album-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .wechat-block { flex-wrap: wrap; gap: 10px; padding: 11px 12px; }
  .wechat-info { min-width: 130px; }
  .wechat-copy { width: 100%; justify-content: center; }
  .wx-card { padding: 13px 13px 12px; }
  .wx-card-foot { flex-wrap: wrap; gap: 9px; }
  .wx-card-num { font-size: 17px; }
  .wx-card-copy { margin-left: 0; width: 100%; justify-content: center; }
  .wx-steps { gap: 5px; }
  .album-viewer { padding: 44px 12px; }
  .viewer-prev { left: 8px; }
  .viewer-next { right: 8px; }
  .viewer-close { top: 10px; right: 10px; }
}
@media (max-width: 380px) {
  .info-grid { grid-template-columns: 1fr; }
}
</style>