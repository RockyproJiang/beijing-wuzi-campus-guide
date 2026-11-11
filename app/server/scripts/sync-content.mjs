/**
 * 把 database/content.json 里的「内容数据」同步进当前数据库（幂等，可反复执行）
 *
 * 解决的问题：
 *   deploy.sh 只在「库里一张表都没有」时才导入 SQL 快照，
 *   update.sh 完全不碰数据。于是在本机改过的建筑信息、周边设施、
 *   分类、提示语、校历等内容，传到服务器后永远进不了服务器的库。
 *
 * 这个脚本只碰「内容表」：
 *   categories / buildings / settings / tips / search_aliases / calendar_items / calendar_meta
 * 绝不碰：album_photos、album_folders、location_submissions、audit_logs、admins
 * （即服务器上用户上传的照片、投稿、后台账号、操作日志都保持原样）
 *
 * 用法：
 *   node server/scripts/sync-content.mjs             # 正式写入
 *   node server/scripts/sync-content.mjs --dry-run   # 只报告差异，不写库
 *   node server/scripts/sync-content.mjs --only=buildings,settings
 *   CONTENT_FILE=/path/to/content.json node server/scripts/sync-content.mjs
 */
import '../env.js' // 必须最先执行：在任何模块读 process.env 之前加载 app/.env
import fs from 'node:fs'
import path from 'node:path'
import { pool, q, one } from '../db.js'
import { ROOT } from '../paths.js'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const onlyArg = args.find((a) => a.startsWith('--only='))
const ONLY = onlyArg ? onlyArg.slice('--only='.length).split(',').map((s) => s.trim()).filter(Boolean) : null

const CONTENT_FILE = process.env.CONTENT_FILE
  ? path.resolve(process.env.CONTENT_FILE)
  : path.resolve(ROOT, '..', 'database', 'content.json')

/** 有外键依赖，顺序不能乱 */
const TABLE_ORDER = ['categories', 'buildings', 'settings', 'tips', 'search_aliases', 'calendar_items', 'calendar_meta']

const log = (...a) => console.log(...a)

function fail(msg) {
  console.error(`[content] ${msg}`)
  process.exit(1)
}

if (!fs.existsSync(CONTENT_FILE)) fail(`找不到 ${CONTENT_FILE}（请先在本机跑 npm run content:export）`)

const data = JSON.parse(fs.readFileSync(CONTENT_FILE, 'utf8'))
if (!data?.tables) fail('content.json 格式不对：缺少 tables')

const tables = TABLE_ORDER.filter((t) => data.tables[t] && (!ONLY || ONLY.includes(t)))
if (!tables.length) fail('content.json 里没有可同步的表')

log(`[content] 数据文件 ${CONTENT_FILE}`)
log(`[content] 生成时间 ${data.generatedAt || '(未记录)'}`)
log(`[content] 目标库 ${process.env.DB_NAME} @ ${process.env.DB_HOST}`)
if (DRY) log('[content] --dry-run：只报告差异，不写库')

/** 读表结构，拿到列名 / 是否 JSON / 是否主键 */
async function describe(table) {
  const rows = await q(
    `SELECT column_name AS name, data_type AS type, column_key AS ck, extra AS extra
       FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ?
      ORDER BY ordinal_position`,
    [table]
  )
  if (!rows.length) return null
  return rows.map((r) => ({
    name: r.name,
    isJson: String(r.type).toLowerCase() === 'json',
    isPk: String(r.ck).toUpperCase() === 'PRI',
    autoInc: String(r.extra || '').toLowerCase().includes('auto_increment'),
  }))
}

/** 把 content.json 里的值转成能直接塞进 mysql2 的形式 */
function toParam(v, col) {
  if (v === null || v === undefined) return null
  if (col.isJson) return typeof v === 'string' ? v : JSON.stringify(v)
  if (v instanceof Date) return v
  if (typeof v === 'object') return JSON.stringify(v)
  return v
}

function sameValue(a, b) {
  const norm = (x) => {
    if (x === null || x === undefined) return null
    // content.json 里导出的时间字符串是 +08:00 墙钟，mysql2 返回的是 Date，
    // 这里必须按同一个时区格式化，否则每行都会误报 created_at/updated_at 有差异
    if (x instanceof Date) {
      const z = new Date(x.getTime() + 8 * 3600 * 1000)
      return z.toISOString().slice(0, 19).replace('T', ' ')
    }
    if (typeof x === 'object') return JSON.stringify(x)
    if (typeof x === 'number') return String(x)
    if (typeof x === 'boolean') return x ? '1' : '0'
    return String(x)
  }
  return norm(a) === norm(b)
}

const pkOf = (cols, row) => {
  const pkCols = cols.filter((c) => c.isPk)
  const keys = pkCols.length ? pkCols : [cols[0]]
  return keys.map((c) => `${c.name}=${row[c.name]}`).join(' ')
}

let grand = { insert: 0, update: 0, same: 0, skipped: 0 }

for (const table of tables) {
  const cols = await describe(table)
  if (!cols) {
    log(`\n[${table}] 表不存在，跳过（先跑 deploy.sh 建表）`)
    grand.skipped++
    continue
  }
  const rows = data.tables[table] || []
  const pkNames = cols.filter((c) => c.isPk).map((c) => c.name)
  const pkName = (pkNames.length ? pkNames : [cols[0].name])[0]

  // 现有数据（按主键索引）
  const existing = new Map()
  for (const r of await q(`SELECT * FROM \`${table}\``)) existing.set(String(r[pkName]), r)

  let ins = 0, upd = 0, same = 0
  const changed = []

  for (const row of rows) {
    const useCols = cols.filter((c) => Object.prototype.hasOwnProperty.call(row, c.name))
    if (!useCols.length) continue
    const key = String(row[pkName])
    const cur = existing.get(key)

    if (!cur) { ins++; changed.push(`+ ${pkOf(cols, row)}`); continue }

    const diffCols = useCols.filter((c) => !sameValue(cur[c.name], row[c.name]))
    if (!diffCols.length) { same++; continue }
    upd++
    changed.push(`~ ${pkOf(cols, row)}  ${diffCols.map((c) => c.name).join(',')}`)
  }

  const extraServeOnly = [...existing.keys()].filter((k) => !rows.some((r) => String(r[pkName]) === k))

  log(`\n[${table}] 文件 ${rows.length} 行 / 库里 ${existing.size} 行 → 新增 ${ins}、更新 ${upd}、相同 ${same}`)
  if (changed.length) {
    for (const line of changed.slice(0, 12)) log(`    ${line}`)
    if (changed.length > 12) log(`    … 另有 ${changed.length - 12} 行`)
  }
  if (extraServeOnly.length) {
    log(`    [!] 库里多出 ${extraServeOnly.length} 行（文件里没有），脚本不会删除：${extraServeOnly.slice(0, 8).join(', ')}${extraServeOnly.length > 8 ? ' …' : ''}`)
  }

  if (!DRY) {
    const conn = await pool.getConnection()
    try {
      await conn.beginTransaction()
      for (const row of rows) {
        const useCols = cols.filter((c) => Object.prototype.hasOwnProperty.call(row, c.name))
        if (!useCols.length) continue
        const names = useCols.map((c) => `\`${c.name}\``).join(',')
        const marks = useCols.map(() => '?').join(',')
        const params = useCols.map((c) => toParam(row[c.name], c))
        const updCols = useCols.filter((c) => !c.isPk)
        const onDup = updCols.length
          ? ` ON DUPLICATE KEY UPDATE ${updCols.map((c) => `\`${c.name}\`=VALUES(\`${c.name}\`)`).join(',')}`
          : ''
        await conn.query(`INSERT INTO \`${table}\` (${names}) VALUES (${marks})${onDup}`, params)
      }
      await conn.commit()
    } catch (error) {
      try { await conn.rollback() } catch { /* ignore */ }
      conn.release()
      fail(`写 ${table} 失败：${error.message}`)
    }
    conn.release()
  }

  grand.insert += ins
  grand.update += upd
  grand.same += same
}

if (!DRY) {
  // 内容改了但缩略/文件夹缓存可能过期，这里只做一次统计，方便排查
  const n = await one('SELECT COUNT(*) AS n FROM buildings WHERE deleted_at IS NULL')
  const sur = await one(
    'SELECT COUNT(*) AS n FROM buildings WHERE deleted_at IS NULL AND surroundings IS NOT NULL AND JSON_LENGTH(surroundings) > 0'
  )
  log(`\n[content] 同步完成：建筑 ${n.n} 栋，其中有周边设施 ${sur.n} 栋`)
}

log(`\n[content] 合计：新增 ${grand.insert}、更新 ${grand.update}、未变 ${grand.same}${DRY ? '（dry-run，未写库）' : ''}`)
await pool.end()
process.exit(0)
