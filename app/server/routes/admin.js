import { Router } from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { jpegSize, removeFile, saveDataUrl } from '../album.js'

/** 从 dataURL 估算真实字节数与尺寸（后端做一次上限校验，防止绕过前端压缩） */
function pickImageSize(dataUrl) {
  const match = /^data:image\/[a-z0-9.+-]+;base64,([\s\S]+)$/i.exec(String(dataUrl || ''))
  const base64 = match ? match[1] : ''
  const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0)
  let width = 0
  let height = 0
  try {
    const buffer = Buffer.from(base64, 'base64')
    const size = jpegSize(buffer)
    if (size) { width = size.width; height = size.height }
  } catch {
    /* 非 jpeg 时尺寸留空，由数据库默认值兜底 */
  }
  return { bytes: Math.max(0, bytes), width, height }
}
import {
  authenticate,
  changePassword,
  checkLoginRate,
  clearLoginFailures,
  clearSessionCookie,
  getAdminById,
  requireAdmin,
  setSessionCookie,
  recordLoginFailure,
} from '../auth.js'
import {
  createAlbumFolder,
  createAlbumPhoto,
  deleteAlbumFolder,
  deleteAlbumPhoto,
  getAlbumStats,
  listAlbumFolders,
  listAlbumPhotos,
  reorderAlbumPhotos,
  syncAlbumFoldersForBuildings,
  updateAlbumFolder,
  updateAlbumPhoto,
  createAlias,
  createBuilding,
  createCategory,
  createTip,
  deleteAlias,
  deleteBuilding,
  deleteCategory,
  deleteSubmission,
  deleteTip,
  exportData,
  getBuilding,
  getCalendar,
  getColorPresets,
  getDigitalCampus,
  getModelTransform,
  getOverview,
  importData,
  listAliases,
  listAudit,
  listBuildings,
  listCategories,
  listSubmissions,
  listTips,
  listTrash,
  logAudit,
  purgeBuilding,
  purgeCategory,
  restoreBuilding,
  restoreCategory,
  reorderBuildings,
  reorderCategories,
  saveCalendar,
  saveColorPresets,
  saveDigitalCampus,
  getSchoolProfile,
  saveSchoolProfile,
  updateAlias,
  updateSubmissionStatus,
  updateSubmission,
  updateBuilding,
  updateCategory,
  updateTip,
} from '../repo.js'
import { ApiError, wrap } from '../utils.js'
import { ALBUM_DIR as ALBUM_DIR_, SUBMISSIONS_DIR } from '../paths.js'
import { q, one } from '../db.js'
import {
  albumFolderSchema,
  albumFolderUpdateSchema,
  albumPhotoSchema,
  albumPhotoUpdateSchema,
  aliasSchema,
  buildingSchema,
  calendarSchema,
  categoryCreateSchema,
  categoryUpdateSchema,
  digitalCampusSchema,
  importDataSchema,
  loginSchema,
  passwordSchema,
  reorderSchema,
  submissionStatusSchema,
  submissionUpdateSchema,
  tipSchema,
} from '../validate.js'

const router = Router()

function publicAdmin(admin) {
  return {
    id: Number(admin.id),
    username: admin.username,
    displayName: admin.display_name || admin.displayName || '管理员',
    lastLoginAt: admin.last_login_at || admin.lastLoginAt || null,
  }
}

router.post('/login', wrap(async (req, res) => {
  checkLoginRate(req)
  const input = loginSchema.parse(req.body)
  const admin = await authenticate(input.username, input.password)
  if (!admin) {
    recordLoginFailure(req)
    await logAudit({
      admin: { id: null, username: input.username },
      action: 'login_failed',
      entity: 'auth',
      detail: { username: input.username },
      ip: req.ip,
    })
    throw new ApiError(401, '账号或密码不正确', 'BAD_CREDENTIALS')
  }
  clearLoginFailures(req)
  setSessionCookie(res, admin)
  await logAudit({ admin, action: 'login', entity: 'auth', ip: req.ip })
  res.json({ admin: publicAdmin(admin) })
}))

router.post('/logout', (req, res) => {
  clearSessionCookie(res)
  res.json({ ok: true })
})

router.use(requireAdmin)

router.get('/me', wrap(async (req, res) => {
  const admin = await getAdminById(req.admin.id)
  if (!admin) {
    clearSessionCookie(res)
    throw new ApiError(401, '账号不存在', 'UNAUTHORIZED')
  }
  res.json({ admin: publicAdmin(admin) })
}))

router.post('/password', wrap(async (req, res) => {
  const input = passwordSchema.parse(req.body)
  await changePassword(req.admin.id, input.currentPassword, input.nextPassword)
  await logAudit({ admin: req.admin, action: 'change_password', entity: 'auth', ip: req.ip })
  res.json({ ok: true })
}))

/* ---------------- 概览 ---------------- */
router.get('/overview', wrap(async (req, res) => {
  res.json({ ...(await getOverview()), recent: await listAudit({ limit: 8 }) })
}))

/* ---------------- 分类 ---------------- */
router.get('/categories', wrap(async (req, res) => {
  res.json({ items: await listCategories({ includeDeleted: req.query.deleted === '1' }) })
}))

router.post('/categories', wrap(async (req, res) => {
  const input = categoryCreateSchema.parse(req.body)
  const item = await createCategory(input)
  await logAudit({ admin: req.admin, action: 'create', entity: 'category', entityId: item.id, detail: input, ip: req.ip })
  res.status(201).json({ item })
}))

router.post('/categories/reorder', wrap(async (req, res) => {
  const input = reorderSchema.parse(req.body)
  await reorderCategories(input.ids)
  await logAudit({ admin: req.admin, action: 'reorder', entity: 'category', detail: { ids: input.ids }, ip: req.ip })
  res.json({ ok: true })
}))

router.put('/categories/:id', wrap(async (req, res) => {
  const input = categoryUpdateSchema.parse(req.body)
  const item = await updateCategory(req.params.id, input)
  await logAudit({ admin: req.admin, action: 'update', entity: 'category', entityId: item.id, detail: input, ip: req.ip })
  res.json({ item })
}))

router.delete('/categories/:id', wrap(async (req, res) => {
  await deleteCategory(req.params.id)
  await logAudit({ admin: req.admin, action: 'delete', entity: 'category', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

router.post('/categories/:id/restore', wrap(async (req, res) => {
  await restoreCategory(req.params.id)
  await logAudit({ admin: req.admin, action: 'restore', entity: 'category', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

router.delete('/categories/:id/purge', wrap(async (req, res) => {
  await purgeCategory(req.params.id)
  await logAudit({ admin: req.admin, action: 'purge', entity: 'category', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

/* ---------------- 建筑 ---------------- */
router.get('/buildings', wrap(async (req, res) => {
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 200))
  const offset = Math.max(0, Number(req.query.offset) || 0)
  const result = await listBuildings({
    categoryId: String(req.query.category || ''),
    search: String(req.query.q || ''),
    includeDeleted: req.query.deleted === '1',
    limit,
    offset,
  })
  res.json(result)
}))

router.post('/buildings/reorder', wrap(async (req, res) => {
  const categoryId = String(req.body?.categoryId || '')
  if (!categoryId) throw new ApiError(400, '缺少分类 ID')
  const input = reorderSchema.parse({ ids: req.body.ids })
  await reorderBuildings(categoryId, input.ids)
  await logAudit({ admin: req.admin, action: 'reorder', entity: 'building', entityId: categoryId, detail: { ids: input.ids }, ip: req.ip })
  res.json({ ok: true })
}))

router.get('/buildings/:id', wrap(async (req, res) => {
  const item = await getBuilding(req.params.id)
  if (!item) throw new ApiError(404, '建筑不存在')
  res.json({ item })
}))

router.post('/buildings', wrap(async (req, res) => {
  const input = buildingSchema.parse(req.body)
  const item = await createBuilding(input)
  await logAudit({ admin: req.admin, action: 'create', entity: 'building', entityId: item.id, detail: { name: item.name }, ip: req.ip })
  res.status(201).json({ item })
}))

router.put('/buildings/:id', wrap(async (req, res) => {
  const input = buildingSchema.parse(req.body)
  const item = await updateBuilding(req.params.id, input)
  await logAudit({ admin: req.admin, action: 'update', entity: 'building', entityId: item.id, detail: { name: item.name }, ip: req.ip })
  res.json({ item })
}))

router.delete('/buildings/:id', wrap(async (req, res) => {
  await deleteBuilding(req.params.id)
  await logAudit({ admin: req.admin, action: 'delete', entity: 'building', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

router.post('/buildings/:id/restore', wrap(async (req, res) => {
  await restoreBuilding(req.params.id)
  await logAudit({ admin: req.admin, action: 'restore', entity: 'building', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

router.delete('/buildings/:id/purge', wrap(async (req, res) => {
  await purgeBuilding(req.params.id)
  await logAudit({ admin: req.admin, action: 'purge', entity: 'building', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

/* ---------------- 校历 ---------------- */
router.get('/calendar', wrap(async (req, res) => {
  res.json({ calendar: await getCalendar() })
}))

router.put('/calendar', wrap(async (req, res) => {
  const input = calendarSchema.parse(req.body)
  const calendar = await saveCalendar(input)
  await logAudit({ admin: req.admin, action: 'update', entity: 'calendar', detail: { title: calendar.title, count: calendar.items.length }, ip: req.ip })
  res.json({ calendar })
}))

/* ---------------- 数字校园 ---------------- */
router.get('/digital-campus', wrap(async (req, res) => {
  res.json({ digitalCampus: (await getDigitalCampus()) || {} })
}))

router.put('/digital-campus', wrap(async (req, res) => {
  const input = digitalCampusSchema.parse(req.body)
  const digitalCampus = await saveDigitalCampus(input)
  await logAudit({
    admin: req.admin,
    action: 'update',
    entity: 'digital_campus',
    detail: {
      apps: input.apps?.length || 0,
      services: input.services?.length || 0,
      departments: input.departments?.length || 0,
    },
    ip: req.ip,
  })
  res.json({ digitalCampus })
}))

/* ---------------- 学校信息（关于页） ---------------- */
router.get('/school-profile', wrap(async (req, res) => {
  res.json({ schoolProfile: (await getSchoolProfile()) || {} })
}))

router.put('/school-profile', wrap(async (req, res) => {
  const schoolProfile = await saveSchoolProfile(req.body || {})
  await logAudit({
    admin: req.admin,
    action: 'update',
    entity: 'school_profile',
    detail: { name: schoolProfile.name || '' },
    ip: req.ip,
  })
  res.json({ schoolProfile })
}))

/* ---------------- 一键配色预设 ---------------- */
router.get('/color-presets', wrap(async (req, res) => {
  res.json({ presets: (await getColorPresets()) || [] })
}))

router.put('/color-presets', wrap(async (req, res) => {
  const body = req.body || {}
  const list = Array.isArray(body.presets) ? body.presets : []
  const clean = []
  const seen = new Set()
  for (const item of list) {
    const name = String(item?.name || '').trim().slice(0, 24)
    const bg = String(item?.bg || '').trim().toLowerCase()
    const color = String(item?.color || '').trim().toLowerCase()
    if (!name || !/^#[0-9a-f]{6}$/.test(bg) || !/^#[0-9a-f]{6}$/.test(color)) continue
    if (seen.has(name)) continue
    seen.add(name)
    clean.push({ name, bg, color })
    if (clean.length >= 120) break
  }
  const presets = await saveColorPresets(clean)
  res.json({ presets })
}))

/* ---------------- 提示 ---------------- */
router.get('/tips', wrap(async (req, res) => {
  res.json({ items: await listTips() })
}))

router.post('/tips', wrap(async (req, res) => {
  const input = tipSchema.parse(req.body)
  const item = await createTip(input.content)
  await logAudit({ admin: req.admin, action: 'create', entity: 'tip', entityId: item.id, detail: { content: item.content }, ip: req.ip })
  res.status(201).json({ item })
}))

router.put('/tips/:id', wrap(async (req, res) => {
  const input = tipSchema.parse(req.body)
  const item = await updateTip(req.params.id, input.content)
  await logAudit({ admin: req.admin, action: 'update', entity: 'tip', entityId: item.id, ip: req.ip })
  res.json({ item })
}))

router.delete('/tips/:id', wrap(async (req, res) => {
  await deleteTip(req.params.id)
  await logAudit({ admin: req.admin, action: 'delete', entity: 'tip', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

/* ---------------- 搜索别名 ---------------- */
router.get('/aliases', wrap(async (req, res) => {
  res.json({ items: await listAliases() })
}))

router.post('/aliases', wrap(async (req, res) => {
  const input = aliasSchema.parse(req.body)
  const item = await createAlias(input)
  await logAudit({ admin: req.admin, action: 'create', entity: 'alias', entityId: item.id, detail: { keyword: item.keyword }, ip: req.ip })
  res.status(201).json({ item })
}))

router.put('/aliases/:id', wrap(async (req, res) => {
  const input = aliasSchema.parse(req.body)
  const item = await updateAlias(req.params.id, input)
  await logAudit({ admin: req.admin, action: 'update', entity: 'alias', entityId: item.id, detail: { keyword: item.keyword }, ip: req.ip })
  res.json({ item })
}))

router.delete('/aliases/:id', wrap(async (req, res) => {
  await deleteAlias(req.params.id)
  await logAudit({ admin: req.admin, action: 'delete', entity: 'alias', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

/* ---------------- 回收站 ---------------- */
router.get('/trash', wrap(async (req, res) => {
  res.json(await listTrash())
}))

/* ---------------- 审计 ---------------- */
router.get('/audit', wrap(async (req, res) => {
  const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 30))
  const offset = Math.max(0, Number(req.query.offset) || 0)
  res.json({ items: await listAudit({ limit, offset }) })
}))

/* ---------------- 导入导出 ---------------- */
router.get('/export', wrap(async (req, res) => {
  const data = await exportData()
  const stamp = new Date().toISOString().slice(0, 10)
  res.setHeader('Content-Disposition', `attachment; filename="bwz-campus-${stamp}.json"`)
  res.json(data)
}))

router.post('/import', wrap(async (req, res) => {
  const mode = req.body?.mode === 'merge' ? 'merge' : 'replace'
  const payload = importDataSchema.parse(req.body?.data)
  const result = await importData(payload, mode)
  await logAudit({
    admin: req.admin,
    action: 'import',
    entity: 'site',
    detail: { mode, counts: result.counts, backup: result.backup ? String(result.backup).split(/[\\/]/).pop() : null },
    ip: req.ip,
  })
  res.json(result)
}))

/* ---------------- 模型坐标设置（后台定位用） ---------------- */
router.get('/model-transform', wrap(async (req, res) => {
  res.json({ transform: await getModelTransform() })
}))

/* ---------------- 位置投稿 ---------------- */
router.get('/submissions', wrap(async (req, res) => {
  const status = ['pending', 'processed', 'ignored'].includes(req.query.status) ? req.query.status : ''
  res.json({ items: await listSubmissions({ status }) })
}))

router.patch('/submissions/:id', wrap(async (req, res) => {
  const { status, adminNote } = submissionStatusSchema.parse(req.body)
  const item = await updateSubmissionStatus(Number(req.params.id), status, adminNote)
  await logAudit({
    admin: req.admin,
    action: 'update',
    entity: 'submission',
    entityId: String(item.id),
    detail: { status },
    ip: req.ip,
  })
  res.json({ item })
}))

/* 管理员直接编辑投稿内容（建筑 / 地点 / 坐标 / 描述 / 联系方式 / 备注） */
/**
 * 照片投稿一键入库：把待审核照片搬进该建筑的楼体相册，并标记投稿已处理。
 * body: { title?, caption?, folderId? }
 */
router.post('/submissions/:id/publish', wrap(async (req, res) => {
  const id = Number(req.params.id)
  const row = await one('SELECT * FROM location_submissions WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '投稿不存在')
  if (row.type !== 'photo') throw new ApiError(400, '只有照片投稿可以入库')
  if (!row.photo_path) throw new ApiError(400, '这条投稿没有照片文件')
  if (row.published_photo_id) throw new ApiError(409, '这张照片已经入库过了')
  if (!row.building_id) throw new ApiError(400, '这条投稿没有关联建筑，无法入库')

  // 目标文件夹：优先用请求指定，否则用该建筑绑定的文件夹
  let folderId = req.body?.folderId ? Number(req.body.folderId) : null
  if (!folderId) {
    const folder = await one('SELECT id FROM album_folders WHERE building_id = ? ORDER BY id LIMIT 1', [row.building_id])
    folderId = folder?.id ? Number(folder.id) : null
  }
  const folderKey = albumFolderName(folderId)

  // 投稿照片走「与管理员上传完全相同」的入库流程：
  // 读成 dataURL → storeAlbumPhoto（统一压缩校验 / 缩略图 / 写库）
  const srcMain = path.join(SUB_DIR, row.photo_path)
  if (!fs.existsSync(srcMain)) throw new ApiError(410, '照片文件已丢失')
  const dataUrl = fileToDataUrl(srcMain)
  const thumbDataUrl = row.photo_thumb ? fileToDataUrl(path.join(SUB_DIR, row.photo_thumb)) : ''

  const item = await storeAlbumPhoto({
    folderId,
    buildingId: row.building_id,
    title: String(req.body?.title || row.place_name || row.building_name || ''),
    caption: String(req.body?.caption || row.content || ''),
    dataUrl,
    thumbDataUrl,
    width: Number(row.photo_width) || 0,
    height: Number(row.photo_height) || 0,
    origBytes: Number(row.photo_bytes) || 0,
    source: 'wechat',
  })

  await q('UPDATE location_submissions SET published_photo_id = ?, status = ? WHERE id = ?', [item.id, 'processed', id])
  // 入库成功后清理 pending 文件
  try {
    removeFile(SUB_DIR, row.photo_path)
    if (row.photo_thumb) removeFile(SUB_DIR, row.photo_thumb)
  } catch { /* 清理失败不影响结果 */ }

  await logAudit({ admin: req.admin, action: 'create', entity: 'album_photo', entityId: String(item.id), detail: { fromSubmission: id, folder: folderKey }, ip: req.ip })
  res.json({ ok: true, photo: item, submissionId: id })
}))

router.put('/submissions/:id', wrap(async (req, res) => {
  const payload = submissionUpdateSchema.parse(req.body)
  const item = await updateSubmission(Number(req.params.id), payload)
  await logAudit({
    admin: req.admin,
    action: 'update',
    entity: 'submission',
    entityId: String(item.id),
    detail: { edited: true, status: item.status },
    ip: req.ip,
  })
  res.json({ item })
}))

router.delete('/submissions/:id', wrap(async (req, res) => {
  const id = Number(req.params.id)
  const result = await deleteSubmission(id)
  await logAudit({
    admin: req.admin,
    action: 'delete',
    entity: 'submission',
    entityId: String(id),
    ip: req.ip,
  })
  res.json(result)
}))

/* ---------------- 楼体相册 ---------------- */
const ALBUM_DIR = ALBUM_DIR_
// 待审核投稿照片的存放目录（与 routes/public.js 一致）
const SUB_DIR = SUBMISSIONS_DIR

function albumFolderName(folderId) {
  return folderId ? `f${folderId}` : 'loose'
}

/**
 * 入库一张照片 —— 管理员上传和投稿审核走的是同一个函数。
 * 统一负责：大小校验 / 主图落盘 / 缩略图落盘 / 写 album_photos。
 * 返回 createAlbumPhoto 的记录。
 */
async function storeAlbumPhoto({ folderId = null, buildingId = '', title = '', caption = '', dataUrl, thumbDataUrl = '', width = 0, height = 0, origBytes = 0, source = 'admin' }) {
  const size = pickImageSize(dataUrl)
  const sizeLimit = 4 * 1024 * 1024
  if (size.bytes > sizeLimit) {
    throw new ApiError(413, `图片太大（${(size.bytes / 1024 / 1024).toFixed(1)}MB），请压缩到 1MB 以内`)
  }
  const folderKey = albumFolderName(folderId)
  const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const main = saveDataUrl(dataUrl, ALBUM_DIR, folderKey, baseName)

  let thumbPath = ''
  // 有前端压好的缩略图就用它；否则大图自动再存一份当缩略图
  const thumbSource = thumbDataUrl || (size.bytes > 220 * 1024 ? dataUrl : '')
  if (thumbSource) {
    try {
      thumbPath = saveDataUrl(thumbSource, ALBUM_DIR, `${folderKey}/thumbs`, baseName).filePath
    } catch (err) {
      console.warn('[album] 缩略图写入失败:', err.message)
      thumbPath = ''
    }
  }

  return createAlbumPhoto({
    folderId: folderId ?? null,
    buildingId: buildingId || null,
    title: String(title || '').slice(0, 120),
    caption: String(caption || '').slice(0, 500),
    filePath: main.filePath,
    thumbPath,
    width: width || main.width || 0,
    height: height || main.height || 0,
    sizeBytes: main.bytes,
    origBytes: origBytes || size.bytes,
    source,
    sortOrder: Date.now() % 100000,
  })
}

/** 磁盘文件 → dataURL（投稿照片入库时复用管理员上传的同一套落盘逻辑） */
const MIME_BY_EXT = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif' }
function fileToDataUrl(absPath) {
  if (!fs.existsSync(absPath)) return ''
  const ext = path.extname(absPath).toLowerCase()
  const mime = MIME_BY_EXT[ext] || 'image/jpeg'
  return `data:${mime};base64,${fs.readFileSync(absPath).toString('base64')}`
}

router.get('/album/folders', wrap(async (req, res) => {
  res.json({ items: await listAlbumFolders({ withDeleted: req.query.deleted === '1' }) })
}))

router.post('/album/folders', wrap(async (req, res) => {
  const payload = albumFolderSchema.parse(req.body)
  const item = await createAlbumFolder(payload)
  await logAudit({ admin: req.admin, action: 'create', entity: 'album_folder', entityId: String(item.id), detail: { name: item.name }, ip: req.ip })
  res.json({ item })
}))

router.put('/album/folders/:id', wrap(async (req, res) => {
  const payload = albumFolderUpdateSchema.parse(req.body)
  const item = await updateAlbumFolder(Number(req.params.id), payload)
  await logAudit({ admin: req.admin, action: 'update', entity: 'album_folder', entityId: String(item.id), detail: { name: item.name }, ip: req.ip })
  res.json({ item })
}))

router.delete('/album/folders/:id', wrap(async (req, res) => {
  const withPhotos = req.query.withPhotos === '1'
  const result = await deleteAlbumFolder(Number(req.params.id), { withPhotos })
  for (const p of result.photos || []) {
    removeFile(ALBUM_DIR, p.file_path)
    removeFile(ALBUM_DIR, p.thumb_path)
  }
  await logAudit({ admin: req.admin, action: 'delete', entity: 'album_folder', entityId: req.params.id, detail: { withPhotos }, ip: req.ip })
  res.json({ ok: true, removedPhotos: result.removedPhotos })
}))

router.get('/album/photos', wrap(async (req, res) => {
  const items = await listAlbumPhotos({
    folderId: req.query.folderId,
    buildingId: req.query.buildingId || '',
    limit: req.query.limit,
  })
  res.json({ items, stats: await getAlbumStats() })
}))

/** 给每栋建筑补一个同名文件夹（幂等；已有绑定的跳过） */
router.post('/album/folders/sync-buildings', wrap(async (req, res) => {
  const created = await syncAlbumFoldersForBuildings()
  await logAudit({ admin: req.admin, action: 'create', entity: 'album_folder', entityId: 'sync', detail: { created: created.length }, ip: req.ip })
  res.json({ created: created.length, items: created })
}))

/** 照片排序：传当前文件夹下按新顺序排好的 id 数组 */
router.post('/album/photos/reorder', wrap(async (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0) : []
  if (!ids.length) throw new ApiError(400, '缺少照片 id 列表')
  const folderId = req.body?.folderId ? Number(req.body.folderId) : null
  await reorderAlbumPhotos(folderId, ids)
  await logAudit({ admin: req.admin, action: 'update', entity: 'album_photo', entityId: 'reorder', detail: { folderId, count: ids.length }, ip: req.ip })
  res.json({ ok: true, count: ids.length })
}))

/**
 * 把磁盘上存在、但数据库里没有记录的照片补登记进来。
 * 场景：把整个文件夹拷到另一台机器 / 从服务器把照片拷回本地，
 * 数据库和 public/uploads 不是同一时刻的，就会「看得到文件、网页里看不到」。
 * 传 dryRun=true 只报告不写库。
 */
router.post('/album/photos/scan', wrap(async (req, res) => {
  const dryRun = req.body?.dryRun === true
  const known = new Set((await q('SELECT file_path, thumb_path FROM album_photos')).flatMap((r) => [r.file_path, r.thumb_path]).filter(Boolean))

  const added = []
  const skipped = []
  const walk = async (absDir, relDir) => {
    if (!fs.existsSync(absDir)) return
    for (const ent of fs.readdirSync(absDir, { withFileTypes: true })) {
      if (ent.name === 'thumbs') continue
      const abs = path.join(absDir, ent.name)
      const rel = relDir ? `${relDir}/${ent.name}` : ent.name
      if (ent.isDirectory()) { await walk(abs, rel); continue }
      if (!/\.(jpe?g|png|webp|gif)$/i.test(ent.name)) continue
      if (known.has(rel)) { skipped.push(rel); continue }
      // f<id> 目录 → folderId
      const m = rel.match(/^f(\d+)\//)
      const folderId = m ? Number(m[1]) : null
      const thumbRel = rel.replace(/^([^/]+)\//, '$1/thumbs/')
      const thumbAbs = path.join(ALBUM_DIR, thumbRel)
      const entry = {
        filePath: rel,
        thumbPath: fs.existsSync(thumbAbs) ? thumbRel : '',
        folderId,
        sizeBytes: fs.statSync(abs).size,
      }
      added.push(entry)
      if (!dryRun) {
        const folder = folderId ? await one('SELECT building_id FROM album_folders WHERE id = ?', [folderId]) : null
        await createAlbumPhoto({
          folderId,
          buildingId: folder?.building_id || '',
          title: ent.name.replace(/\.[^.]+$/, ''),
          caption: '',
          filePath: rel,
          thumbPath: entry.thumbPath,
          source: 'admin',
        })
      }
    }
  }
  await walk(ALBUM_DIR, '')
  await logAudit({ admin: req.admin, action: 'create', entity: 'album_photo', entityId: 'scan', detail: { added: added.length, dryRun }, ip: req.ip })
  res.json({ ok: true, dryRun, added: added.length, skipped: skipped.length, items: added.slice(0, 50) })
}))

router.post('/album/photos', wrap(async (req, res) => {
  const payload = albumPhotoSchema.parse(req.body)
  const item = await storeAlbumPhoto({
    folderId: payload.folderId ?? null,
    buildingId: payload.buildingId || '',
    title: payload.title,
    caption: payload.caption,
    dataUrl: payload.dataUrl,
    thumbDataUrl: payload.thumbDataUrl || '',
    width: payload.width || 0,
    height: payload.height || 0,
    origBytes: payload.origBytes || 0,
    source: payload.source,
  })
  await logAudit({ admin: req.admin, action: 'create', entity: 'album_photo', entityId: String(item.id), detail: { folder: albumFolderName(payload.folderId), bytes: item.sizeBytes }, ip: req.ip })
  res.json({ item })
}))

router.put('/album/photos/:id', wrap(async (req, res) => {
  const payload = albumPhotoUpdateSchema.parse(req.body)
  const item = await updateAlbumPhoto(Number(req.params.id), payload)
  await logAudit({ admin: req.admin, action: 'update', entity: 'album_photo', entityId: String(item.id), ip: req.ip })
  res.json({ item })
}))

router.delete('/album/photos/:id', wrap(async (req, res) => {
  const result = await deleteAlbumPhoto(Number(req.params.id))
  removeFile(ALBUM_DIR, result.filePath)
  removeFile(ALBUM_DIR, result.thumbPath)
  await logAudit({ admin: req.admin, action: 'delete', entity: 'album_photo', entityId: req.params.id, ip: req.ip })
  res.json({ ok: true })
}))

export default router
