import { z } from 'zod'

const colorSchema = z.string().trim().regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/, '颜色需为 #RRGGBB 格式')

export const INFO_KINDS = [
  'text', 'time', 'function', 'price', 'location',
  'booking', 'capacity', 'contact', 'note', 'custom',
]

export const infoItemSchema = z.object({
  label: z.string().trim().min(1).max(64),
  value: z.string().max(8000).default(''),
  // 预设类别：决定前台用哪种视觉样式展示这条信息
  kind: z.enum(INFO_KINDS).default('text'),
})

const priceTableSchema = z.record(
  z.string().max(64),
  z.array(z.array(z.string().max(500)).min(1).max(5)).max(200)
)

export const equipmentSchema = z.object({
  name: z.string().trim().min(1).max(64),
  icon: z.string().trim().max(128).default('fa-solid fa-toolbox'),
  details: z.array(infoItemSchema).max(100).default([]),
  priceTable: priceTableSchema.optional(),
})

const roomSchema = z.object({
  number: z.string().trim().max(32).default(''),
  name: z.string().trim().max(255).default(''),
})

// 楼层小模块的类别（后台下拉选择，前台按类别给不同样式）
export const FLOOR_MODULE_KINDS = [
  'text', 'time', 'function', 'price', 'location', 'facility', 'notice', 'contact', 'capacity',
]

const floorModuleSchema = z.object({
  kind: z.enum(FLOOR_MODULE_KINDS).default('text'),
  label: z.string().trim().max(64).default(''),
  value: z.string().max(2000).default(''),
})

export const floorSchema = z.object({
  name: z.string().trim().min(1).max(32),
  desc: z.string().max(8000).optional(),
  highlights: z.array(z.string().max(200)).max(80).optional(),
  layout: z.record(z.string().max(32), z.string().max(2000)).optional(),
  rooms: z.array(roomSchema).max(500).optional(),
  modules: z.array(floorModuleSchema).max(40).optional(),
})

export const timetableSchema = z.object({
  groups: z.array(z.object({
    days: z.string().trim().min(1).max(64),
    note: z.string().max(500).optional(),
    blocks: z.array(z.object({
      time: z.string().trim().max(64).default(''),
      status: z.string().trim().max(32).default('open'),
      label: z.string().trim().max(64).default(''),
    })).max(80),
  })).max(20),
})

export const contactSchema = z.object({
  label: z.string().trim().min(1).max(64),
  value: z.string().trim().max(255).default(''),
})

export const surroundingSchema = z.object({
  direction: z.string().trim().max(16).optional(),
  name: z.string().trim().min(1).max(64),
  desc: z.string().max(1000).optional(),
})

const mapCoord = z.number().min(0).max(100).nullable().optional()

export const regionPointSchema = z.object({
  x: z.number().min(-2000).max(2000),
  z: z.number().min(-2000).max(2000),
})

export const regionSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  desc: z.string().max(2000).default(''),
  shape: z.enum(['flat', 'box']).default('flat'),
  points: z.array(regionPointSchema).min(3).max(80),
  baseY: z.number().min(-500).max(2000).default(0.9),
  height: z.number().min(0).max(200).default(0.6),
  color: colorSchema.default('#D4A853'),
  opacity: z.number().min(0.05).max(0.8).default(0.28),
  hoverOpacity: z.number().min(0.05).max(1).default(0.5),
})

export const surfacePointSchema = z.object({
  id: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(128),
  desc: z.string().max(2000).default(''),
  position: z.object({
    x: z.number().min(-2000).max(2000),
    y: z.number().min(-500).max(2000),
    z: z.number().min(-2000).max(2000),
  }),
  normal: z.object({
    x: z.number().min(-1).max(1),
    y: z.number().min(-1).max(1),
    z: z.number().min(-1).max(1),
  }),
  radius: z.number().min(0.5).max(200).default(10),
  shape: z.enum(['circle', 'rect', 'poly']).default('circle'),
  width: z.number().min(1).max(400).default(20),
  height: z.number().min(1).max(400).default(12),
  points: z.array(regionPointSchema).max(80).default([]),
  color: colorSchema.default('#D4A853'),
  source: z.enum(['surface', 'face', 'half']).optional(),
  group: z.string().trim().max(64).optional(),
  uAxis: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  vAxis: z.object({ x: z.number(), y: z.number(), z: z.number() }).optional(),
  rot: z.number().min(-3600).max(3600).optional(),
  size: z.object({
    width: z.number().min(0.2).max(400),
    height: z.number().min(0.2).max(400),
  }).optional(),
  cut: z.object({
    angle: z.number().min(-360).max(360),
    offset: z.number().min(-2000).max(2000),
    mode: z.enum(['half', 'split']).optional(),
    side: z.enum(['pos', 'neg']).optional(),
    span: z.number().min(0.2).max(2000).optional(),
  }).optional(),
})

export const buildingSchema = z.object({
  name: z.string().trim().min(1).max(128),
  sub: z.string().trim().max(255).default(''),
  aliases: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
  intro: z.string().max(8000).default(''),
  icon: z.string().trim().max(128).default('fa-solid fa-building'),
  bgColor: colorSchema.default('#D8F3DC'),
  color: colorSchema.default('#1B4332'),
  categoryId: z.string().trim().min(1).max(32),
  mapX: mapCoord,
  mapY: mapCoord,
  mapHidden: z.boolean().default(false),
  group: z.string().trim().max(64).nullable().optional(),
  info: z.array(infoItemSchema).max(200).default([]),
  equipment: z.array(equipmentSchema).max(60).default([]),
  floors: z.array(floorSchema).max(80).default([]),
  schedule: z.string().max(8000).nullable().optional(),
  contacts: z.array(contactSchema).max(100).nullable().optional(),
  surroundings: z.array(surroundingSchema).max(100).nullable().optional(),
  timetable: timetableSchema.nullable().optional(),
  modelObjects: z.array(z.string().trim().max(64)).max(30).default([]),
  pin: z.object({
    x: z.number().min(-2000).max(2000),
    z: z.number().min(-2000).max(2000),
  }).nullable().optional(),
  regions: z.array(regionSchema).max(30).default([]),
  surfacePoints: z.array(surfacePointSchema).max(60).default([]),
})

export const categoryCreateSchema = z.object({
  id: z.string().trim().regex(/^[a-z][a-z0-9_-]{1,31}$/, '分类 ID 需为小写字母开头，可含数字、- 和 _'),
  name: z.string().trim().min(1).max(64),
  icon: z.string().trim().max(128).default('fa-solid fa-building'),
  bgColor: colorSchema.default('#D8F3DC'),
  color: colorSchema.default('#1B4332'),
})

export const categoryUpdateSchema = categoryCreateSchema.omit({ id: true })

export const calendarSchema = z.object({
  title: z.string().trim().max(128).default(''),
  items: z.array(z.object({
    event: z.string().trim().min(1).max(128),
    date: z.string().trim().max(128).default(''),
  })).max(300),
})

export const tipSchema = z.object({
  content: z.string().trim().min(1).max(500),
})

export const aliasSchema = z.object({
  keyword: z.string().trim().min(1).max(64),
  ids: z.array(z.string().trim().max(32)).max(120).default([]),
})

export const reorderSchema = z.object({
  ids: z.array(z.string().trim().max(32)).min(1).max(1000),
})

export const loginSchema = z.object({
  username: z.string().trim().min(1).max(64),
  password: z.string().min(1).max(200),
})

export const digitalCampusSchema = z.record(z.string(), z.any())

export const submissionSchema = z.object({
  buildingId: z.string().trim().max(32).nullable().optional(),
  buildingName: z.string().trim().max(128).default(''),
  placeName: z.string().trim().max(128).default(''),
  pin: z.object({
    x: z.number().min(-2000).max(2000),
    z: z.number().min(-2000).max(2000),
  }).nullable().optional(),
  type: z.enum(['photo', 'supplement', 'correction', 'new', 'closed', 'moved', 'other']).default('correction'),
  content: z.string().trim().max(4000).default(''),
  occurredAt: z.string().trim().max(32).default(''),
  contact: z.string().trim().max(128).default(''),
  /** 投稿人署名（默认匿名） */
  authorName: z.string().trim().max(64).default(''),
  /** 照片投稿：压缩后的 dataURL，服务端落盘 */
  dataUrl: z.string().max(12 * 1024 * 1024).optional(),
  thumbDataUrl: z.string().max(2 * 1024 * 1024).optional(),
  photoWidth: z.number().int().min(0).max(20000).optional(),
  photoHeight: z.number().int().min(0).max(20000).optional(),
  origBytes: z.number().int().min(0).optional(),
}).refine((v) => Boolean(v.buildingId || v.placeName || v.pin), {
  message: '请选择建筑或在地图上点选位置',
  path: ['buildingId'],
}).refine((v) => {
  // 照片投稿必须有图；其余类型必须有至少 5 个字描述
  if (v.type === 'photo') return Boolean(v.dataUrl)
  return (v.content || '').length >= 5
}, {
  message: '照片投稿请上传一张照片；信息补充/内容纠错请至少写 5 个字',
  path: ['content'],
})

export const submissionStatusSchema = z.object({
  status: z.enum(['pending', 'processed', 'ignored']),
  adminNote: z.string().trim().max(500).optional(),
})

/** 管理员直接修改一条位置投稿 */
export const submissionUpdateSchema = z.object({
  buildingId: z.string().trim().max(32).nullable().optional(),
  buildingName: z.string().trim().max(128).optional(),
  placeName: z.string().trim().max(128).optional(),
  pin: z.object({
    x: z.number().min(-2000).max(2000),
    z: z.number().min(-2000).max(2000),
  }).nullable().optional(),
  clearPin: z.boolean().optional(),
  type: z.enum(['photo', 'supplement', 'new', 'correction', 'closed', 'moved', 'other']).optional(),
  content: z.string().trim().max(4000).optional(),
  authorName: z.string().trim().max(64).optional(),
  occurredAt: z.string().trim().max(32).optional(),
  contact: z.string().trim().max(128).optional(),
  status: z.enum(['pending', 'processed', 'ignored']).optional(),
  adminNote: z.string().trim().max(500).optional(),
})

/* ---------------- 楼体相册 ---------------- */

const imageSize = z.number().int().min(0).max(20000)

export const albumFolderSchema = z.object({
  name: z.string().trim().min(1).max(64),
  description: z.string().trim().max(255).default(''),
  buildingId: z.string().trim().max(32).nullable().optional(),
  sortOrder: z.number().int().min(0).max(9999).default(0),
})

export const albumFolderUpdateSchema = albumFolderSchema.partial()

/** 单张照片上传（前端已在浏览器里压缩好，后端只落盘） */
export const albumPhotoSchema = z.object({
  folderId: z.number().int().positive().nullable().optional(),
  buildingId: z.string().trim().max(32).nullable().optional(),
  title: z.string().trim().max(128).default(''),
  caption: z.string().trim().max(500).default(''),
  dataUrl: z.string().min(32).max(8 * 1024 * 1024),
  thumbDataUrl: z.string().max(1024 * 1024).optional(),
  width: imageSize.default(0),
  height: imageSize.default(0),
  origBytes: z.number().int().min(0).max(200 * 1024 * 1024).default(0),
  source: z.enum(['admin', 'wechat', 'other']).default('wechat'),
})

export const albumPhotoUpdateSchema = z.object({
  folderId: z.number().int().positive().nullable().optional(),
  buildingId: z.string().trim().max(32).nullable().optional(),
  title: z.string().trim().max(128).optional(),
  caption: z.string().trim().max(500).optional(),
  sortOrder: z.number().int().min(0).max(9999).optional(),
})

export const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  nextPassword: z.string().min(4).max(200),
})

const importBuildingSchema = z.object({
  id: z.string().trim().regex(/^[A-Za-z0-9_-]{1,32}$/),
  name: z.string().trim().min(1).max(128),
  sub: z.string().trim().max(255).default(''),
  aliases: z.array(z.string().trim().min(1).max(64)).max(20).default([]),
  intro: z.string().max(8000).default(''),
  icon: z.string().trim().max(128).default('fa-solid fa-building'),
  bgColor: colorSchema.default('#D8F3DC'),
  color: colorSchema.default('#1B4332'),
  mapX: mapCoord,
  mapY: mapCoord,
  mapHidden: z.boolean().default(false),
  group: z.string().trim().max(64).nullable().optional(),
  info: z.array(infoItemSchema).max(200).default([]),
  equipment: z.array(equipmentSchema).max(60).default([]),
  floors: z.array(floorSchema).max(80).default([]),
  schedule: z.string().max(8000).nullable().optional(),
  contacts: z.array(contactSchema).max(100).nullable().optional(),
  surroundings: z.array(surroundingSchema).max(100).nullable().optional(),
  timetable: timetableSchema.nullable().optional(),
  modelObjects: z.array(z.string().trim().max(64)).max(30).default([]),
  pin: z.object({ x: z.number().min(-2000).max(2000), z: z.number().min(-2000).max(2000) }).nullable().optional(),
  regions: z.array(regionSchema).max(30).default([]),
  surfacePoints: z.array(surfacePointSchema).max(60).default([]),
})

export const importDataSchema = z.object({
  categories: z.array(z.object({
    id: z.string().trim().regex(/^[a-z][a-z0-9_-]{1,31}$/),
    name: z.string().trim().min(1).max(64),
    icon: z.string().trim().max(128).default('fa-solid fa-building'),
    bgColor: colorSchema.default('#D8F3DC'),
    color: colorSchema.default('#1B4332'),
    buildings: z.array(importBuildingSchema).max(300).default([]),
  })).min(1).max(40),
  calendar: calendarSchema.optional(),
  digitalCampus: digitalCampusSchema.optional(),
  tips: z.array(z.string().trim().min(1).max(500)).max(300).optional(),
  aliases: z.array(aliasSchema).max(1000).optional(),
})
