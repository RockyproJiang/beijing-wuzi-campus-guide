import fs from 'node:fs'
import path from 'node:path'
import { cq, json, one, q, tx } from './db.js'
import { ApiError, asJson } from './utils.js'
import { ROOT } from './paths.js'

/* ------------------------------------------------------------------ */
/* 行映射                                                             */
/* ------------------------------------------------------------------ */

function buildingRow(r, admin = false) {
  const item = {
    id: r.id,
    name: r.name,
    sub: r.sub || '',
    aliases: asJson(r.aliases, []),
    intro: r.intro || '',
    icon: r.icon,
    bgColor: r.bg_color,
    color: r.color,
    categoryId: r.category_id,
    mapX: r.map_x == null ? null : Number(r.map_x),
    mapY: r.map_y == null ? null : Number(r.map_y),
    mapHidden: Boolean(r.map_hidden),
    group: r.group_name || undefined,
    info: asJson(r.info, []),
    equipment: asJson(r.equipment, []),
    floors: asJson(r.floors, []),
    schedule: r.schedule || undefined,
    contacts: asJson(r.contacts, undefined),
    surroundings: asJson(r.surroundings, undefined),
    timetable: asJson(r.timetable, undefined),
    modelObjects: asJson(r.model_objects, []),
    pin: r.pin_x == null || r.pin_z == null ? null : { x: Number(r.pin_x), z: Number(r.pin_z) },
    regions: asJson(r.regions, []),
    surfacePoints: asJson(r.surface_points, []),
  }
  if (admin) {
    item.sortOrder = r.sort_order
    item.deletedAt = r.deleted_at
    item.categoryName = r.category_name || undefined
    item.createdAt = r.created_at
    item.updatedAt = r.updated_at
  }
  return item
}

function categoryRow(r, admin = false) {
  const item = {
    id: r.id,
    name: r.name,
    icon: r.icon,
    bgColor: r.bg_color,
    color: r.color,
  }
  if (admin) {
    item.sortOrder = r.sort_order
    item.deletedAt = r.deleted_at
    item.buildingCount = r.building_count == null ? undefined : Number(r.building_count)
    item.updatedAt = r.updated_at
  }
  return item
}

function publicBuilding(b) {
  const { sortOrder, deletedAt, categoryName, createdAt, updatedAt, ...rest } = b
  return rest
}

/* ------------------------------------------------------------------ */
/* 公共数据                                                            */
/* ------------------------------------------------------------------ */

export async function getSiteData() {
  const categories = await q(
    'SELECT * FROM categories WHERE deleted_at IS NULL ORDER BY sort_order ASC, id ASC'
  )
  const buildings = await q(
    'SELECT * FROM buildings WHERE deleted_at IS NULL ORDER BY sort_order ASC, id ASC'
  )

  const byCategory = new Map(categories.map((c) => [c.id, []]))
  for (const row of buildings) {
    const list = byCategory.get(row.category_id)
    if (list) list.push(publicBuilding(buildingRow(row)))
  }

  const calendarMeta = await one('SELECT title FROM calendar_meta WHERE id = 1')
  const calendarItems = await q(
    'SELECT event, date_label FROM calendar_items ORDER BY sort_order ASC, id ASC'
  )
  const tips = (await q('SELECT content FROM tips ORDER BY sort_order ASC, id ASC')).map((r) => r.content)
  const aliases = (await q(
    'SELECT keyword, building_ids FROM search_aliases ORDER BY sort_order ASC, id ASC'
  )).map((r) => ({ keyword: r.keyword, ids: asJson(r.building_ids, []) }))
  const digitalCampus = await getDigitalCampus()
  const schoolProfile = await getSchoolProfile()

  return {
    categories: categories.map((c) => ({
      ...categoryRow(c),
      buildings: byCategory.get(c.id) || [],
    })),
    digitalCampus: digitalCampus || {},
    schoolProfile: schoolProfile || null,
    calendar: {
      title: calendarMeta?.title || '',
      items: calendarItems.map((r) => ({ event: r.event, date: r.date_label })),
    },
    tips,
    aliases,
  }
}

export async function getDigitalCampus() {
  const row = await one('SELECT v FROM settings WHERE k = ?', ['digital_campus'])
  return asJson(row?.v, null)
}

/** 学校信息（「关于」页展示，后台可编辑）：settings.key = school_profile */
export async function getSchoolProfile() {
  const row = await one('SELECT v FROM settings WHERE k = ?', ['school_profile'])
  return asJson(row?.v, null)
}

export async function saveSchoolProfile(data) {
  await q(
    'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
    ['school_profile', json(data)]
  )
  return data
}

/** 后台「一键配色」预设：存在 settings 表里，key = color_presets */
export async function getColorPresets() {
  const row = await one('SELECT v FROM settings WHERE k = ?', ['color_presets'])
  return asJson(row?.v, [])
}

export async function saveColorPresets(list) {
  await q(
    'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
    ['color_presets', json(list || [])]
  )
  return list || []
}

export async function saveDigitalCampus(data) {
  await q(
    'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
    ['digital_campus', json(data)]
  )
  return data
}

export async function getModelTransform() {
  const row = await one('SELECT v FROM settings WHERE k = ?', ['model_transform'])
  return asJson(row?.v, null)
}

/* ------------------------------------------------------------------ */
/* 分类                                                                */
/* ------------------------------------------------------------------ */

export async function listCategories({ includeDeleted = false } = {}) {
  const where = includeDeleted ? '' : 'WHERE c.deleted_at IS NULL'
  const rows = await q(
    `SELECT c.*, (
        SELECT COUNT(*) FROM buildings b
        WHERE b.category_id = c.id AND b.deleted_at IS NULL
      ) AS building_count
     FROM categories c
     ${where}
     ORDER BY c.sort_order ASC, c.id ASC`
  )
  return rows.map((r) => categoryRow(r, true))
}

export async function createCategory(input) {
  const exists = await one('SELECT id, deleted_at FROM categories WHERE id = ?', [input.id])
  if (exists) {
    throw new ApiError(409, exists.deleted_at ? '该分类在回收站中，请先恢复或彻底删除' : '分类 ID 已存在', 'DUPLICATE')
  }
  const next = await one('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM categories')
  await q(
    `INSERT INTO categories (id, name, icon, bg_color, color, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [input.id, input.name, input.icon, input.bgColor, input.color, next.n]
  )
  const row = await one('SELECT * FROM categories WHERE id = ?', [input.id])
  return categoryRow(row, true)
}

export async function updateCategory(id, input) {
  const existing = await one('SELECT * FROM categories WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '分类不存在')
  if (existing.deleted_at) throw new ApiError(409, '分类在回收站中，请先恢复')
  await q(
    'UPDATE categories SET name = ?, icon = ?, bg_color = ?, color = ? WHERE id = ?',
    [input.name, input.icon, input.bgColor, input.color, id]
  )
  const row = await one(
    `SELECT c.*, (SELECT COUNT(*) FROM buildings b WHERE b.category_id = c.id AND b.deleted_at IS NULL) AS building_count
     FROM categories c WHERE c.id = ?`,
    [id]
  )
  return categoryRow(row, true)
}

export async function deleteCategory(id) {
  const existing = await one('SELECT * FROM categories WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '分类不存在')
  if (existing.deleted_at) return { ok: true }
  const count = await one(
    'SELECT COUNT(*) AS n FROM buildings WHERE category_id = ? AND deleted_at IS NULL',
    [id]
  )
  if (Number(count.n) > 0) {
    throw new ApiError(409, `该分类下还有 ${count.n} 个建筑，请先移动或删除这些建筑`, 'NOT_EMPTY')
  }
  await q('UPDATE categories SET deleted_at = NOW() WHERE id = ?', [id])
  return { ok: true }
}

export async function restoreCategory(id) {
  const existing = await one('SELECT * FROM categories WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '分类不存在')
  await q('UPDATE categories SET deleted_at = NULL WHERE id = ?', [id])
  return { ok: true }
}

export async function purgeCategory(id) {
  const existing = await one('SELECT * FROM categories WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '分类不存在')
  if (!existing.deleted_at) throw new ApiError(409, '请先删除该分类再彻底删除', 'NOT_DELETED')
  const count = await one('SELECT COUNT(*) AS n FROM buildings WHERE category_id = ?', [id])
  if (Number(count.n) > 0) {
    throw new ApiError(409, '该分类下还有建筑（含回收站中的），请先彻底删除这些建筑', 'NOT_EMPTY')
  }
  await q('DELETE FROM categories WHERE id = ?', [id])
  return { ok: true }
}

export async function reorderCategories(ids) {
  await tx(async (conn) => {
    for (let i = 0; i < ids.length; i++) {
      await cq(conn, 'UPDATE categories SET sort_order = ? WHERE id = ?', [i, ids[i]])
    }
  })
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* 建筑                                                                */
/* ------------------------------------------------------------------ */

function buildingInsertValues(input, categoryId, sortOrder) {
  return [
    input.name,
    input.sub || '',
    json(input.aliases || []),
    input.intro || '',
    input.icon,
    input.bgColor,
    input.color,
    input.mapX ?? null,
    input.mapY ?? null,
    input.mapHidden ? 1 : 0,
    input.group || null,
    sortOrder,
    json(input.info || []),
    json(input.equipment || []),
    json(input.floors || []),
    input.schedule || null,
    json(input.contacts ?? null),
    json(input.surroundings ?? null),
    json(input.timetable ?? null),
    json(input.modelObjects || []),
    input.pin?.x ?? null,
    input.pin?.z ?? null,
    json(input.regions || []),
    json(input.surfacePoints || []),
    categoryId,
  ]
}

const BUILDING_COLUMNS = `name, sub, aliases, intro, icon, bg_color, color, map_x, map_y, map_hidden, group_name,
  sort_order, info, equipment, floors, schedule, contacts, surroundings, timetable, model_objects,
  pin_x, pin_z, regions, surface_points, category_id`

async function nextBuildingId(conn) {
  const rows = await cq(conn, "SELECT id FROM buildings WHERE id REGEXP '^b[0-9]+$'")
  let max = 0
  for (const row of rows) {
    const n = Number.parseInt(String(row.id).slice(1), 10)
    if (Number.isFinite(n)) max = Math.max(max, n)
  }
  let candidate = `b${max + 1}`
  let guard = 0
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const hit = await cq(conn, 'SELECT id FROM buildings WHERE id = ?', [candidate])
    if (!hit.length) return candidate
    candidate = `b${max + 2 + guard++}`
  }
}

export async function listBuildings({ categoryId = '', search = '', includeDeleted = false, limit = 200, offset = 0 } = {}) {
  const where = []
  const params = []
  if (!includeDeleted) where.push('b.deleted_at IS NULL')
  if (categoryId) {
    where.push('b.category_id = ?')
    params.push(categoryId)
  }
  if (search) {
    where.push('(b.name LIKE ? OR b.sub LIKE ? OR b.id LIKE ?)')
    const like = `%${search}%`
    params.push(like, like, like)
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const totalRow = await one(
    `SELECT COUNT(*) AS n FROM buildings b ${whereSql}`,
    params
  )
  const rows = await q(
    `SELECT b.*, c.name AS category_name
     FROM buildings b
     LEFT JOIN categories c ON c.id = b.category_id
     ${whereSql}
     ORDER BY c.sort_order ASC, b.sort_order ASC, b.id ASC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  )
  return {
    total: Number(totalRow.n),
    items: rows.map((r) => buildingRow(r, true)),
  }
}

export async function getBuilding(id, admin = true) {
  const row = await one(
    `SELECT b.*, c.name AS category_name
     FROM buildings b LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.id = ?`,
    [id]
  )
  return row ? buildingRow(row, admin) : null
}

export async function createBuilding(input) {
  const category = await one('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [input.categoryId])
  if (!category) throw new ApiError(400, '所属分类不存在')
  const id = await tx(async (conn) => {
    const newId = await nextBuildingId(conn)
    const sort = await cq(
      conn,
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM buildings WHERE category_id = ?',
      [input.categoryId]
    )
    await cq(
      conn,
      `INSERT INTO buildings (id, ${BUILDING_COLUMNS}) VALUES (?, ${Array(25).fill('?').join(', ')})`,
      [newId, ...buildingInsertValues(input, input.categoryId, sort[0].n)]
    )
    return newId
  })
  return getBuilding(id)
}

export async function updateBuilding(id, input) {
  const existing = await one('SELECT * FROM buildings WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '建筑不存在')
  if (existing.deleted_at) throw new ApiError(409, '建筑在回收站中，请先恢复')
  const category = await one('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [input.categoryId])
  if (!category) throw new ApiError(400, '所属分类不存在')

  let sortOrder = existing.sort_order
  if (input.categoryId !== existing.category_id) {
    const max = await one(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM buildings WHERE category_id = ? AND deleted_at IS NULL',
      [input.categoryId]
    )
    sortOrder = max.n
  }

  await q(
    `UPDATE buildings SET
       name = ?, sub = ?, aliases = ?, intro = ?, icon = ?, bg_color = ?, color = ?, map_x = ?, map_y = ?,
       map_hidden = ?, group_name = ?, sort_order = ?, info = ?, equipment = ?, floors = ?,
       schedule = ?, contacts = ?, surroundings = ?, timetable = ?, model_objects = ?,
       pin_x = ?, pin_z = ?, regions = ?, surface_points = ?, category_id = ?
     WHERE id = ?`,
    [...buildingInsertValues(input, input.categoryId, sortOrder), id]
  )
  return getBuilding(id)
}

export async function deleteBuilding(id) {
  const existing = await one('SELECT * FROM buildings WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '建筑不存在')
  await q('UPDATE buildings SET deleted_at = NOW() WHERE id = ?', [id])
  return { ok: true }
}

export async function restoreBuilding(id) {
  const existing = await one('SELECT * FROM buildings WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '建筑不存在')
  const category = await one('SELECT * FROM categories WHERE id = ? AND deleted_at IS NULL', [existing.category_id])
  if (!category) throw new ApiError(409, '所属分类还在回收站中，请先恢复分类')
  await q('UPDATE buildings SET deleted_at = NULL WHERE id = ?', [id])
  return { ok: true }
}

export async function purgeBuilding(id) {
  const existing = await one('SELECT * FROM buildings WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '建筑不存在')
  if (!existing.deleted_at) throw new ApiError(409, '请先删除该建筑再彻底删除', 'NOT_DELETED')
  await q('DELETE FROM buildings WHERE id = ?', [id])
  return { ok: true }
}

export async function reorderBuildings(categoryId, ids) {
  await tx(async (conn) => {
    for (let i = 0; i < ids.length; i++) {
      await cq(
        conn,
        'UPDATE buildings SET sort_order = ? WHERE id = ? AND category_id = ?',
        [i, ids[i], categoryId]
      )
    }
  })
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* 回收站                                                             */
/* ------------------------------------------------------------------ */

export async function listTrash() {
  const categories = (await q(
    'SELECT * FROM categories WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC'
  )).map((r) => categoryRow(r, true))
  const buildings = (await q(
    `SELECT b.*, c.name AS category_name
     FROM buildings b LEFT JOIN categories c ON c.id = b.category_id
     WHERE b.deleted_at IS NOT NULL
     ORDER BY b.deleted_at DESC`
  )).map((r) => buildingRow(r, true))
  return { categories, buildings }
}

/* ------------------------------------------------------------------ */
/* 校历                                                                */
/* ------------------------------------------------------------------ */

export async function getCalendar() {
  const meta = await one('SELECT title FROM calendar_meta WHERE id = 1')
  const items = await q('SELECT event, date_label FROM calendar_items ORDER BY sort_order ASC, id ASC')
  return { title: meta?.title || '', items: items.map((r) => ({ event: r.event, date: r.date_label })) }
}

export async function saveCalendar(input) {
  await tx(async (conn) => {
    await cq(conn, 'INSERT INTO calendar_meta (id, title) VALUES (1, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)', [input.title || ''])
    await cq(conn, 'DELETE FROM calendar_items')
    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i]
      await cq(
        conn,
        'INSERT INTO calendar_items (event, date_label, sort_order) VALUES (?, ?, ?)',
        [item.event, item.date || '', i]
      )
    }
  })
  return getCalendar()
}

/* ------------------------------------------------------------------ */
/* 提示                                                                */
/* ------------------------------------------------------------------ */

export async function listTips() {
  return (await q('SELECT id, content, sort_order FROM tips ORDER BY sort_order ASC, id ASC')).map((r) => ({
    id: r.id,
    content: r.content,
    sortOrder: r.sort_order,
  }))
}

export async function createTip(content) {
  const next = await one('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM tips')
  const result = await q('INSERT INTO tips (content, sort_order) VALUES (?, ?)', [content, next.n])
  return { id: result.insertId, content, sortOrder: next.n }
}

export async function updateTip(id, content) {
  const existing = await one('SELECT id FROM tips WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '提示不存在')
  await q('UPDATE tips SET content = ? WHERE id = ?', [content, id])
  return { id: Number(id), content }
}

export async function deleteTip(id) {
  await q('DELETE FROM tips WHERE id = ?', [id])
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* 搜索别名                                                            */
/* ------------------------------------------------------------------ */

export async function listAliases() {
  return (await q('SELECT id, keyword, building_ids FROM search_aliases ORDER BY sort_order ASC, id ASC')).map((r) => ({
    id: r.id,
    keyword: r.keyword,
    ids: asJson(r.building_ids, []),
  }))
}

export async function createAlias(input) {
  const exists = await one('SELECT id FROM search_aliases WHERE keyword = ?', [input.keyword])
  if (exists) throw new ApiError(409, '该关键词已存在', 'DUPLICATE')
  const next = await one('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM search_aliases')
  const result = await q(
    'INSERT INTO search_aliases (keyword, building_ids, sort_order) VALUES (?, ?, ?)',
    [input.keyword, json(input.ids || []), next.n]
  )
  return { id: result.insertId, keyword: input.keyword, ids: input.ids || [] }
}

export async function updateAlias(id, input) {
  const existing = await one('SELECT id FROM search_aliases WHERE id = ?', [id])
  if (!existing) throw new ApiError(404, '关键词不存在')
  const duplicate = await one('SELECT id FROM search_aliases WHERE keyword = ? AND id <> ?', [input.keyword, id])
  if (duplicate) throw new ApiError(409, '该关键词已存在', 'DUPLICATE')
  await q('UPDATE search_aliases SET keyword = ?, building_ids = ? WHERE id = ?', [
    input.keyword,
    json(input.ids || []),
    id,
  ])
  return { id: Number(id), keyword: input.keyword, ids: input.ids || [] }
}

export async function deleteAlias(id) {
  await q('DELETE FROM search_aliases WHERE id = ?', [id])
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* 审计                                                                */
/* ------------------------------------------------------------------ */

export async function logAudit({ admin, action, entity = '', entityId = '', detail = null, ip = '' }) {
  try {
    await q(
      `INSERT INTO audit_logs (admin_id, username, action, entity, entity_id, detail, ip)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [admin?.id ?? null, admin?.username ?? '', action, entity, String(entityId || ''), json(detail), ip]
    )
  } catch (error) {
    console.error('[audit] 写入失败:', error.message)
  }
}

export async function listAudit({ limit = 30, offset = 0 } = {}) {
  const rows = await q(
    `SELECT id, username, action, entity, entity_id, detail, ip, created_at
     FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?`,
    [Number(limit), Number(offset)]
  )
  return rows.map((r) => ({
    id: r.id,
    username: r.username,
    action: r.action,
    entity: r.entity,
    entityId: r.entity_id,
    detail: asJson(r.detail, null),
    ip: r.ip,
    createdAt: r.created_at,
  }))
}

/* ------------------------------------------------------------------ */
/* 概览                                                                */
/* ------------------------------------------------------------------ */

export async function getOverview() {
  const [categories, buildings, hidden, withModel, tips, aliases, trash, lastUpdate] = await Promise.all([
    one('SELECT COUNT(*) AS n FROM categories WHERE deleted_at IS NULL'),
    one('SELECT COUNT(*) AS n FROM buildings WHERE deleted_at IS NULL'),
    one('SELECT COUNT(*) AS n FROM buildings WHERE deleted_at IS NULL AND map_hidden = 1'),
    one("SELECT COUNT(*) AS n FROM buildings WHERE deleted_at IS NULL AND JSON_LENGTH(model_objects) > 0"),
    one('SELECT COUNT(*) AS n FROM tips'),
    one('SELECT COUNT(*) AS n FROM search_aliases'),
    one('SELECT ((SELECT COUNT(*) FROM categories WHERE deleted_at IS NOT NULL) + (SELECT COUNT(*) FROM buildings WHERE deleted_at IS NOT NULL)) AS n'),
    one('SELECT MAX(updated_at) AS t FROM buildings'),
  ])
  return {
    categories: Number(categories.n),
    buildings: Number(buildings.n),
    hidden: Number(hidden.n),
    withModel: Number(withModel.n),
    tips: Number(tips.n),
    aliases: Number(aliases.n),
    trash: Number(trash.n),
    lastUpdate: lastUpdate?.t || null,
  }
}

/* ------------------------------------------------------------------ */
/* 导出 / 导入                                                         */
/* ------------------------------------------------------------------ */

export async function exportData() {
  const data = await getSiteData()
  const categories = data.categories.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    bgColor: c.bgColor,
    color: c.color,
    buildings: c.buildings.map((b) => {
      const { categoryId, ...rest } = b
      return rest
    }),
  }))
  return {
    categories,
    digitalCampus: data.digitalCampus || {},
    schoolProfile: data.schoolProfile || null,
    calendar: data.calendar,
    tips: data.tips,
    aliases: data.aliases,
  }
}

async function backupCurrent() {
  try {
    const dir = path.join(ROOT, 'server/backups')
    fs.mkdirSync(dir, { recursive: true })
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    const data = await exportData()
    const file = path.join(dir, `import-${stamp}.json`)
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    return file
  } catch (error) {
    console.error('[backup] 备份失败:', error.message)
    return null
  }
}

async function insertImportedBuilding(conn, b, categoryId, sortOrder, mode) {
  const values = buildingInsertValues(
    {
      ...b,
      mapX: b.mapX ?? null,
      mapY: b.mapY ?? null,
      mapHidden: Boolean(b.mapHidden),
      pin: b.pin || null,
    },
    categoryId,
    sortOrder
  )
  if (mode === 'replace') {
    await cq(
      conn,
      `INSERT INTO buildings (id, ${BUILDING_COLUMNS}) VALUES (?, ${Array(25).fill('?').join(', ')})`,
      [b.id, ...values]
    )
  } else {
    await cq(
      conn,
      `INSERT INTO buildings (id, ${BUILDING_COLUMNS}) VALUES (?, ${Array(25).fill('?').join(', ')})
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), sub = VALUES(sub), intro = VALUES(intro), icon = VALUES(icon),
         bg_color = VALUES(bg_color), color = VALUES(color), map_x = VALUES(map_x), map_y = VALUES(map_y),
         map_hidden = VALUES(map_hidden), group_name = VALUES(group_name), sort_order = VALUES(sort_order),
         info = VALUES(info), equipment = VALUES(equipment), floors = VALUES(floors), schedule = VALUES(schedule),
         contacts = VALUES(contacts), surroundings = VALUES(surroundings), timetable = VALUES(timetable),
         model_objects = VALUES(model_objects), pin_x = VALUES(pin_x), pin_z = VALUES(pin_z),
         regions = VALUES(regions), surface_points = VALUES(surface_points),
         category_id = VALUES(category_id), deleted_at = NULL`,
      [b.id, ...values]
    )
  }
}

export async function importData(payload, mode = 'replace') {
  const backup = await backupCurrent()
  const counts = { categories: 0, buildings: 0, tips: 0, aliases: 0, calendar: 0, digitalCampus: 0 }

  await tx(async (conn) => {
    if (mode === 'replace') {
      await cq(conn, 'DELETE FROM buildings')
      await cq(conn, 'DELETE FROM categories')
      await cq(conn, 'DELETE FROM calendar_items')
      await cq(conn, 'DELETE FROM tips')
      await cq(conn, 'DELETE FROM search_aliases')
    }

    for (let ci = 0; ci < payload.categories.length; ci++) {
      const category = payload.categories[ci]
      if (mode === 'replace') {
        await cq(
          conn,
          'INSERT INTO categories (id, name, icon, bg_color, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          [category.id, category.name, category.icon, category.bgColor, category.color, ci]
        )
      } else {
        await cq(
          conn,
          `INSERT INTO categories (id, name, icon, bg_color, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE name = VALUES(name), icon = VALUES(icon), bg_color = VALUES(bg_color),
             color = VALUES(color), sort_order = VALUES(sort_order), deleted_at = NULL`,
          [category.id, category.name, category.icon, category.bgColor, category.color, ci]
        )
      }
      counts.categories += 1

      const buildings = category.buildings || []
      for (let bi = 0; bi < buildings.length; bi++) {
        await insertImportedBuilding(conn, buildings[bi], category.id, bi, mode)
        counts.buildings += 1
      }
    }

    if (payload.calendar) {
      await cq(conn, 'DELETE FROM calendar_items')
      await cq(
        conn,
        'INSERT INTO calendar_meta (id, title) VALUES (1, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)',
        [payload.calendar.title || '']
      )
      for (let i = 0; i < payload.calendar.items.length; i++) {
        const item = payload.calendar.items[i]
        await cq(
          conn,
          'INSERT INTO calendar_items (event, date_label, sort_order) VALUES (?, ?, ?)',
          [item.event, item.date || '', i]
        )
        counts.calendar += 1
      }
    }

    if (payload.digitalCampus) {
      await cq(
        conn,
        'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
        ['digital_campus', json(payload.digitalCampus)]
      )
      counts.digitalCampus = 1
    }

    if (payload.tips) {
      if (mode === 'replace') {
        for (let i = 0; i < payload.tips.length; i++) {
          await cq(conn, 'INSERT INTO tips (content, sort_order) VALUES (?, ?)', [payload.tips[i], i])
          counts.tips += 1
        }
      } else {
        let offset = Number((await cq(conn, 'SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM tips'))[0].n)
        for (const content of payload.tips) {
          const hit = await cq(conn, 'SELECT id FROM tips WHERE content = ?', [content])
          if (hit.length) continue
          await cq(conn, 'INSERT INTO tips (content, sort_order) VALUES (?, ?)', [content, offset++])
          counts.tips += 1
        }
      }
    }

    if (payload.aliases) {
      const seenKeywords = new Set()
      for (let i = 0; i < payload.aliases.length; i++) {
        const alias = payload.aliases[i]
        const normalized = String(alias.keyword || '').normalize('NFKC').toLowerCase()
        if (!normalized || seenKeywords.has(normalized)) continue
        seenKeywords.add(normalized)
        if (mode === 'replace') {
          await cq(
            conn,
            'INSERT INTO search_aliases (keyword, building_ids, sort_order) VALUES (?, ?, ?)',
            [alias.keyword, json(alias.ids || []), i]
          )
        } else {
          await cq(
            conn,
            `INSERT INTO search_aliases (keyword, building_ids, sort_order) VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE building_ids = VALUES(building_ids)`,
            [alias.keyword, json(alias.ids || []), i]
          )
        }
        counts.aliases += 1
      }
    }
  })

  return { mode, backup, counts }
}

/* ------------------------------------------------------------------ */
/* 位置投稿                                                         */
/* ------------------------------------------------------------------ */

function mysqlDateTime(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:00`
}

function submissionRow(r) {
  return {
    id: Number(r.id),
    buildingId: r.building_id || '',
    buildingName: r.building_name || '',
    placeName: r.place_name || '',
    pin: r.pin_x == null || r.pin_z == null ? null : { x: Number(r.pin_x), z: Number(r.pin_z) },
    type: r.type,
    content: r.content,
    occurredAt: r.occurred_at,
    contact: r.contact || '',
    authorName: r.author_name || '',
    photo: r.photo_path
      ? {
          path: r.photo_path,
          thumb: r.photo_thumb || '',
          width: Number(r.photo_width) || 0,
          height: Number(r.photo_height) || 0,
          bytes: Number(r.photo_bytes) || 0,
        }
      : null,
    publishedPhotoId: r.published_photo_id ? Number(r.published_photo_id) : null,
    status: r.status,
    adminNote: r.admin_note || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export async function createSubmission(input) {
  let buildingName = input.buildingName || ''
  if (input.buildingId) {
    const b = await one('SELECT name FROM buildings WHERE id = ? AND deleted_at IS NULL', [input.buildingId])
    if (b) buildingName = b.name
  }
  const result = await q(
    `INSERT INTO location_submissions
      (building_id, building_name, place_name, pin_x, pin_z, type, content, occurred_at, contact,
       author_name, photo_path, photo_thumb, photo_width, photo_height, photo_bytes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.buildingId || null,
      buildingName,
      input.placeName || '',
      input.pin?.x ?? null,
      input.pin?.z ?? null,
      input.type || 'correction',
      input.content || '',
      mysqlDateTime(input.occurredAt),
      input.contact || '',
      input.authorName || '',
      input.photo?.path || '',
      input.photo?.thumb || '',
      Number(input.photo?.width) || 0,
      Number(input.photo?.height) || 0,
      Number(input.photo?.bytes) || 0,
    ]
  )
  const row = await one('SELECT * FROM location_submissions WHERE id = ?', [result.insertId])
  return submissionRow(row)
}

export async function listSubmissions({ status = '' } = {}) {
  const rows = status
    ? await q('SELECT * FROM location_submissions WHERE status = ? ORDER BY created_at DESC, id DESC', [status])
    : await q('SELECT * FROM location_submissions ORDER BY created_at DESC, id DESC')
  return rows.map(submissionRow)
}

export async function updateSubmissionStatus(id, status, adminNote) {
  const row = await one('SELECT * FROM location_submissions WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '投稿不存在')
  if (adminNote === undefined) {
    await q('UPDATE location_submissions SET status = ? WHERE id = ?', [status, id])
  } else {
    await q('UPDATE location_submissions SET status = ?, admin_note = ? WHERE id = ?', [status, adminNote || '', id])
  }
  return submissionRow(await one('SELECT * FROM location_submissions WHERE id = ?', [id]))
}

/** 管理员直接修改投稿内容（建筑 / 地点 / 坐标 / 描述 / 联系方式）*/
export async function updateSubmission(id, input) {
  const row = await one('SELECT * FROM location_submissions WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '投稿不存在')
  let buildingName = input.buildingName ?? row.building_name ?? ''
  if (input.buildingId) {
    const b = await one('SELECT name FROM buildings WHERE id = ? AND deleted_at IS NULL', [input.buildingId])
    if (b) buildingName = b.name
  }
  await q(
    `UPDATE location_submissions SET
       building_id = ?, building_name = ?, place_name = ?, pin_x = ?, pin_z = ?,
       type = ?, content = ?, occurred_at = ?, contact = ?, author_name = ?,
       status = COALESCE(?, status), admin_note = ?
     WHERE id = ?`,
    [
      input.buildingId || null,
      buildingName,
      input.placeName ?? row.place_name ?? '',
      input.pin ? input.pin.x : (input.clearPin ? null : row.pin_x),
      input.pin ? input.pin.z : (input.clearPin ? null : row.pin_z),
      input.type || row.type,
      input.content ?? row.content,
      input.occurredAt !== undefined ? mysqlDateTime(input.occurredAt) : row.occurred_at,
      input.contact !== undefined ? input.contact : row.contact,
      input.authorName !== undefined ? input.authorName : (row.author_name || ''),
      input.status || null,
      input.adminNote !== undefined ? input.adminNote : (row.admin_note || ''),
      id,
    ]
  )
  return submissionRow(await one('SELECT * FROM location_submissions WHERE id = ?', [id]))
}

export async function deleteSubmission(id) {
  const row = await one('SELECT * FROM location_submissions WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '投稿不存在')
  await q('DELETE FROM location_submissions WHERE id = ?', [id])
  return { ok: true }
}

/* ------------------------------------------------------------------ */
/* 楼体相册                                                           */
/* ------------------------------------------------------------------ */

function folderRow(r) {
  return {
    id: Number(r.id),
    name: r.name,
    description: r.description || '',
    buildingId: r.building_id || '',
    sortOrder: Number(r.sort_order || 0),
    photoCount: r.photo_count == null ? undefined : Number(r.photo_count),
    deletedAt: r.deleted_at || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function photoRow(r) {
  return {
    id: Number(r.id),
    folderId: r.folder_id == null ? null : Number(r.folder_id),
    folderName: r.folder_name || '',
    buildingId: r.building_id || '',
    buildingName: r.building_name || '',
    title: r.title || '',
    caption: r.caption || '',
    filePath: r.file_path || '',
    thumbPath: r.thumb_path || '',
    width: Number(r.width || 0),
    height: Number(r.height || 0),
    sizeBytes: Number(r.size_bytes || 0),
    origBytes: Number(r.orig_bytes || 0),
    source: r.source || 'other',
    sortOrder: Number(r.sort_order || 0),
    deletedAt: r.deleted_at || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

const PHOTO_SELECT = `
  SELECT p.*, f.name AS folder_name, b.name AS building_name
    FROM album_photos p
    LEFT JOIN album_folders f ON f.id = p.folder_id
    LEFT JOIN buildings b ON b.id = p.building_id
`

export async function listAlbumFolders({ withDeleted = false } = {}) {
  const where = withDeleted ? '' : 'WHERE f.deleted_at IS NULL'
  const rows = await q(
    `SELECT f.*, (SELECT COUNT(*) FROM album_photos p WHERE p.folder_id = f.id AND p.deleted_at IS NULL) AS photo_count
       FROM album_folders f ${where}
      ORDER BY f.sort_order ASC, f.id ASC`
  )
  return rows.map(folderRow)
}

export async function createAlbumFolder(input) {
  const result = await q(
    'INSERT INTO album_folders (name, description, building_id, sort_order) VALUES (?, ?, ?, ?)',
    [input.name, input.description || '', input.buildingId || null, input.sortOrder ?? 0]
  )
  return folderRow(await one('SELECT * FROM album_folders WHERE id = ?', [result.insertId]))
}

export async function updateAlbumFolder(id, input) {
  const row = await one('SELECT * FROM album_folders WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '文件夹不存在')
  await q('UPDATE album_folders SET name = ?, description = ?, building_id = ?, sort_order = ? WHERE id = ?', [
    input.name ?? row.name,
    input.description ?? row.description,
    input.buildingId !== undefined ? (input.buildingId || null) : row.building_id,
    input.sortOrder ?? row.sort_order,
    id,
  ])
  return folderRow(await one('SELECT * FROM album_folders WHERE id = ?', [id]))
}

/** 删除文件夹：默认只删文件夹，照片变成「未分组」而不是一起消失*/
export async function deleteAlbumFolder(id, { withPhotos = false } = {}) {
  const row = await one('SELECT * FROM album_folders WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '文件夹不存在')
  return tx(async (conn) => {
    const photos = await cq(conn, 'SELECT id, file_path, thumb_path FROM album_photos WHERE folder_id = ?', [id])
    if (withPhotos) {
      await cq(conn, 'DELETE FROM album_photos WHERE folder_id = ?', [id])
    } else {
      await cq(conn, 'UPDATE album_photos SET folder_id = NULL WHERE folder_id = ?', [id])
    }
    await cq(conn, 'DELETE FROM album_folders WHERE id = ?', [id])
    return { ok: true, photos, removedPhotos: withPhotos ? photos.length : 0 }
  })
}

export async function listAlbumPhotos({ folderId, buildingId, withDeleted = false, limit = 500 } = {}) {
  const where = [withDeleted ? '1=1' : 'p.deleted_at IS NULL']
  const params = []
  if (folderId !== undefined && folderId !== null && folderId !== '') {
    where.push('p.folder_id = ?')
    params.push(folderId)
  } else if (folderId === 'none') {
    where.push('p.folder_id IS NULL')
  }
  if (buildingId) {
    where.push('p.building_id = ?')
    params.push(buildingId)
  }
  params.push(Math.min(Number(limit) || 500, 2000))
  const rows = await q(`${PHOTO_SELECT} WHERE ${where.join(' AND ')} ORDER BY p.sort_order ASC, p.id ASC LIMIT ?`, params)
  return rows.map(photoRow)
}

export async function createAlbumPhoto(input) {
  const result = await q(
    `INSERT INTO album_photos
       (folder_id, building_id, title, caption, file_path, thumb_path, width, height, size_bytes, orig_bytes, source, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.folderId ?? null,
      input.buildingId || null,
      input.title || '',
      input.caption || '',
      input.filePath,
      input.thumbPath || '',
      input.width || 0,
      input.height || 0,
      input.sizeBytes || 0,
      input.origBytes || 0,
      input.source || 'wechat',
      input.sortOrder ?? 0,
    ]
  )
  const row = await one(`${PHOTO_SELECT} WHERE p.id = ?`, [result.insertId])
  return photoRow(row)
}

export async function updateAlbumPhoto(id, input) {
  const row = await one('SELECT * FROM album_photos WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '照片不存在')
  await q(
    `UPDATE album_photos SET folder_id = ?, building_id = ?, title = ?, caption = ?, sort_order = ? WHERE id = ?`,
    [
      input.folderId !== undefined ? (input.folderId || null) : row.folder_id,
      input.buildingId !== undefined ? (input.buildingId || null) : row.building_id,
      input.title !== undefined ? input.title : row.title,
      input.caption !== undefined ? input.caption : row.caption,
      input.sortOrder !== undefined ? input.sortOrder : row.sort_order,
      id,
    ]
  )
  return photoRow(await one(`${PHOTO_SELECT} WHERE p.id = ?`, [id]))
}

export async function deleteAlbumPhoto(id) {
  const row = await one('SELECT id, file_path, thumb_path FROM album_photos WHERE id = ?', [id])
  if (!row) throw new ApiError(404, '照片不存在')
  await q('DELETE FROM album_photos WHERE id = ?', [id])
  return { ok: true, filePath: row.file_path, thumbPath: row.thumb_path }
}

/** 前台相册：按建筑 id 分组返回，只含有照片的建筑*/
export async function getAlbumByBuilding() {
  const rows = await q(
    `SELECT p.building_id, p.id, p.title, p.caption, p.file_path, p.thumb_path, p.width, p.height
       FROM album_photos p
      WHERE p.deleted_at IS NULL AND p.building_id IS NOT NULL AND p.building_id <> ''
      ORDER BY p.sort_order ASC, p.id ASC`
  )
  const map = {}
  for (const r of rows) {
    const key = r.building_id
    if (!map[key]) map[key] = []
    map[key].push({
      id: Number(r.id),
      title: r.title || '',
      caption: r.caption || '',
      path: r.file_path || '',
      thumb: r.thumb_path || r.file_path || '',
      width: Number(r.width || 0),
      height: Number(r.height || 0),
    })
  }
  return map
}

export async function getAlbumStats() {
  const row = await one(
    `SELECT COUNT(*) AS total, COALESCE(SUM(size_bytes), 0) AS bytes,
            COALESCE(SUM(orig_bytes), 0) AS origBytes
       FROM album_photos WHERE deleted_at IS NULL`
  )
  return {
    total: Number(row?.total || 0),
    bytes: Number(row?.bytes || 0),
    origBytes: Number(row?.origBytes || 0),
  }
}

/** 照片排序：把一个文件夹（或未归档）下的照片按传入的 id 顺序重排 sort_order */
export async function reorderAlbumPhotos(folderId, ids) {
  const list = Array.isArray(ids) ? ids : []
  for (let i = 0; i < list.length; i++) {
    if (folderId === null || folderId === undefined || folderId === '') {
      await q('UPDATE album_photos SET sort_order = ? WHERE id = ? AND folder_id IS NULL', [(i + 1) * 10, list[i]])
    } else {
      await q('UPDATE album_photos SET sort_order = ? WHERE id = ? AND folder_id = ?', [(i + 1) * 10, list[i], folderId])
    }
  }
  return { ok: true, count: list.length }
}

/**
 * 给每栋建筑补一个同名文件夹（幂等）。
 * 已有文件夹（按 building_id 匹配，或名字正好等于建筑名）就跳过，
 * 否则新建一个并绑定该建筑。
 */
export async function syncAlbumFoldersForBuildings() {
  const buildings = await q('SELECT id, name FROM buildings ORDER BY id ASC')
  const existing = await q('SELECT id, name, building_id FROM album_folders WHERE deleted_at IS NULL')
  const byBuilding = new Set(existing.map((f) => f.building_id).filter(Boolean))
  const byName = new Map(existing.map((f) => [String(f.name).trim(), f]))
  const created = []
  for (const b of buildings) {
    if (byBuilding.has(b.id)) continue
    const same = byName.get(String(b.name).trim())
    if (same) {
      // 名字相同但还没绑定 → 直接补上绑定，避免出现两个同名文件夹
      await q('UPDATE album_folders SET building_id = ? WHERE id = ?', [b.id, same.id])
      byBuilding.add(b.id)
      continue
    }
    const r = await q(
      'INSERT INTO album_folders (name, description, building_id, sort_order) VALUES (?, ?, ?, ?)',
      [b.name, '', b.id, 0]
    )
    byBuilding.add(b.id)
    created.push({ id: Number(r.insertId), name: b.name, buildingId: b.id })
  }
  return created
}