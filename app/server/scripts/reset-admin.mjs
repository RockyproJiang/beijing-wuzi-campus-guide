import 'dotenv/config'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

const args = process.argv.slice(2)
const password = args.find((a) => a.startsWith('--password='))?.slice('--password='.length) || process.env.NEW_ADMIN_PASSWORD
const username = process.env.ADMIN_USER || 'admin'

if (!password || password.length < 8) {
  console.error('用法: node server/scripts/reset-admin.mjs --password=新密码（至少 8 位）')
  process.exit(1)
}

const conn = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
})

try {
  const hash = await bcrypt.hash(password, 12)
  const [rows] = await conn.query('SELECT id FROM admins WHERE username = ?', [username])
  if (rows.length) {
    await conn.query('UPDATE admins SET password_hash = ? WHERE username = ?', [hash, username])
    console.log(`已重置管理员 ${username} 的密码`)
  } else {
    await conn.query(
      'INSERT INTO admins (username, password_hash, display_name) VALUES (?, ?, ?)',
      [username, hash, '管理员']
    )
    console.log(`已创建管理员 ${username}`)
  }
} catch (error) {
  console.error('重置失败:', error.message)
  process.exitCode = 1
} finally {
  await conn.end()
}
