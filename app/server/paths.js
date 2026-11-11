import path from 'node:path'
import fs from 'node:fs'

/**
 * 所有数据目录都锚定在「本文件所在目录的上一级」（= app/），
 * 而不是 process.cwd()。
 *
 * 之前用 path.resolve('public/uploads') 是相对「启动时所在目录」解析的：
 *   - 用 systemd（WorkingDirectory=app）启动 → app/public/uploads        ✅
 *   - 在上一级目录手动 node app/server/index.js → <上一级>/public/uploads ❌
 * 后者会悄悄新建一个同名目录，照片写进去后，在 app/public/uploads 里当然找不到。
 */

const APP_ROOT = path.resolve(import.meta.dirname, '..')

export const ROOT = APP_ROOT
export const PUBLIC_DIR = path.join(APP_ROOT, 'public')
export const DIST_DIR = path.join(APP_ROOT, 'dist')

/** 允许用 .env 覆盖上传目录（多机部署 / 挂载盘时有用） */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(PUBLIC_DIR, 'uploads')

export const ALBUM_DIR = path.join(UPLOAD_DIR, 'album')
export const SUBMISSIONS_DIR = path.join(UPLOAD_DIR, 'submissions')

/** 启动时确保目录存在，并打印真实路径，方便核对 */
export function ensureDataDirs() {
  for (const dir of [UPLOAD_DIR, ALBUM_DIR, SUBMISSIONS_DIR]) {
    fs.mkdirSync(dir, { recursive: true })
  }
  return { appRoot: APP_ROOT, uploadDir: UPLOAD_DIR, albumDir: ALBUM_DIR, submissionsDir: SUBMISSIONS_DIR }
}

/** 相对 ALBUM_DIR 的路径 → 绝对路径（防止 ../ 穿越） */
export function albumAbs(rel) {
  return path.join(ALBUM_DIR, rel)
}
