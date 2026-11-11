import dotenv from 'dotenv'
import path from 'node:path'

/**
 * 必须以「第一条 import」的形式引入：`import './env.js'`
 * 这样在 db.js 等模块读取 process.env 之前，.env 已经加载完毕。
 *
 * 路径固定为 app/.env（本文件上一级），
 * 不受启动时工作目录影响 —— 服务器上用 systemd / 手动 node 都一样。
 */
export const ENV_PATH = path.resolve(import.meta.dirname, '..', '.env')
const result = dotenv.config({ path: ENV_PATH })

if (result.error) {
  console.warn('[env] 未能读取 .env：', ENV_PATH, '-', result.error.message)
} else {
  console.log('[env] 已加载配置文件：', ENV_PATH)
}
