import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { one, q } from './db.js'
import { ApiError, clientIp } from './utils.js'

const COOKIE_NAME = 'bwz_admin'
const TOKEN_TTL_SECONDS = 8 * 60 * 60

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const LOGIN_MAX_FAILURES = 5
const LOGIN_BLOCK_MS = 15 * 60 * 1000
const failures = new Map()

function jwtSecret() {
  const secret = process.env.JWT_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET 未配置或过短（至少 32 位）')
  }
  return secret
}

export function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export function checkLoginRate(req) {
  const ip = clientIp(req)
  const item = failures.get(ip)
  if (!item) return
  if (item.blockedUntil && item.blockedUntil > Date.now()) {
    const seconds = Math.ceil((item.blockedUntil - Date.now()) / 1000)
    throw new ApiError(429, `尝试次数过多，请 ${Math.ceil(seconds / 60)} 分钟后再试`, 'RATE_LIMITED')
  }
  if (item.firstAt && Date.now() - item.firstAt > LOGIN_WINDOW_MS) {
    failures.delete(ip)
  }
}

export function recordLoginFailure(req) {
  const ip = clientIp(req)
  const now = Date.now()
  const item = failures.get(ip) || { count: 0, firstAt: now, blockedUntil: 0 }
  if (now - item.firstAt > LOGIN_WINDOW_MS) {
    item.count = 0
    item.firstAt = now
  }
  item.count += 1
  if (item.count >= LOGIN_MAX_FAILURES) {
    item.blockedUntil = now + LOGIN_BLOCK_MS
    item.count = 0
    item.firstAt = now
  }
  failures.set(ip, item)
}

export function clearLoginFailures(req) {
  failures.delete(clientIp(req))
}

export async function authenticate(username, password) {
  const admin = await one('SELECT * FROM admins WHERE username = ? LIMIT 1', [username])
  if (!admin) return null
  const ok = await bcrypt.compare(password, admin.password_hash)
  if (!ok) return null
  await q('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [admin.id])
  return admin
}

export function setSessionCookie(res, admin) {
  const token = jwt.sign(
    { sub: admin.id, username: admin.username, name: admin.display_name },
    jwtSecret(),
    { expiresIn: TOKEN_TTL_SECONDS }
  )
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: TOKEN_TTL_SECONDS * 1000,
  })
  return token
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

export function requireAdmin(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: '请先登录', code: 'UNAUTHORIZED' })
  try {
    const payload = jwt.verify(token, jwtSecret())
    req.admin = { id: payload.sub, username: payload.username, name: payload.name }
    return next()
  } catch {
    clearSessionCookie(res)
    return res.status(401).json({ error: '登录已过期，请重新登录', code: 'UNAUTHORIZED' })
  }
}

export async function getAdminById(id) {
  return one('SELECT id, username, display_name, last_login_at, created_at FROM admins WHERE id = ?', [id])
}

export async function changePassword(adminId, currentPassword, nextPassword) {
  const admin = await one('SELECT * FROM admins WHERE id = ?', [adminId])
  if (!admin) throw new ApiError(404, '管理员不存在')
  const ok = await bcrypt.compare(currentPassword, admin.password_hash)
  if (!ok) throw new ApiError(400, '当前密码不正确', 'BAD_PASSWORD')
  const hash = await hashPassword(nextPassword)
  await q('UPDATE admins SET password_hash = ? WHERE id = ?', [hash, adminId])
}
