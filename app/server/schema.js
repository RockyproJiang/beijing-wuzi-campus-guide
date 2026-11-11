/**
 * 运行时结构自检 / 自愈
 *
 * 为什么需要它：发布包里 server 代码是最新的，但服务器上的库可能是很久以前
 * `bwz_campus_guide.sql` 建出来的——缺 `location_submissions` 的照片字段时，
 * 投稿接口会抛 `ER_BAD_FIELD_ERROR: Unknown column 'author_name'`，
 * 前台只能看到一句「服务器内部错误」。
 *
 * 这里把 server/scripts/migrate-v17/v18/v19 做的事抽成幂等函数，
 * 服务启动时调用一次：缺什么补什么，已经有就跳过（不碰任何数据）。
 */
import { q, one } from './db.js'

async function columnInfo(table, column) {
  return one(
    `SELECT column_type AS type FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  )
}

async function indexExists(table, index) {
  const row = await one(
    `SELECT COUNT(*) AS n FROM information_schema.statistics
      WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, index]
  )
  return Number(row?.n || 0) > 0
}

async function tableExists(table) {
  const row = await one(
    `SELECT COUNT(*) AS n FROM information_schema.tables
      WHERE table_schema = DATABASE() AND table_name = ?`,
    [table]
  )
  return Number(row?.n || 0) > 0
}

/** v17：建筑别名；v12：区域 / 贴片顶点 */
const BUILDING_COLUMNS = [
  ['aliases', 'JSON NULL AFTER sub'],
  ['regions', 'JSON NULL AFTER pin_z'],
  ['surface_points', 'JSON NULL AFTER regions'],
]

/** v12：投稿表本身（老到连表都没有时） */
const CREATE_SUBMISSIONS = `
  CREATE TABLE IF NOT EXISTS location_submissions (
    id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
    building_id   VARCHAR(32)  NULL,
    building_name VARCHAR(128) NOT NULL DEFAULT '',
    place_name    VARCHAR(128) NOT NULL DEFAULT '',
    pin_x         DECIMAL(9,2) NULL,
    pin_z         DECIMAL(9,2) NULL,
    type          VARCHAR(32)  NOT NULL DEFAULT 'correction',
    content       TEXT         NOT NULL,
    occurred_at   DATETIME     NULL,
    contact       VARCHAR(128) NOT NULL DEFAULT '',
    status        ENUM('pending','processed','ignored') NOT NULL DEFAULT 'pending',
    created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_submissions_status (status, created_at),
    KEY idx_submissions_building (building_id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`

/** v19：投稿照片 */
const SUBMISSION_COLUMNS = [
  ['author_name', "VARCHAR(64) NOT NULL DEFAULT '' AFTER contact"],
  ['photo_path', "VARCHAR(255) NOT NULL DEFAULT '' AFTER author_name"],
  ['photo_thumb', "VARCHAR(255) NOT NULL DEFAULT '' AFTER photo_path"],
  ['photo_width', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_thumb'],
  ['photo_height', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_width'],
  ['photo_bytes', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_height'],
  ['published_photo_id', 'INT UNSIGNED NULL AFTER photo_bytes'],
]

const SUBMISSION_TYPES = "'photo','correction','supplement','new','closed','moved','other'"

/**
 * @returns {Promise<{ applied: string[], failed: { item: string, error: string }[] }>}
 */
export async function ensureSchema() {
  const applied = []
  const failed = []

  const tryRun = async (label, sql) => {
    try {
      await q(sql)
      applied.push(label)
      console.log(`[schema] 已补 ${label}`)
    } catch (error) {
      failed.push({ item: label, error: error.message })
      console.error(`[schema] 补 ${label} 失败：${error.message}`)
    }
  }

  for (const [name, def] of BUILDING_COLUMNS) {
    if (await columnInfo('buildings', name)) continue
    await tryRun(`buildings.${name}`, `ALTER TABLE buildings ADD COLUMN \`${name}\` ${def}`)
  }

  // 最老的一版库里可能连投稿表都没有
  if (!(await tableExists('location_submissions'))) {
    await tryRun('location_submissions（新建）', CREATE_SUBMISSIONS)
  }

  for (const [name, def] of SUBMISSION_COLUMNS) {
    if (await columnInfo('location_submissions', name)) continue
    await tryRun(`location_submissions.${name}`, `ALTER TABLE location_submissions ADD COLUMN \`${name}\` ${def}`)
  }

  const typeCol = await columnInfo('location_submissions', 'type')
  if (typeCol && !String(typeCol.type).toLowerCase().startsWith('enum')) {
    await tryRun(
      'location_submissions.type 枚举',
      `ALTER TABLE location_submissions MODIFY COLUMN type ENUM(${SUBMISSION_TYPES}) NOT NULL DEFAULT 'correction'`
    )
  }

  if (!(await columnInfo('album_folders', 'building_id'))) {
    await tryRun('album_folders.building_id', 'ALTER TABLE album_folders ADD COLUMN building_id VARCHAR(32) NULL AFTER description')
  }
  if (!(await indexExists('album_folders', 'idx_album_folders_building'))) {
    await tryRun('idx_album_folders_building', 'ALTER TABLE album_folders ADD KEY idx_album_folders_building (building_id)')
  }
  if (!(await indexExists('album_photos', 'idx_album_photos_folder_sort'))) {
    await tryRun('idx_album_photos_folder_sort', 'ALTER TABLE album_photos ADD KEY idx_album_photos_folder_sort (folder_id, sort_order)')
  }

  if (applied.length === 0) console.log('[schema] 表结构已是最新')
  return { applied, failed }
}
