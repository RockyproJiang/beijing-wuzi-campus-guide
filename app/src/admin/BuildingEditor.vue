<template>
  <div class="a-modal-backdrop" @click.self="$emit('close')">
    <div class="a-modal wide">
      <div class="a-modal-head">
        <div>
          <div class="a-modal-title">{{ isEdit ? '编辑建筑' : '新建建筑' }}</div>
          <div class="a-modal-sub">
            {{ isEdit ? `${form.name} · #${building.id}` : '保存后会立即出现在前台数据中' }}
          </div>
        </div>
        <button class="a-close" @click="$emit('close')"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div class="a-modal-body">
        <div v-if="error" class="a-login-error" style="margin-bottom:14px;">{{ error }}</div>

        <div class="a-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="a-tab"
            :class="{ active: activeTab === tab.id }"
            type="button"
            @click="activeTab = tab.id"
          >
            <i :class="tab.icon" style="margin-right:5px;"></i>{{ tab.label }}
          </button>
        </div>

        <!-- 基础信息 -->
        <div v-show="activeTab === 'basic'" class="tab-pane">
          <div class="form-grid">
            <label class="a-field">
              <span class="a-label">建筑名称 *</span>
              <input v-model="form.name" class="a-input" placeholder="例如 第一教学楼" />
            </label>
            <label class="a-field">
              <span class="a-label">副标题</span>
              <input v-model="form.sub" class="a-input" placeholder="例如 主教学楼 / 经济学院" />
            </label>
            <label class="a-field">
              <span class="a-label">所属分类 *</span>
              <select v-model="form.categoryId" class="a-select">
                <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
              </select>
            </label>
            <label class="a-field">
              <span class="a-label">分组（可选）</span>
              <input v-model="form.group" class="a-input" placeholder="例如 停车场 / 澡堂" />
            </label>
          </div>

          <div class="alias-block">
            <div class="a-label">其他名称（别称）</div>
            <div class="a-hint" style="margin-bottom:7px;">
              别人习惯怎么叫它？搜索时会一并匹配，例如「人文楼」可以加「文科楼」「五号楼」。
            </div>
            <div class="alias-chips">
              <span v-for="(a, i) in form.aliases" :key="i" class="alias-chip">
                {{ a }}
                <button type="button" class="alias-chip-x" @click="form.aliases.splice(i, 1)">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              </span>
            </div>
            <div class="alias-add">
              <input
                v-model="aliasDraft"
                class="a-input"
                placeholder="输入别称后按回车"
                @keydown.enter.prevent="addAlias"
              />
              <button class="a-btn a-btn-sm" type="button" :disabled="!aliasDraft.trim()" @click="addAlias">
                <i class="fa-solid fa-plus"></i> 添加
              </button>
            </div>
          </div>

          <label class="a-field" style="margin-top:12px;">
            <span class="a-label">简介（详情页顶部展示，可留空）</span>
            <textarea v-model="form.intro" class="a-textarea" rows="3" placeholder="一句话说明这栋建筑的用途、位置或特色"></textarea>
          </label>

          <div class="form-grid" style="margin-top:12px;">
            <label class="a-field">
              <span class="a-label">图标</span>
              <div class="icon-row">
                <span class="icon-preview" :style="{ background: form.bgColor, color: form.color }">
                  <i :class="form.icon"></i>
                </span>
                <select v-model="form.icon" class="a-select icon-select">
                  <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">
                    {{ opt.label }}
                  </option>
                </select>
              </div>
            </label>
            <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px;">
              <label class="a-field">
                <span class="a-label">背景色</span>
                <input v-model="form.bgColor" class="a-input" type="color" />
              </label>
              <label class="a-field">
                <span class="a-label">文字色</span>
                <input v-model="form.color" class="a-input" type="color" />
              </label>
            </div>
          </div>

          <div class="color-preset-block">
            <div class="color-preset-head">
              <div class="a-label">一键配色（同时套用背景色和文字色）</div>
              <div class="cp-current">
                <template v-if="activePresetName">
                  <i class="fa-solid fa-circle-check"></i>
                  正在使用：<b>{{ activePresetName }}</b>
                </template>
                <template v-else-if="isCustomColor">
                  <i class="fa-solid fa-sliders"></i>
                  自定义配色
                </template>
              </div>
            </div>
            <div class="color-presets">
              <button
                v-for="preset in colorPresets"
                :key="preset.name"
                type="button"
                class="color-preset"
                :class="{ active: activePresetName === preset.name }"
                :style="{ background: preset.bg, color: preset.color }"
                :title="`${preset.name} · ${preset.bg} / ${preset.color}`"
                @click="applyPalette(preset)"
              >
                <span>{{ preset.name }}</span>
                <i class="fa-solid fa-check" v-if="activePresetName === preset.name"></i>
                <button
                  v-if="!presetLocked(preset)"
                  type="button" class="cp-del" title="删除这个预设"
                  @click.stop="removePreset(preset)"
                ><i class="fa-solid fa-xmark"></i></button>
              </button>
              <button type="button" class="color-preset cp-add" @click="addPreset">
                <i class="fa-solid fa-plus"></i><span>存为预设</span>
              </button>
            </div>
          </div>

          <div class="a-row" style="margin-top:14px;gap:18px;">
            <label class="a-switch">
              <input v-model="form.mapHidden" type="checkbox" />
              不在 3D 地图中显示
            </label>
            <span class="a-hint">适合“猫咪出没地”“施工区域”等没有明确位置或暂不展示的条目。</span>
          </div>
          <div v-if="form.mapHidden && (form.modelObjects || []).length" class="a-warn-row">
            <i class="fa-solid fa-triangle-exclamation"></i>
            这栋楼已经绑定了模型（{{ (form.modelObjects || []).join('、') }}）。勾选「不在地图中显示」后，
            <b>它的模型会被隐藏，在地图上点不到</b>。如果只是想调整位置，请不要勾选这里。
          </div>
        </div>

        <!-- 信息条目 -->
        <div v-show="activeTab === 'info'" class="tab-pane">
          <div class="a-row" style="margin-bottom:10px;">
            <div class="a-hint">先选类别，前台会按类别用不同样式展示；选「自定义」则按普通文字显示。</div>
            <div class="a-spacer"></div>
            <button class="a-btn a-btn-sm a-btn-primary" @click="addInfo">
              <i class="fa-solid fa-plus"></i> 添加条目
            </button>
          </div>
          <div v-if="form.info.length" class="info-presets">
            <span class="info-presets-label">常用：</span>
            <button
              v-for="p in infoPresets" :key="p.label" type="button" class="info-preset"
              @click="addInfo(p)"
            >
              <i :class="p.icon"></i> {{ p.label }}
            </button>
          </div>
          <div v-if="!form.info.length" class="a-empty"><i class="fa-solid fa-list"></i><p>暂无信息条目</p></div>
          <div v-for="(item, i) in form.info" :key="i" class="row-block">
            <select v-model="item.kind" class="a-select" style="max-width:112px;flex-shrink:0;">
              <option v-for="k in infoKinds" :key="k.value" :value="k.value">{{ k.label }}</option>
            </select>
            <input v-model="item.label" class="a-input" style="max-width:140px;" placeholder="标签，如 开门" />
            <textarea v-model="item.value" class="a-textarea" rows="1" style="min-height:36px;" placeholder="内容"></textarea>
            <div class="row-actions">
              <button class="a-btn a-btn-sm a-btn-icon" :disabled="i === 0" @click="move(form.info, i, -1)"><i class="fa-solid fa-arrow-up"></i></button>
              <button class="a-btn a-btn-sm a-btn-icon" :disabled="i === form.info.length - 1" @click="move(form.info, i, 1)"><i class="fa-solid fa-arrow-down"></i></button>
              <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="form.info.splice(i, 1)"><i class="fa-solid fa-trash"></i></button>
            </div>
          </div>
        </div>

        <!-- 设施设备 -->
        <div v-show="activeTab === 'equipment'" class="tab-pane">
          <div class="a-row" style="margin-bottom:10px;">
            <div class="a-hint">文印室、饮水机、洗衣机等设施，可附带价目表。</div>
            <div class="a-spacer"></div>
            <button class="a-btn a-btn-sm a-btn-primary" @click="addEquipment">
              <i class="fa-solid fa-plus"></i> 添加设施
            </button>
          </div>
          <div v-if="!form.equipment.length" class="a-empty"><i class="fa-solid fa-toolbox"></i><p>暂无设施设备</p></div>
          <details v-for="(equip, ei) in form.equipment" :key="ei" class="sub-card" open>
            <summary>
              <span class="sub-card-title"><i :class="equip.icon"></i> {{ equip.name || '未命名设施' }}</span>
              <button class="a-btn a-btn-sm a-btn-danger" type="button" @click.prevent="form.equipment.splice(ei, 1)">删除</button>
            </summary>
            <div class="form-grid" style="margin-top:10px;">
              <label class="a-field">
                <span class="a-label">设施名称</span>
                <input v-model="equip.name" class="a-input" placeholder="例如 文印室" />
              </label>
              <label class="a-field">
                <span class="a-label">图标</span>
                <select v-model="equip.icon" class="a-select">
                  <option v-for="opt in iconOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </select>
              </label>
            </div>

            <div class="sub-title">详情条目</div>
            <div v-for="(item, di) in equip.details" :key="di" class="row-block">
              <input v-model="item.label" class="a-input" style="max-width:140px;" placeholder="标签" />
              <textarea v-model="item.value" class="a-textarea" rows="1" style="min-height:36px;" placeholder="内容"></textarea>
              <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="equip.details.splice(di, 1)"><i class="fa-solid fa-trash"></i></button>
            </div>
            <button class="a-btn a-btn-sm" @click="equip.details.push({ label: '', value: '' })">
              <i class="fa-solid fa-plus"></i> 添加详情
            </button>

            <div class="sub-title">价目表（可选）</div>
            <div v-for="(section, si) in equip._priceSections" :key="si" class="price-section">
              <div class="row-block">
                <input v-model="section.title" class="a-input" placeholder="分组名称，如 黑白数码类" />
                <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="equip._priceSections.splice(si, 1)"><i class="fa-solid fa-trash"></i></button>
              </div>
              <div v-for="(row, ri) in section.rows" :key="ri" class="price-row">
                <input v-model="row.a" class="a-input" placeholder="项目" />
                <input v-model="row.b" class="a-input" placeholder="价格" />
                <input v-model="row.c" class="a-input" placeholder="备注（可选）" />
                <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="section.rows.splice(ri, 1)"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <button class="a-btn a-btn-sm" @click="section.rows.push({ a: '', b: '', c: '' })"><i class="fa-solid fa-plus"></i> 添加行</button>
            </div>
            <button class="a-btn a-btn-sm" @click="equip._priceSections.push({ title: '', rows: [{ a: '', b: '', c: '' }] })">
              <i class="fa-solid fa-plus"></i> 添加价目分组
            </button>
          </details>
        </div>

        <!-- 楼层 -->
        <div v-show="activeTab === 'floors'" class="tab-pane">
          <div class="a-row" style="margin-bottom:10px;">
            <div class="a-hint">每层可填写说明、亮点标签、方位布局和房间号。</div>
            <div class="a-spacer"></div>
            <button class="a-btn a-btn-sm a-btn-primary" @click="addFloor"><i class="fa-solid fa-plus"></i> 添加楼层</button>
          </div>
          <div v-if="!form.floors.length" class="a-empty"><i class="fa-solid fa-layer-group"></i><p>暂无楼层信息</p></div>
          <details v-for="(floor, fi) in form.floors" :key="fi" class="sub-card" open>
            <summary>
              <span class="sub-card-title"><i class="fa-solid fa-layer-group"></i> {{ floor.name || '未命名楼层' }}</span>
              <button class="a-btn a-btn-sm a-btn-danger" type="button" @click.prevent="form.floors.splice(fi, 1)">删除</button>
            </summary>
            <div class="form-grid" style="margin-top:10px;">
              <label class="a-field">
                <span class="a-label">楼层名称</span>
                <input v-model="floor.name" class="a-input" placeholder="1F / 2F-5F / 楼外" />
              </label>
              <label class="a-field">
                <span class="a-label">亮点标签（用顿号或逗号分隔）</span>
                <input v-model="floor._highlights" class="a-input" placeholder="文印室、开水间、AED" />
              </label>
            </div>
            <label class="a-field" style="margin-top:8px;">
              <span class="a-label">说明</span>
              <textarea v-model="floor.desc" class="a-textarea" rows="2"></textarea>
            </label>

            <div class="sub-title">方位布局</div>
            <div v-for="(row, ri) in floor._layoutRows" :key="ri" class="row-block">
              <input v-model="row.k" class="a-input" style="max-width:130px;" placeholder="方位，如 左下" />
              <input v-model="row.v" class="a-input" placeholder="设施说明" />
              <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="floor._layoutRows.splice(ri, 1)"><i class="fa-solid fa-trash"></i></button>
            </div>
            <button class="a-btn a-btn-sm" @click="floor._layoutRows.push({ k: '', v: '' })"><i class="fa-solid fa-plus"></i> 添加方位</button>

            <div class="sub-title">房间</div>
            <div v-for="(room, ri) in floor.rooms" :key="ri" class="row-block">
              <input v-model="room.number" class="a-input" style="max-width:110px;" placeholder="房间号" />
              <input v-model="room.name" class="a-input" placeholder="房间名称" />
              <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="floor.rooms.splice(ri, 1)"><i class="fa-solid fa-trash"></i></button>
            </div>
            <button class="a-btn a-btn-sm" @click="floor.rooms.push({ number: '', name: '' })"><i class="fa-solid fa-plus"></i> 添加房间</button>

            <div class="sub-title">小模块（选填，前台按类型显示不同样式）</div>
            <div v-if="floor.modules && floor.modules.length" class="floor-mod-list">
              <div v-for="(mod, mi) in floor.modules" :key="mi" class="floor-mod-row">
                <select v-model="mod.kind" class="a-select" style="max-width:118px;flex-shrink:0;">
                  <option v-for="k in floorModuleKinds" :key="k.value" :value="k.value">{{ k.label }}</option>
                </select>
                <input v-model="mod.label" class="a-input" style="max-width:150px;" placeholder="标签，如 开放时间" />
                <input v-model="mod.value" class="a-input" placeholder="内容" />
                <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="floor.modules.splice(mi, 1)"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
            <div class="info-presets" style="margin-top:8px;">
              <span class="info-presets-label">快速添加：</span>
              <button
                v-for="p in floorModulePresets" :key="p.kind + p.label"
                type="button" class="info-preset" @click="addFloorModule(floor, p)"
              ><i :class="p.icon"></i>{{ p.label }}</button>
              <button type="button" class="info-preset" @click="addFloorModule(floor, null)">
                <i class="fa-solid fa-plus"></i>自定义
              </button>
            </div>
          </details>
        </div>

        <!-- 时间 / 课表 -->
        <div v-show="activeTab === 'schedule'" class="tab-pane">
          <label class="a-field">
            <span class="a-label">作息时间文本（前台会按行解析为时间段）</span>
            <textarea v-model="form.schedule" class="a-textarea mono" rows="8" placeholder="第一节 08:00-08:45&#10;第二节 08:55-09:40"></textarea>
          </label>

          <div class="a-row" style="margin-top:16px;">
            <label class="a-switch">
              <input v-model="timetableEnabled" type="checkbox" />
              启用“开放 / 封闭”时段表
            </label>
            <div class="a-spacer"></div>
            <button v-if="timetableEnabled" class="a-btn a-btn-sm" @click="addTimetableGroup">
              <i class="fa-solid fa-plus"></i> 添加分组
            </button>
          </div>

          <template v-if="timetableEnabled">
            <div v-for="(group, gi) in form.timetable.groups" :key="gi" class="sub-card" style="margin-top:10px;">
              <div class="row-block">
                <input v-model="group.days" class="a-input" placeholder="例如 周一至周五" />
                <button class="a-btn a-btn-sm a-btn-danger" @click="form.timetable.groups.splice(gi, 1)"><i class="fa-solid fa-trash"></i></button>
              </div>
              <input v-model="group.note" class="a-input" style="margin-top:6px;" placeholder="备注（可选）" />
              <div v-for="(block, bi) in group.blocks" :key="bi" class="row-block" style="margin-top:6px;">
                <input v-model="block.time" class="a-input" style="max-width:150px;" placeholder="时间段" />
                <select v-model="block.status" class="a-select" style="max-width:110px;">
                  <option value="open">开放</option>
                  <option value="closed">封闭</option>
                  <option value="limited">限时</option>
                </select>
                <input v-model="block.label" class="a-input" placeholder="标签" />
                <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="group.blocks.splice(bi, 1)"><i class="fa-solid fa-xmark"></i></button>
              </div>
              <button class="a-btn a-btn-sm" @click="group.blocks.push({ time: '', status: 'open', label: '' })">
                <i class="fa-solid fa-plus"></i> 添加时段
              </button>
            </div>
          </template>
        </div>

        <!-- 联系方式 -->
        <div v-show="activeTab === 'contacts'" class="tab-pane">
          <div class="a-row" style="margin-bottom:10px;">
            <div class="a-hint">报修、售后、值班室等电话。</div>
            <div class="a-spacer"></div>
            <button class="a-btn a-btn-sm a-btn-primary" @click="form.contacts.push({ label: '', value: '' })">
              <i class="fa-solid fa-plus"></i> 添加电话
            </button>
          </div>
          <div v-for="(item, i) in form.contacts" :key="i" class="row-block">
            <input v-model="item.label" class="a-input" style="max-width:200px;" placeholder="标签，如 空调报修" />
            <input v-model="item.value" class="a-input" placeholder="电话号码" />
            <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="form.contacts.splice(i, 1)"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>

        <!-- 周边 -->
        <div v-show="activeTab === 'surroundings'" class="tab-pane">
          <div class="a-row" style="margin-bottom:10px;">
            <div class="a-hint">建筑周边的场地、设施和方向。</div>
            <div class="a-spacer"></div>
            <button class="a-btn a-btn-sm a-btn-primary" @click="form.surroundings.push({ direction: '', name: '', desc: '' })">
              <i class="fa-solid fa-plus"></i> 添加周边
            </button>
          </div>
          <div v-for="(item, i) in form.surroundings" :key="i" class="row-block">
            <input v-model="item.direction" class="a-input" style="max-width:90px;" placeholder="方向" />
            <input v-model="item.name" class="a-input" style="max-width:180px;" placeholder="名称" />
            <input v-model="item.desc" class="a-input" placeholder="说明" />
            <button class="a-btn a-btn-sm a-btn-icon a-btn-danger" @click="form.surroundings.splice(i, 1)"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>

        <!-- 3D 定位 -->
        <div v-show="activeTab === 'location'" class="tab-pane">
          <div class="box-cta">
            <div class="box-cta-icon"><i class="fa-solid fa-vector-square"></i></div>
            <div class="box-cta-text">
              <strong>在 3D 模型里框选位置</strong>
              <span>框内体块会全部绑定；框内没有体块时，在框中心生成可点击的地面光圈。</span>
            </div>
            <button class="a-btn a-btn-gold" @click="boxSelectOpen = true">
              <i class="fa-solid fa-vector-square"></i> 打开 3D 框选
            </button>
          </div>

          <div class="spatial-cta">
            <div class="spatial-cta-icon"><i class="fa-solid fa-draw-polygon"></i></div>
            <div class="spatial-cta-text">
              <strong>自定义 3D 区域与表面位置</strong>
              <span>
                平地可框选后编辑不规则顶点；模型墙面/屋顶可点击添加多个表面位置；前台悬停显示名称和说明。
              </span>
              <div class="spatial-counts">
                <span><b>{{ form.regions.length }}</b> 个平地区域</span>
                <span><b>{{ form.surfacePoints.length }}</b> 个表面位置</span>
              </div>
            </div>
            <button class="a-btn a-btn-primary" @click="spatialOpen = true">
              <i class="fa-solid fa-draw-polygon"></i> 打开区域编辑器
            </button>
          </div>

          <div class="form-grid">
            <div>
              <div class="a-label" style="margin-bottom:6px;">绑定 3D 模型对象</div>
              <div class="a-hint" style="margin-bottom:8px;">
                勾选后点击 3D 中的对应体块会打开这条记录；一个体块可以绑定多条记录。
              </div>
              <input v-model="objectSearch" class="a-input" placeholder="搜索模型对象名称…" />
              <div v-if="form.modelObjects.length" class="selected-chips">
                <span v-for="name in form.modelObjects" :key="name" class="a-tag a-tag-green">
                  {{ name }}
                  <button type="button" @click="toggleObject(name)">×</button>
                </span>
              </div>
              <div class="object-grid">
                <label v-for="obj in filteredObjects" :key="obj.name" class="object-item" :class="{ checked: form.modelObjects.includes(obj.name) }">
                  <input
                    type="checkbox"
                    :checked="form.modelObjects.includes(obj.name)"
                    @change="toggleObject(obj.name)"
                  />
                  <span class="object-name">{{ obj.name }}</span>
                  <span class="object-type">{{ typeLabel(obj.type) }}</span>
                </label>
              </div>
              <div class="a-hint" style="margin-top:6px;">已选 {{ form.modelObjects.length }} 个对象</div>
            </div>

            <div>
              <div class="a-label" style="margin-bottom:6px;">地面标记（没有模型对象时使用）</div>
              <label class="a-switch" style="margin-bottom:8px;">
                <input v-model="hasPin" type="checkbox" />
                使用地面标记
              </label>
              <div v-if="hasPin">
                <div class="a-row" style="gap:8px;margin-bottom:8px;">
                  <label class="a-field" style="flex:1;">
                    <span class="a-label">X</span>
                    <input v-model.number="form.pin.x" class="a-input" type="number" step="0.1" />
                  </label>
                  <label class="a-field" style="flex:1;">
                    <span class="a-label">Z</span>
                    <input v-model.number="form.pin.z" class="a-input" type="number" step="0.1" />
                  </label>
                  <button class="a-btn a-btn-sm" style="align-self:flex-end;" @click="togglePinPicker">
                    <i class="fa-solid fa-crosshairs"></i>
                    {{ pinPickerOpen ? '收起选点' : '3D 选点' }}
                  </button>
                </div>
                <PinPicker v-if="pinPickerOpen" v-model="form.pin" />
              </div>
              <div class="a-hint" style="margin-top:8px;">
                标记点显示在 3D 地面上。已有模型对象的建筑通常不需要标记；没有模型对象的条目靠标记定位。
              </div>

              <div class="sub-title" style="margin-top:14px;">旧版平面坐标（可选）</div>
              <div class="form-grid" style="grid-template-columns:1fr 1fr;gap:10px;">
                <label class="a-field">
                  <span class="a-label">mapX (%)</span>
                  <input v-model.number="form.mapX" class="a-input" type="number" step="0.01" />
                </label>
                <label class="a-field">
                  <span class="a-label">mapY (%)</span>
                  <input v-model.number="form.mapY" class="a-input" type="number" step="0.01" />
                </label>
              </div>
              <div class="a-hint" style="margin-top:6px;">
                仅用于数据兼容与换算参考；3D 地图以模型对象和地面标记为准。
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="a-modal-foot">
        <span class="a-hint" style="margin-right:auto;">
          {{ isEdit ? '修改会立即影响前台展示' : '保存后可在列表中继续编辑' }}
        </span>
        <button class="a-btn" :disabled="saving" @click="$emit('close')">取消</button>
        <button class="a-btn a-btn-primary" :disabled="saving" @click="save">
          <i class="fa-solid fa-check"></i>
          {{ saving ? '保存中…' : '保存' }}
        </button>
      </div>
    </div>

    <BoxSelect3D
      v-if="boxSelectOpen"
      :model-objects="form.modelObjects"
      :pin="hasPin ? form.pin : null"
      @close="boxSelectOpen = false"
      @apply="onBoxApply"
    />

    <SpatialEditor3D
      v-if="spatialOpen"
      :regions="form.regions"
      :surface-points="form.surfacePoints"
      :building-name="form.name"
      @close="spatialOpen = false"
      @apply="onSpatialApply"
    />
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, onMounted, ref } from 'vue'
import { api } from './api.js'

const PinPicker = defineAsyncComponent(() => import('./PinPicker.vue'))
const BoxSelect3D = defineAsyncComponent(() => import('./BoxSelect3D.vue'))
const SpatialEditor3D = defineAsyncComponent(() => import('./SpatialEditor3D.vue'))

const props = defineProps({
  building: { type: Object, default: null },
  categories: { type: Array, default: () => [] },
  objectOptions: { type: Array, default: () => [] },
  defaultCategoryId: { type: String, default: '' },
})
const emit = defineEmits(['close', 'saved'])

const isEdit = computed(() => Boolean(props.building))
const activeTab = ref('basic')
const saving = ref(false)
const error = ref('')
const timetableEnabled = ref(Boolean(props.building?.timetable))
const hasPin = ref(Boolean(props.building?.pin))
const pinPickerOpen = ref(false)
const boxSelectOpen = ref(false)
const spatialOpen = ref(false)
const objectSearch = ref('')

const tabs = [
  { id: 'basic', label: '基础', icon: 'fa-solid fa-circle-info' },
  { id: 'info', label: '信息', icon: 'fa-solid fa-list' },
  { id: 'equipment', label: '设施', icon: 'fa-solid fa-toolbox' },
  { id: 'floors', label: '楼层', icon: 'fa-solid fa-layer-group' },
  { id: 'schedule', label: '时间', icon: 'fa-solid fa-clock' },
  { id: 'contacts', label: '电话', icon: 'fa-solid fa-phone' },
  { id: 'surroundings', label: '周边', icon: 'fa-solid fa-map-location-dot' },
  { id: 'location', label: '3D 定位', icon: 'fa-solid fa-cube' },
]

const iconOptions = [
  { value: 'fa-solid fa-building', label: '建筑 · 通用' },
  { value: 'fa-solid fa-building-columns', label: '建筑 · 学院楼' },
  { value: 'fa-solid fa-school', label: '建筑 · 教学楼' },
  { value: 'fa-solid fa-house', label: '建筑 · 小楼/平房' },
  { value: 'fa-solid fa-bed', label: '宿舍' },
  { value: 'fa-solid fa-utensils', label: '餐饮 · 食堂' },
  { value: 'fa-solid fa-mug-hot', label: '餐饮 · 咖啡/饮品' },
  { value: 'fa-solid fa-futbol', label: '运动 · 球场' },
  { value: 'fa-solid fa-dumbbell', label: '运动 · 健身' },
  { value: 'fa-solid fa-store', label: '商业 · 店铺' },
  { value: 'fa-solid fa-cart-shopping', label: '商业 · 超市' },
  { value: 'fa-solid fa-scissors', label: '商业 · 理发' },
  { value: 'fa-solid fa-mobile-screen-button', label: '商业 · 营业厅' },
  { value: 'fa-solid fa-door-open', label: '出入口 / 门' },
  { value: 'fa-solid fa-square-parking', label: '停车场' },
  { value: 'fa-solid fa-shield-halved', label: '安保 / 监控' },
  { value: 'fa-solid fa-notes-medical', label: '医疗 / 健康' },
  { value: 'fa-solid fa-book', label: '图书 / 自习' },
  { value: 'fa-solid fa-flask', label: '实验 / 科研' },
  { value: 'fa-solid fa-landmark', label: '场馆 / 礼堂' },
  { value: 'fa-solid fa-graduation-cap', label: '教学 / 学术' },
  { value: 'fa-solid fa-print', label: '文印' },
  { value: 'fa-solid fa-soap', label: '洗衣 / 澡堂' },
  { value: 'fa-solid fa-bolt', label: '水电 / 能源' },
  { value: 'fa-solid fa-truck-fast', label: '物流 / 快递' },
  { value: 'fa-solid fa-droplet', label: '饮水 / 水务' },
  { value: 'fa-solid fa-tree', label: '绿地 / 景观' },
  { value: 'fa-solid fa-cat', label: '动物 · 猫咪' },
  { value: 'fa-solid fa-paw', label: '动物 · 宠物' },
  { value: 'fa-solid fa-camera-retro', label: '摄影 / 打卡点' },
  { value: 'fa-solid fa-calendar-star', label: '特色活动' },
  { value: 'fa-solid fa-map-location-dot', label: '地点 / 地标' },
  { value: 'fa-solid fa-seedling', label: '自然 · 草木' },
  { value: 'fa-solid fa-leaf', label: '自然 · 落叶' },
  { value: 'fa-solid fa-music', label: '文艺 / 活动' },
  { value: 'fa-solid fa-star', label: '其他 · 重点' },
  { value: 'fa-solid fa-toolbox', label: '设施 · 通用' },

  // ── 备用图标（分组更细，可选） ──
  { value: 'fa-solid fa-hotel', label: '建筑 · 公寓' },
  { value: 'fa-solid fa-warehouse', label: '建筑 · 仓库' },
  { value: 'fa-solid fa-industry', label: '建筑 · 厂房' },
  { value: 'fa-solid fa-tower-broadcast', label: '建筑 · 塔 / 信号' },
  { value: 'fa-solid fa-archway', label: '建筑 · 门洞' },
  { value: 'fa-solid fa-church', label: '建筑 · 礼堂' },
  { value: 'fa-solid fa-city', label: '建筑 · 建筑群' },
  { value: 'fa-solid fa-person-walking', label: '通行 · 步行' },
  { value: 'fa-solid fa-bicycle', label: '交通 · 自行车' },
  { value: 'fa-solid fa-motorcycle', label: '交通 · 电动车' },
  { value: 'fa-solid fa-car', label: '交通 · 汽车' },
  { value: 'fa-solid fa-bus', label: '交通 · 班车' },
  { value: 'fa-solid fa-charging-station', label: '交通 · 充电桩' },
  { value: 'fa-solid fa-gas-pump', label: '交通 · 加油站' },
  { value: 'fa-solid fa-plug', label: '水电 · 插座' },
  { value: 'fa-solid fa-faucet', label: '饮水 · 水龙头' },
  { value: 'fa-solid fa-shower', label: '卫浴 · 淋浴' },
  { value: 'fa-solid fa-toilet', label: '卫浴 · 卫生间' },
  { value: 'fa-solid fa-wind', label: '空调 / 通风' },
  { value: 'fa-solid fa-fire', label: '消防 / 火源' },
  { value: 'fa-solid fa-fire-extinguisher', label: '消防 · 灭火器' },
  { value: 'fa-solid fa-kit-medical', label: '医疗 · 急救包' },
  { value: 'fa-solid fa-heart-pulse', label: '医疗 · AED' },
  { value: 'fa-solid fa-pills', label: '医疗 · 药房' },
  { value: 'fa-solid fa-wheelchair', label: '无障碍' },
  { value: 'fa-solid fa-baby', label: '母婴室' },
  { value: 'fa-solid fa-video', label: '监控 / 摄像' },
  { value: 'fa-solid fa-wifi', label: '网络 · Wi-Fi' },
  { value: 'fa-solid fa-microchip', label: '网络 · 机房' },
  { value: 'fa-solid fa-desktop', label: '电脑 / 机房' },
  { value: 'fa-solid fa-keyboard', label: '电脑 · 键鼠' },
  { value: 'fa-solid fa-headphones', label: '影音 · 耳机' },
  { value: 'fa-solid fa-palette', label: '艺术 / 绘画' },
  { value: 'fa-solid fa-person-running', label: '运动 · 田径' },
  { value: 'fa-solid fa-basketball', label: '运动 · 篮球' },
  { value: 'fa-solid fa-table-tennis-paddle-ball', label: '运动 · 乒乓' },
  { value: 'fa-solid fa-golf-ball-tee', label: '运动 · 高尔夫' },
  { value: 'fa-solid fa-baseball', label: '运动 · 棒球' },
  { value: 'fa-solid fa-person-swimming', label: '运动 · 游泳' },
  { value: 'fa-solid fa-pizza-slice', label: '餐饮 · 小吃' },
  { value: 'fa-solid fa-mug-saucer', label: '餐饮 · 奶茶' },
  { value: 'fa-solid fa-cookie-bite', label: '餐饮 · 烘焙' },
  { value: 'fa-solid fa-wine-glass', label: '餐饮 · 饮品' },
  { value: 'fa-solid fa-bowl-food', label: '餐饮 · 面食' },
  { value: 'fa-solid fa-ice-cream', label: '餐饮 · 甜品' },
  { value: 'fa-solid fa-apple-whole', label: '餐饮 · 水果' },
  { value: 'fa-solid fa-burger', label: '餐饮 · 快餐' },
  { value: 'fa-solid fa-envelope', label: '服务 · 邮政' },
  { value: 'fa-solid fa-bell', label: '服务 · 通知' },
  { value: 'fa-solid fa-headset', label: '服务 · 客服' },
  { value: 'fa-solid fa-circle-info', label: '服务 · 咨询' },
  { value: 'fa-solid fa-clock', label: '时间 / 时钟' },
  { value: 'fa-solid fa-calendar-days', label: '日程 / 校历' },
  { value: 'fa-solid fa-location-arrow', label: '导航 / 指引' },
  { value: 'fa-solid fa-signs-post', label: '指示牌' },
  { value: 'fa-solid fa-map', label: '地图' },
  { value: 'fa-solid fa-compass', label: '方位 / 指南' },
  { value: 'fa-solid fa-trash', label: '垃圾桶' },
  { value: 'fa-solid fa-recycle', label: '回收站' },
  { value: 'fa-solid fa-broom', label: '保洁' },
  { value: 'fa-solid fa-boxes-stacked', label: '仓储 / 货架' },
  { value: 'fa-solid fa-box', label: '快递柜' },
  { value: 'fa-solid fa-bag-shopping', label: '购物袋' },
  { value: 'fa-solid fa-gift', label: '礼品 / 纪念品' },
  { value: 'fa-solid fa-ticket', label: '票务' },
  { value: 'fa-solid fa-chalkboard', label: '教室 / 黑板' },
  { value: 'fa-solid fa-pen-ruler', label: '设计 / 制图' },
  { value: 'fa-solid fa-flask-vial', label: '实验 · 试剂' },
  { value: 'fa-solid fa-atom', label: '科研 · 物理' },
  { value: 'fa-solid fa-dna', label: '科研 · 生物' },
  { value: 'fa-solid fa-calculator', label: '教学 · 计算' },
  { value: 'fa-solid fa-tablet-screen-button', label: '教学 · 平板' },
  { value: 'fa-solid fa-window-maximize', label: '空间 / 窗户' },
  { value: 'fa-solid fa-table', label: '空间 · 桌椅' },
  { value: 'fa-solid fa-bed-pulse', label: '宿舍 · 医务' },
  { value: 'fa-solid fa-people-roof', label: '活动 · 集合' },
  { value: 'fa-solid fa-comments', label: '交流 / 讨论' },
  { value: 'fa-solid fa-user-group', label: '人群 / 团队' },
  { value: 'fa-solid fa-hand-holding-heart', label: '公益 / 服务' },
  { value: 'fa-solid fa-clipboard-list', label: '事务 / 办理' },
  { value: 'fa-solid fa-stamp', label: '盖章 / 登记' },
  { value: 'fa-solid fa-file-signature', label: '手续 / 签字' },
  { value: 'fa-solid fa-lock', label: '门禁 / 上锁' },
  { value: 'fa-solid fa-key', label: '钥匙 / 门锁' },
  { value: 'fa-solid fa-sun', label: '天气 · 晴' },
  { value: 'fa-solid fa-cloud-rain', label: '天气 · 雨' },
  { value: 'fa-solid fa-snowflake', label: '天气 · 雪' },
  { value: 'fa-solid fa-tractor', label: '农事 / 园林' },
  { value: 'fa-solid fa-crow', label: '动物 · 鸟类' },
  { value: 'fa-solid fa-fish', label: '动物 · 鱼' },
  { value: 'fa-solid fa-dog', label: '动物 · 狗' },
  { value: 'fa-solid fa-bone', label: '动物 · 骨头' },

  // ── 已在用的旧图标（保证老数据能在下拉里选中） ──
  { value: 'fa-solid fa-book-open', label: '图书 · 开卷' },
  { value: 'fa-solid fa-basket-shopping', label: '商业 · 购物篮' },
  { value: 'fa-solid fa-building-shield', label: '安保 · 楼宇' },
  { value: 'fa-solid fa-user-shield', label: '安保 · 人员' },
  { value: 'fa-solid fa-drumstick-bite', label: '餐饮 · 荤菜' },
  { value: 'fa-solid fa-plate-wheat', label: '餐饮 · 套餐' },
  { value: 'fa-solid fa-hard-hat', label: '施工 · 安全帽' },
  { value: 'fa-solid fa-triangle-exclamation', label: '施工 · 警示' },
  { value: 'fa-solid fa-hospital', label: '医疗 · 医院' },
  { value: 'fa-solid fa-id-card', label: '证件 / 卡务' },
  { value: 'fa-solid fa-lightbulb', label: '照明 / 创意' },
  { value: 'fa-solid fa-masks-theater', label: '文艺 · 戏剧' },
  { value: 'fa-solid fa-phone-volume', label: '通讯 / 广播' },
  { value: 'fa-solid fa-restroom', label: '卫浴 · 公共' },
  { value: 'fa-solid fa-scale-balanced', label: '法务 / 公正' },
  { value: 'fa-solid fa-shop', label: '商业 · 小铺' },
  { value: 'fa-solid fa-volleyball', label: '运动 · 排球' },
  { value: 'fa-solid fa-water', label: '水体 / 湖' },
]

const infoKinds = [
  { value: 'text', label: '普通文字' },
  { value: 'time', label: '时间' },
  { value: 'function', label: '功能' },
  { value: 'price', label: '价格' },
  { value: 'location', label: '位置' },
  { value: 'booking', label: '预约' },
  { value: 'capacity', label: '容纳人数' },
  { value: 'contact', label: '联系' },
  { value: 'note', label: '备注' },
  { value: 'custom', label: '自定义' },
]

const infoPresets = [
  { label: '开放时间', kind: 'time', icon: 'fa-solid fa-clock', value: '' },
  { label: '功能', kind: 'function', icon: 'fa-solid fa-list-check', value: '' },
  { label: '价格', kind: 'price', icon: 'fa-solid fa-tag', value: '' },
  { label: '位置', kind: 'location', icon: 'fa-solid fa-location-dot', value: '' },
  { label: '预约方式', kind: 'booking', icon: 'fa-solid fa-calendar-check', value: '' },
  { label: '容纳人数', kind: 'capacity', icon: 'fa-solid fa-users', value: '' },
  { label: '备注', kind: 'note', icon: 'fa-solid fa-circle-info', value: '' },
]

/* 楼层小模块：类别与预设 */
const floorModuleKinds = [
  { value: 'text', label: '普通文字' },
  { value: 'time', label: '开放时间' },
  { value: 'function', label: '功能' },
  { value: 'price', label: '价格' },
  { value: 'location', label: '位置' },
  { value: 'facility', label: '设施设备' },
  { value: 'notice', label: '注意事项' },
  { value: 'contact', label: '联系方式' },
  { value: 'capacity', label: '容纳人数' },
]

const floorModulePresets = [
  { label: '开放时间', kind: 'time', icon: 'fa-solid fa-clock' },
  { label: '本层功能', kind: 'function', icon: 'fa-solid fa-list-check' },
  { label: '价格 / 收费', kind: 'price', icon: 'fa-solid fa-tag' },
  { label: '位置指引', kind: 'location', icon: 'fa-solid fa-location-dot' },
  { label: '设施设备', kind: 'facility', icon: 'fa-solid fa-toolbox' },
  { label: '注意事项', kind: 'notice', icon: 'fa-solid fa-triangle-exclamation' },
  { label: '联系方式', kind: 'contact', icon: 'fa-solid fa-phone' },
  { label: '容纳人数', kind: 'capacity', icon: 'fa-solid fa-users' },
]

const aliasDraft = ref('')

function addAlias() {
  const v = aliasDraft.value.trim()
  if (!v) return
  if (form.value.aliases.includes(v)) { aliasDraft.value = ''; return }
  if (form.value.aliases.length >= 20) return
  form.value.aliases.push(v)
  aliasDraft.value = ''
}

function addInfo(preset) {
  form.value.info.push({
    label: preset?.label || '',
    value: preset?.value || '',
    kind: preset?.kind || 'text',
  })
}

const BUILTIN_PRESETS = [
  // ── 原有 12 套（校园主调：墨绿 + 米金） ──
  { name: '松柏', bg: '#D8F3DC', color: '#1B4332' },
  { name: '苔绿', bg: '#E3F0E6', color: '#2D6A4F' },
  { name: '竹青', bg: '#E8F3EC', color: '#24503C' },
  { name: '奶油', bg: '#F6ECD6', color: '#7A5A1E' },
  { name: '麦穗', bg: '#F7E8C8', color: '#8A6420' },
  { name: '陶土', bg: '#F6E3D8', color: '#8C4A2F' },
  { name: '雾蓝', bg: '#E7EEF8', color: '#3C5F85' },
  { name: '青瓷', bg: '#E4F1F0', color: '#2F6F69' },
  { name: '藕紫', bg: '#F0E8F2', color: '#6B4A72' },
  { name: '砖红', bg: '#F7E0DA', color: '#9A3B2E' },
  { name: '灰岩', bg: '#ECE9E2', color: '#4A4A43' },
  { name: '墨金', bg: '#EFE4C8', color: '#5A4416' },

  // ── 新增：更鲜明的区分色（分类配色用） ──
  { name: '琥珀', bg: '#FDF0D5', color: '#8A5B0A' },
  { name: '珊瑚', bg: '#FCE4E0', color: '#A8402F' },
  { name: '玫红', bg: '#FBE3EC', color: '#A32B5C' },
  { name: '绛紫', bg: '#EAE2F6', color: '#4E3585' },
  { name: '靛蓝', bg: '#E3EBFA', color: '#2B4C8C' },
  { name: '湖蓝', bg: '#DFF1F6', color: '#1F6178' },
  { name: '松石', bg: '#DDF2EC', color: '#17685A' },
  { name: '橄榄', bg: '#EEF0D8', color: '#5A6420' },
  { name: '栗褐', bg: '#EFE4DA', color: '#5C3A22' },
  { name: '石墨', bg: '#E6E8EA', color: '#333A40' },
  { name: '银灰', bg: '#F0F1F2', color: '#4F5A63' },
  { name: '杏橘', bg: '#FDEADB', color: '#96501A' },
  { name: '柠檬', bg: '#FBF6D3', color: '#7A6B0E' },
  { name: '薄荷', bg: '#E2F6EF', color: '#1D6B54' },
  { name: '天青', bg: '#E5F2FB', color: '#1B5E86' },
  { name: '葡萄', bg: '#F2E6F4', color: '#6B2E76' },
  { name: '玫紫', bg: '#F8E4F0', color: '#8E2E66' },
  { name: '赭石', bg: '#F1E3D3', color: '#7A4A26' },
]

/* 用户自定义预设（存后端 settings，跨浏览器/管理员共享） */
const userPresets = ref([])
const colorPresets = computed(() => [...BUILTIN_PRESETS, ...userPresets.value])

const builtinNames = new Set(BUILTIN_PRESETS.map((p) => p.name))
function presetLocked(preset) {
  return builtinNames.has(preset.name)
}

const norm = (v) => String(v || '').trim().toLowerCase()
const activePresetName = computed(() => {
  const bg = norm(form.value.bgColor)
  const fg = norm(form.value.color)
  const hit = colorPresets.value.find((p) => norm(p.bg) === bg && norm(p.color) === fg)
  return hit ? hit.name : ''
})
const isCustomColor = computed(() => !activePresetName.value)

async function savePresets(list) {
  try {
    const res = await fetch('/api/admin/color-presets', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ presets: list }),
      credentials: 'include',
    })
    if (res.ok) {
      const data = await res.json()
      userPresets.value = data.presets || []
    }
  } catch {
    /* 网络异常时保留本地状态 */
  }
}

async function loadPresets() {
  try {
    const res = await fetch('/api/admin/color-presets', { headers: { Accept: 'application/json' }, credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    userPresets.value = data.presets || []
  } catch {
    /* 忽略 */
  }
}
onMounted(loadPresets)

function applyPalette(preset) {
  form.value.bgColor = preset.bg
  form.value.color = preset.color
}

function addPreset() {
  const bg = form.value.bgColor
  const fg = form.value.color
  if (norm(bg) === norm(fg)) {
    window.alert('背景色和文字色不能相同，否则文字看不见。')
    return
  }
  const name = window.prompt('给这套配色起个名字（最多 12 个字）', '我的配色')
  if (name === null) return
  const clean = name.trim().slice(0, 12)
  if (!clean) return
  const exists = colorPresets.value.find((p) => p.name === clean)
  if (exists) {
    if (!window.confirm(`已有同名预设「${clean}」，要覆盖它的颜色吗？`)) return
    if (presetLocked(exists)) {
      window.alert('内置预设不能覆盖，请换一个名字。')
      return
    }
    savePresets(userPresets.value.map((p) => (p.name === clean ? { name: clean, bg, color: fg } : p)))
    return
  }
  savePresets([...userPresets.value, { name: clean, bg, color: fg }])
}

function removePreset(preset) {
  if (presetLocked(preset)) return
  if (!window.confirm(`删除预设「${preset.name}」？`)) return
  savePresets(userPresets.value.filter((p) => p.name !== preset.name))
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value))
}

function createForm() {
  if (props.building) {
    const b = deepClone(props.building)
    return {
      name: b.name || '',
      sub: b.sub || '',
      aliases: [...(b.aliases || [])],
      intro: b.intro || '',
      icon: b.icon || 'fa-solid fa-building',
      bgColor: b.bgColor || '#D8F3DC',
      color: b.color || '#1B4332',
      categoryId: b.categoryId || props.defaultCategoryId || '',
      mapX: b.mapX ?? null,
      mapY: b.mapY ?? null,
      mapHidden: Boolean(b.mapHidden),
      group: b.group || '',
      info: (b.info || []).map((x) => ({ label: x.label || '', value: x.value || '', kind: x.kind || 'text' })),
      equipment: (b.equipment || []).map((e) => ({
        name: e.name || '',
        icon: e.icon || 'fa-solid fa-toolbox',
        details: (e.details || []).map((d) => ({ label: d.label || '', value: d.value || '' })),
        _priceSections: Object.entries(e.priceTable || {}).map(([title, rows]) => ({
          title,
          rows: (rows || []).map((r) => ({ a: r[0] || '', b: r[1] || '', c: r[2] || '' })),
        })),
      })),
      floors: (b.floors || []).map((f) => ({
        name: f.name || '',
        desc: f.desc || '',
        _highlights: (f.highlights || []).join('、'),
        _layoutRows: Object.entries(f.layout || {}).map(([k, v]) => ({ k, v })),
        rooms: (f.rooms || []).map((r) => ({ number: r.number || '', name: r.name || '' })),
        modules: (f.modules || []).map((m) => ({ kind: m.kind || 'text', label: m.label || '', value: m.value || '' })),
      })),
      schedule: b.schedule || '',
      contacts: (b.contacts || []).map((c) => ({ label: c.label || '', value: c.value || '' })),
      surroundings: (b.surroundings || []).map((s) => ({ direction: s.direction || '', name: s.name || '', desc: s.desc || '' })),
      timetable: deepClone(b.timetable || { groups: [] }),
      modelObjects: [...(b.modelObjects || [])],
      pin: { x: Number(b.pin?.x) || 0, z: Number(b.pin?.z) || 0 },
      regions: deepClone(b.regions || []),
      surfacePoints: deepClone(b.surfacePoints || []),
    }
  }

  const cat = props.categories.find((c) => c.id === props.defaultCategoryId) || props.categories[0]
  return {
    name: '',
    sub: '',
    aliases: [],
    intro: '',
    icon: 'fa-solid fa-building',
    bgColor: cat?.bgColor || '#D8F3DC',
    color: cat?.color || '#1B4332',
    categoryId: cat?.id || '',
    mapX: null,
    mapY: null,
    mapHidden: false,
    group: '',
    info: [{ label: '位置', value: '', kind: 'location' }],
    equipment: [],
    floors: [],
    schedule: '',
    contacts: [],
    surroundings: [],
    timetable: { groups: [] },
    modelObjects: [],
    pin: { x: 0, z: 0 },
    regions: [],
    surfacePoints: [],
  }
}

const form = ref(createForm())

const filteredObjects = computed(() => {
  const q = objectSearch.value.trim().toLowerCase()
  if (!q) return props.objectOptions
  return props.objectOptions.filter((o) => o.name.toLowerCase().includes(q))
})

function toggleObject(name) {
  const list = form.value.modelObjects
  const i = list.indexOf(name)
  if (i > -1) list.splice(i, 1)
  else list.push(name)
}

function typeLabel(type) {
  return { building: '建筑', court: '场地', landscape: '景观', other: '其他' }[type] || type
}

function togglePinPicker() {
  hasPin.value = true
  pinPickerOpen.value = !pinPickerOpen.value
}

function onBoxApply(result) {
  boxSelectOpen.value = false
  if (result.modelObjects?.length) {
    form.value.modelObjects = [...result.modelObjects]
    hasPin.value = false
    pinPickerOpen.value = false
  } else if (result.pin) {
    form.value.modelObjects = []
    form.value.pin = { x: Number(result.pin.x) || 0, z: Number(result.pin.z) || 0 }
    hasPin.value = true
    pinPickerOpen.value = false
  } else if (result.cleared) {
    form.value.modelObjects = []
    hasPin.value = false
    pinPickerOpen.value = false
  }
}

function onSpatialApply(result) {
  form.value.regions = result.regions || []
  form.value.surfacePoints = result.surfacePoints || []
  spatialOpen.value = false
}

function move(list, index, delta) {
  const next = index + delta
  if (next < 0 || next >= list.length) return
  ;[list[index], list[next]] = [list[next], list[index]]
}

function addEquipment() {
  form.value.equipment.push({
    name: '',
    icon: 'fa-solid fa-toolbox',
    details: [{ label: '', value: '' }],
    _priceSections: [],
  })
}

function addFloor() {
  form.value.floors.push({
    name: '',
    desc: '',
    _highlights: '',
    _layoutRows: [],
    rooms: [],
    modules: [],
  })
}

function addFloorModule(floor, preset) {
  if (!floor.modules) floor.modules = []
  if (floor.modules.length >= 40) return
  floor.modules.push({
    kind: preset?.kind || 'text',
    label: preset?.label || '',
    value: '',
  })
}

function addTimetableGroup() {
  if (!form.value.timetable) form.value.timetable = { groups: [] }
  form.value.timetable.groups.push({
    days: '',
    note: '',
    blocks: [{ time: '', status: 'open', label: '' }],
  })
}

function splitHighlights(text) {
  return String(text || '')
    .split(/[、,，;；\n]/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function rowsToObject(rows) {
  const result = {}
  for (const row of rows || []) {
    if (row.k && row.k.trim()) result[row.k.trim()] = row.v || ''
  }
  return result
}

function sectionsToObject(sections) {
  const result = {}
  for (const section of sections || []) {
    if (!section.title || !section.title.trim()) continue
    const rows = []
    for (const row of section.rows || []) {
      if (!row.a && !row.b && !row.c) continue
      const values = [row.a || '', row.b || '', row.c || '']
      while (values.length > 2 && !values[values.length - 1]) values.pop()
      rows.push(values)
    }
    if (rows.length) result[section.title.trim()] = rows
  }
  return result
}

function buildPayload() {
  const f = form.value
  return {
    name: f.name.trim(),
    sub: f.sub.trim(),
    aliases: (f.aliases || []).map((a) => String(a).trim()).filter(Boolean),
    intro: f.intro || '',
    icon: f.icon || 'fa-solid fa-building',
    bgColor: f.bgColor,
    color: f.color,
    categoryId: f.categoryId,
    mapX: f.mapX === null || f.mapX === '' ? null : Number(f.mapX),
    mapY: f.mapY === null || f.mapY === '' ? null : Number(f.mapY),
    mapHidden: Boolean(f.mapHidden),
    group: f.group?.trim() || null,
    info: f.info.filter((x) => x.label || x.value).map((x) => ({ label: x.label, value: x.value, kind: x.kind || 'text' })),
    equipment: f.equipment.map((e) => {
      const item = {
        name: e.name,
        icon: e.icon,
        details: e.details.filter((d) => d.label || d.value),
      }
      const priceTable = sectionsToObject(e._priceSections)
      if (Object.keys(priceTable).length) item.priceTable = priceTable
      return item
    }),
    floors: f.floors.map((x) => {
      const item = { name: x.name }
      if (x.desc) item.desc = x.desc
      const highlights = splitHighlights(x._highlights)
      if (highlights.length) item.highlights = highlights
      const layout = rowsToObject(x._layoutRows)
      if (Object.keys(layout).length) item.layout = layout
      const rooms = (x.rooms || []).filter((r) => r.number || r.name)
      if (rooms.length) item.rooms = rooms
      const modules = (x.modules || []).filter((m) => m.label || m.value)
      if (modules.length) item.modules = modules.map((m) => ({ kind: m.kind || 'text', label: m.label || '', value: m.value || '' }))
      return item
    }),
    schedule: f.schedule?.trim() || null,
    contacts: f.contacts.filter((c) => c.label || c.value).length
      ? f.contacts.filter((c) => c.label || c.value)
      : null,
    surroundings: f.surroundings.filter((s) => s.name || s.desc).length
      ? f.surroundings.filter((s) => s.name || s.desc)
      : null,
    timetable: timetableEnabled.value ? f.timetable : null,
    modelObjects: f.modelObjects,
    pin: hasPin.value ? { x: Number(f.pin.x) || 0, z: Number(f.pin.z) || 0 } : null,
    regions: f.regions || [],
    surfacePoints: f.surfacePoints || [],
  }
}

async function save() {
  error.value = ''
  if (!form.value.name.trim()) {
    error.value = '请填写建筑名称'
    activeTab.value = 'basic'
    return
  }
  if (!form.value.categoryId) {
    error.value = '请选择所属分类'
    activeTab.value = 'basic'
    return
  }
  saving.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value) {
      await api(`/buildings/${props.building.id}`, { method: 'PUT', body: payload })
    } else {
      await api('/buildings', { method: 'POST', body: payload })
    }
    emit('saved')
  } catch (e) {
    const details = Array.isArray(e.details) ? e.details.slice(0, 3).map((d) => `${d.path} ${d.message}`).join('；') : ''
    error.value = e.message + (details ? `（${details}）` : '')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.tab-pane { animation: fade 0.2s ease; }
@keyframes fade { from { opacity: 0.4; } to { opacity: 1; } }
.a-warn-row {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 9px;
  padding: 9px 12px;
  border-radius: 9px;
  background: rgba(212, 168, 83, 0.14);
  border: 1px solid rgba(212, 168, 83, 0.36);
  color: #8a6420;
  font-size: 11.5px;
  line-height: 1.65;
}
.a-warn-row i { margin-top: 3px; font-size: 12px; }
.box-cta {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px 14px;
  margin-bottom: 14px;
  border: 1px solid rgba(201, 154, 69, 0.35);
  background: linear-gradient(100deg, rgba(246, 236, 214, 0.8), rgba(255, 253, 248, 0.55));
  border-radius: 11px;
}
.box-cta-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--a-accent);
  color: #2a210f;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.box-cta-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.box-cta-text strong { font-size: 12.5px; color: var(--a-primary); }
.box-cta-text span { font-size: 10.5px; color: var(--a-muted); line-height: 1.5; }
.spatial-cta {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 13px 14px;
  margin-bottom: 14px;
  border: 1px solid rgba(45, 106, 79, 0.28);
  background: linear-gradient(100deg, rgba(216, 243, 220, 0.65), rgba(255, 253, 248, 0.55));
  border-radius: 11px;
}
.spatial-cta-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--a-primary);
  color: var(--a-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  flex-shrink: 0;
}
.spatial-cta-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.spatial-cta-text strong { font-size: 12.5px; color: var(--a-primary); }
.spatial-cta-text span { font-size: 10.5px; color: var(--a-muted); line-height: 1.5; }
.spatial-counts { display: flex; gap: 12px; margin-top: 3px; font-size: 10px; color: var(--a-muted); }
.spatial-counts b { color: var(--a-primary); }
.color-preset-block { margin-top: 11px; }
.color-preset-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.cp-current {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10px; font-weight: 600; color: var(--a-muted, #6b7280);
  padding: 2px 9px; border-radius: 999px; background: rgba(212, 168, 83, 0.14);
}
.cp-current i { font-size: 9px; color: #b8892b; }
.cp-current b { color: #8a6420; }
.color-presets { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 5px; margin-top: 6px; }
.color-preset {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2px;
  padding: 6px 7px;
  border-radius: 7px;
  border: 1px solid rgba(27, 67, 50, 0.1);
  font-size: 9.5px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.15s, box-shadow 0.15s;
}
.color-preset:hover { transform: translateY(-1px); box-shadow: 0 4px 10px rgba(27, 67, 50, 0.12); }
.color-preset.active { outline: 2px solid var(--a-accent); outline-offset: 1px; }
.color-preset i { font-size: 8px; }
.cp-del {
  position: absolute; top: -6px; right: -6px;
  width: 15px; height: 15px; border-radius: 50%;
  display: none; align-items: center; justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.85);
  background: #9a3b2e; color: #fff; font-size: 7px;
  cursor: pointer; padding: 0; line-height: 1;
}
.color-preset:hover .cp-del { display: flex; }
.cp-add {
  justify-content: center; gap: 4px;
  border-style: dashed; border-color: rgba(27, 67, 50, 0.28);
  background: rgba(216, 243, 220, 0.4); color: #2d6a4f;
}
.cp-add:hover { background: rgba(216, 243, 220, 0.85); }
@media (max-width: 700px) { .color-presets { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.row-block { display: flex; align-items: flex-start; gap: 7px; margin-bottom: 7px; }
.row-block .a-textarea { flex: 1; }
.row-actions { display: flex; gap: 3px; flex-shrink: 0; }
.row-actions .a-btn { width: 28px; height: 32px; padding: 0; }
.icon-row { display: flex; align-items: center; gap: 7px; }
.icon-preview { width: 34px; height: 34px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 14px; }
.icon-select { flex: 1; min-width: 0; }

.alias-block { margin-top: 12px; }
.alias-chips { display: flex; flex-wrap: wrap; gap: 6px; }
.alias-chip {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 4px 6px 4px 10px; border-radius: 8px; font-size: 11.5px; font-weight: 600;
  background: rgba(216,243,220,0.72); color: #1B4332; border: 1px solid rgba(27,67,50,0.16);
}
.alias-chip-x {
  border: none; background: none; cursor: pointer; padding: 0 2px;
  color: rgba(27,67,50,0.5); font-size: 10px; line-height: 1;
}
.alias-chip-x:hover { color: #9A3B2E; }
.alias-add { display: flex; gap: 7px; margin-top: 7px; }
.alias-add .a-input { flex: 1; min-width: 0; }

.info-presets {
  display: flex; flex-wrap: wrap; align-items: center; gap: 6px;
  margin-bottom: 10px; padding: 8px 10px; border-radius: 9px;
  background: rgba(246,236,214,0.55); border: 1px dashed rgba(27,67,50,0.16);
}
.info-presets-label { font-size: 10.5px; font-weight: 700; color: rgba(27,67,50,0.55); }
.info-preset {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 3px 9px; border-radius: 999px; cursor: pointer; font-size: 11px; font-weight: 600;
  background: rgba(255,253,248,0.95); color: #2D6A4F; border: 1px solid rgba(27,67,50,0.14);
  transition: background 0.15s, border-color 0.15s;
}
.info-preset:hover { background: #fff; border-color: rgba(45,106,79,0.42); }
.info-preset i { font-size: 9.5px; opacity: 0.7; }

.floor-mod-list { display: flex; flex-direction: column; gap: 6px; }
.floor-mod-row { display: flex; align-items: center; gap: 6px; }
.sub-card {
  border: 1px solid var(--a-border);
  border-radius: 11px;
  padding: 12px;
  margin-bottom: 10px;
  background: #fdfbf6;
}
.sub-card summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  cursor: pointer;
  list-style: none;
}
.sub-card summary::-webkit-details-marker { display: none; }
.sub-card-title { font-size: 12.5px; font-weight: 700; color: var(--a-primary); display: flex; align-items: center; gap: 6px; }
.sub-title { font-size: 11px; font-weight: 700; color: var(--a-muted); margin: 12px 0 6px; letter-spacing: 0.04em; }
.price-section { background: #f7f3e9; border-radius: 8px; padding: 8px; margin-bottom: 7px; }
.price-row { display: grid; grid-template-columns: 1.4fr 0.9fr 1.4fr 30px; gap: 5px; margin-bottom: 5px; }
.mono { font-family: ui-monospace, 'Cascadia Code', monospace; font-size: 11.5px; }
.object-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3px;
  max-height: 230px;
  overflow-y: auto;
  border: 1px solid var(--a-border);
  border-radius: 9px;
  padding: 6px;
  margin-top: 7px;
  background: #fdfbf6;
}
.object-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 6px;
  border-radius: 6px;
  font-size: 10.5px;
  cursor: pointer;
  min-width: 0;
}
.object-item:hover { background: var(--a-bg); }
.object-item.checked { background: var(--a-pale); color: var(--a-primary); }
.object-item input { accent-color: var(--a-primary); }
.object-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.object-type { font-size: 8.5px; color: var(--a-muted); }
.selected-chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 6px; }
.selected-chips .a-tag button {
  border: none;
  background: none;
  padding: 0 0 0 3px;
  color: var(--a-primary);
  font-size: 11px;
  line-height: 1;
  cursor: pointer;
}
@media (max-width: 760px) {
  .form-grid { grid-template-columns: 1fr; }
  .price-row { grid-template-columns: 1fr 1fr; }
  .price-row > :nth-child(3) { grid-column: 1 / -1; }
  .object-grid { grid-template-columns: 1fr; }
}
</style>
