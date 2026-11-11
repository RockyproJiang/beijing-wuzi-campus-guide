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

if (await columnExists('buildings', 'aliases')) {
  console.log('buildings.aliases 已存在，跳过')
} else {
  await conn.query('ALTER TABLE buildings ADD COLUMN aliases JSON NULL AFTER sub')
  console.log('已添加 buildings.aliases')
}

await conn.end()