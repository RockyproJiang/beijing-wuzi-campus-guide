import 'dotenv/config'
import fs from 'node:fs'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const args = process.argv.slice(2)
const force = args.includes('--force')
const resetAdmin = args.includes('--reset-admin')
const passwordArg = args.find((a) => a.startsWith('--password='))?.slice('--password='.length)
const username = process.env.ADMIN_USER || 'admin'
const password = passwordArg || process.env.ADMIN_PASSWORD || ''

const schema = fs.readFileSync('server/sql/schema.sql', 'utf8')
const seed = JSON.parse(fs.readFileSync('server/seed/seed.json', 'utf8'))

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  multipleStatements: true,
  timezone: '+08:00',
})

const j = (v) => (v === null || v === undefined ? null : JSON.stringify(v))

async function ensureAdmin() {
  const [rows] = await conn.query('SELECT id FROM admins WHERE username = ?', [username])
  if (rows.length && !resetAdmin) {
    console.log(`[seed] 管理员 ${username} 已存在，跳过`)
    return false
  }
  if (!password) {
    throw new Error('创建管理员需要设置 ADMIN_PASSWORD 环境变量或传入 --password=...')
  }
  if (password.length < 8) throw new Error('管理员密码至少 8 位')
  const hash = await bcrypt.hash(password, 12)
  if (rows.length) {
    await conn.query('UPDATE admins SET password_hash = ? WHERE username = ?', [hash, username])
    console.log(`[seed] 已重置管理员 ${username} 的密码`)
  } else {
    await conn.query(
      'INSERT INTO admins (username, password_hash, display_name) VALUES (?, ?, ?)',
      [username, hash, '管理员']
    )
    console.log(`[seed] 已创建管理员 ${username}`)
  }
  return true
}

try {
  await conn.query(schema)
  console.log('[seed] 表结构已就绪')

  const [countRows] = await conn.query('SELECT COUNT(*) AS n FROM categories')
  const existing = Number(countRows[0].n)
  if (existing > 0 && !force) {
    console.log(`[seed] 数据库已有 ${existing} 个分类，跳过数据导入（如需重建请加 --force）`)
    await ensureAdmin()
  } else {
    await conn.beginTransaction()
    if (force) {
      await conn.query('DELETE FROM buildings')
      await conn.query('DELETE FROM categories')
      await conn.query('DELETE FROM calendar_items')
      await conn.query('DELETE FROM tips')
      await conn.query('DELETE FROM search_aliases')
    }

    let categoryCount = 0
    let buildingCount = 0
    for (let ci = 0; ci < seed.categories.length; ci++) {
      const category = seed.categories[ci]
      await conn.query(
        'INSERT INTO categories (id, name, icon, bg_color, color, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [category.id, category.name, category.icon, category.bgColor, category.color, ci]
      )
      categoryCount++
      for (let bi = 0; bi < category.buildings.length; bi++) {
        const b = category.buildings[bi]
        await conn.query(
          `INSERT INTO buildings (
             id, category_id, name, sub, intro, icon, bg_color, color, map_x, map_y, map_hidden,
             group_name, sort_order, info, equipment, floors, schedule, contacts, surroundings,
             timetable, model_objects, pin_x, pin_z
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            b.id,
            category.id,
            b.name,
            b.sub || '',
            b.intro || '',
            b.icon,
            b.bgColor,
            b.color,
            b.mapX ?? null,
            b.mapY ?? null,
            b.mapHidden ? 1 : 0,
            b.group || null,
            bi,
            j(b.info || []),
            j(b.equipment || []),
            j(b.floors || []),
            b.schedule || null,
            j(b.contacts ?? null),
            j(b.surroundings ?? null),
            j(b.timetable ?? null),
            j(b.modelObjects || []),
            b.pin?.x ?? null,
            b.pin?.z ?? null,
          ]
        )
        buildingCount++
      }
    }

    await conn.query('DELETE FROM calendar_items')
    await conn.query(
      'INSERT INTO calendar_meta (id, title) VALUES (1, ?) ON DUPLICATE KEY UPDATE title = VALUES(title)',
      [seed.calendar.title || '']
    )
    for (let i = 0; i < seed.calendar.items.length; i++) {
      const item = seed.calendar.items[i]
      await conn.query(
        'INSERT INTO calendar_items (event, date_label, sort_order) VALUES (?, ?, ?)',
        [item.event, item.date || '', i]
      )
    }

    await conn.query('DELETE FROM tips')
    for (let i = 0; i < seed.tips.length; i++) {
      await conn.query('INSERT INTO tips (content, sort_order) VALUES (?, ?)', [seed.tips[i], i])
    }

    await conn.query('DELETE FROM search_aliases')
    for (let i = 0; i < seed.aliases.length; i++) {
      await conn.query(
        'INSERT INTO search_aliases (keyword, building_ids, sort_order) VALUES (?, ?, ?)',
        [seed.aliases[i].keyword, j(seed.aliases[i].ids || []), i]
      )
    }

    await conn.query(
      'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
      ['model_transform', j(seed.modelTransform)]
    )

    if (seed.digitalCampus) {
      await conn.query(
        'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
        ['digital_campus', j(seed.digitalCampus)]
      )
    }

    await conn.commit()
    console.log(`[seed] 已导入 ${categoryCount} 个分类、${buildingCount} 个建筑、${seed.tips.length} 条提示、${seed.aliases.length} 条搜索别名`)
    await ensureAdmin()
  }

  const [[stat]] = await conn.query(
    `SELECT
       (SELECT COUNT(*) FROM categories WHERE deleted_at IS NULL) AS categories,
       (SELECT COUNT(*) FROM buildings WHERE deleted_at IS NULL) AS buildings,
       (SELECT COUNT(*) FROM tips) AS tips,
       (SELECT COUNT(*) FROM search_aliases) AS aliases`
  )
  console.log('[seed] 当前数据:', stat)
} catch (error) {
  try { await conn.rollback() } catch { /* ignore */ }
  console.error('[seed] 失败:', error.message)
  process.exitCode = 1
} finally {
  await conn.end()
}
