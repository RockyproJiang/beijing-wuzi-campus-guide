import './env.js' // 必须最先执行：在任何模块读 process.env 之前加载 app/.env
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import { pool } from './db.js'
import publicRoutes from './routes/public.js'
import adminRoutes from './routes/admin.js'
import { ApiError } from './utils.js'
import { DIST_DIR, UPLOAD_DIR, ensureDataDirs } from './paths.js'
import { ensureSchema } from './schema.js'

const isProduction = process.env.NODE_ENV === 'production'
const port = Number(isProduction ? (process.env.SERVE_PORT || 5000) : (process.env.API_PORT || 3001))
// 默认只监听本机，由 Nginx 反代；服务器上没有反代时把 HOST 设成 0.0.0.0 直接对外
const host = process.env.HOST || '127.0.0.1'

const app = express()
app.disable('x-powered-by')
app.set('trust proxy', 1)

app.use(compression())
app.use(express.json({ limit: '12mb' }))
app.use(cookieParser())

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  next()
})

app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store')
  next()
})

app.use('/api/admin', adminRoutes)
app.use('/api', publicRoutes)
app.use('/api', (req, res) => {
  res.status(404).json({ error: '接口不存在', code: 'NOT_FOUND' })
})

if (isProduction) {
  // 目录一律锚定在 app/ 下，和启动时的工作目录无关
  const dirs = ensureDataDirs()
  console.log('[server] 上传目录:', dirs.uploadDir)
  const dist = DIST_DIR
  const uploads = UPLOAD_DIR
  app.use('/uploads', express.static(uploads, { maxAge: '30d', immutable: true }))
  if (fs.existsSync(dist)) {
    app.use('/models', express.static(path.join(dist, 'models'), { maxAge: '7d', immutable: true }))
    app.use(express.static(dist, { index: false, maxAge: '1h' }))
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) return next()
      return res.sendFile(path.join(dist, 'index.html'))
    })
  } else {
    console.warn('[server] 未找到 dist 目录，请先运行 npm run build')
    app.use((req, res) => {
      res.status(503).type('text/plain').send('前端尚未构建，请先运行 npm run build，或使用 npm run dev 开发模式。')
    })
  }
}

/* ---------------- 错误处理 ---------------- */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message, code: err.code || 'ERROR' })
  }
  if (err?.name === 'ZodError') {
    const first = err.issues?.[0]?.message || ''
    return res.status(400).json({
      error: first ? `提交的数据格式不正确：${first}` : '提交的数据格式不正确',
      code: 'VALIDATION_ERROR',
      details: err.issues?.map((issue) => ({
        path: Array.isArray(issue.path) ? issue.path.join('.') : String(issue.path || ''),
        message: issue.message,
      })),
    })
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: '请求体不是合法的 JSON', code: 'BAD_JSON' })
  }
  // MySQL 的「字段/表不存在」几乎都是库结构比代码旧：
  // 服务器上覆盖了新代码却没跑迁移，投稿就会撞上不存在的列。
  if (err?.code === 'ER_BAD_FIELD_ERROR' || err?.code === 'ER_NO_SUCH_TABLE') {
    console.error('[server] 数据库结构落后于代码，请运行 npm run db:repair ——', err.message)
    return res.status(500).json({
      error: '服务器数据需要升级，暂时无法接收投稿，请联系站点管理员',
      code: 'SCHEMA_OUTDATED',
      detail: String(err.sqlMessage || err.message || ''),
    })
  }
  if (err?.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: '数据已存在', code: 'DUPLICATE' })
  }
  console.error('[server] 未处理异常:', err)
  return res.status(500).json({ error: '服务器内部错误', code: err?.code || 'INTERNAL_ERROR' })
})

async function main() {
  try {
    const conn = await pool.getConnection()
    await conn.query('SELECT 1')
    conn.release()
    console.log('[server] MySQL 连接正常')
  } catch (error) {
    console.error('[server] MySQL 连接失败:', error.message)
    console.error('[server] 请检查 .env 配置，或先运行 npm run db:setup')
  }

  // 服务器上的库可能是很早的版本（比如缺 location_submissions 的 photo_* 字段），
  // 缺字段时投稿会报 "Unknown column 'author_name'"，前台只看到「服务器内部错误」。
  // 启动时自检一次，缺什么补什么，幂等。
  try {
    const result = await ensureSchema()
    if (result.failed.length) {
      console.error('[server] 有结构补齐失败，相关功能可能不可用：',
        result.failed.map((x) => x.item).join(', '))
    }
  } catch (error) {
    console.error('[server] 结构自检失败（不影响启动）:', error.message)
  }

  app.listen(port, host, () => {
    console.log(`[server] ${isProduction ? '生产' : '开发'}模式 API: http://${host}:${port}`)
    if (isProduction) console.log(`[server] 站点: http://${host === '127.0.0.1' ? '127.0.0.1' : host}:${port}`)
  })
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    try { await pool.end() } catch { /* ignore */ }
    process.exit(0)
  })
}

main()
