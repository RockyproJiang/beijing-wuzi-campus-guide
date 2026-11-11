import 'dotenv/config'
import mysql from 'mysql2/promise'

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
})

async function columnExists(table, column) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [table, column]
  )
  return rows[0].n > 0
}

async function indexExists(table, index) {
  const [rows] = await conn.query(
    `SELECT COUNT(*) AS n FROM information_schema.statistics
     WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [table, index]
  )
  return rows[0].n > 0
}

/* ---------- v1.8：相册文件夹绑定建筑 ---------- */
if (await columnExists('album_folders', 'building_id')) {
  console.log('album_folders.building_id 已存在，跳过')
} else {
  await conn.query('ALTER TABLE album_folders ADD COLUMN building_id VARCHAR(32) NULL AFTER description')
  console.log('已添加 album_folders.building_id')
}

if (await indexExists('album_folders', 'idx_album_folders_building')) {
  console.log('idx_album_folders_building 已存在，跳过')
} else {
  await conn.query('ALTER TABLE album_folders ADD KEY idx_album_folders_building (building_id)')
  console.log('已添加 idx_album_folders_building')
}

if (await indexExists('album_photos', 'idx_album_photos_folder_sort')) {
  console.log('idx_album_photos_folder_sort 已存在，跳过')
} else {
  await conn.query('ALTER TABLE album_photos ADD KEY idx_album_photos_folder_sort (folder_id, sort_order)')
  console.log('已添加 idx_album_photos_folder_sort')
}

await conn.end()
