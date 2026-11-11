import 'dotenv/config'
import mysql from 'mysql2/promise'

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']
for (const key of required) {
  if (!process.env[key]) {
    console.error(`[db] 缺少环境变量 ${key}，请检查 .env 文件`)
    process.exit(1)
  }
}

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00',
  dateStrings: false,
})

export async function q(sql, params = []) {
  const [rows] = await pool.query(sql, params)
  return rows
}

export async function one(sql, params = []) {
  const rows = await q(sql, params)
  return rows[0] ?? null
}

export async function cq(conn, sql, params = []) {
  const [rows] = await conn.query(sql, params)
  return rows
}

export async function tx(fn) {
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const result = await fn(conn)
    await conn.commit()
    return result
  } catch (error) {
    try { await conn.rollback() } catch { /* ignore */ }
    throw error
  } finally {
    conn.release()
  }
}

export function json(value) {
  if (value === null || value === undefined) return null
  return JSON.stringify(value)
}
