/**
 * v19 迁移：投稿照片字段（幂等）
 * 用法：node server/scripts/migrate-v19.mjs
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { q, one } from '../db.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const sqlFile = path.resolve(here, '../sql/migrate-v19-photo-submissions.sql')

async function columnExists(table, column) {
  const row = await one(
    `SELECT COUNT(*) AS n FROM information_schema.columns
      WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  )
  return Number(row?.n || 0) > 0
}

const cols = [
  ['author_name', "VARCHAR(64) NOT NULL DEFAULT '' AFTER contact"],
  ['photo_path', "VARCHAR(255) NOT NULL DEFAULT '' AFTER author_name"],
  ['photo_thumb', "VARCHAR(255) NOT NULL DEFAULT '' AFTER photo_path"],
  ['photo_width', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_thumb'],
  ['photo_height', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_width'],
  ['photo_bytes', 'INT UNSIGNED NOT NULL DEFAULT 0 AFTER photo_height'],
  ['published_photo_id', 'INT UNSIGNED NULL AFTER photo_bytes'],
]

for (const [name, def] of cols) {
  if (await columnExists('location_submissions', name)) {
    console.log(`跳过 location_submissions.${name}（已存在）`)
    continue
  }
  await q(`ALTER TABLE location_submissions ADD COLUMN \`${name}\` ${def}`)
  console.log(`已添加 location_submissions.${name}`)
}

// type 改成 ENUM，兼容旧的 varchar 值
await q(
  "ALTER TABLE location_submissions MODIFY COLUMN type ENUM('photo','correction','supplement','new','closed','moved','other') NOT NULL DEFAULT 'correction'"
)
console.log('已更新 location_submissions.type 枚举')
console.log('SQL 文件位置：', sqlFile, fs.existsSync(sqlFile) ? '(存在)' : '(缺失)')
process.exitCode = 0