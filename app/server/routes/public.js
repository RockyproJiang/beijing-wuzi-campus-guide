import { Router } from 'express'
import { createSubmission, getAlbumByBuilding, getSiteData } from '../repo.js'
import path from 'node:path'
import { jpegSize, saveDataUrl } from '../album.js'
import { submissionSchema } from '../validate.js'
import { ApiError, wrap } from '../utils.js'
import { SUBMISSIONS_DIR } from '../paths.js'

const router = Router()
const submissionHits = new Map()
// 待审核的投稿照片先放在 submissions 目录，审核通过后再搬进楼体相册
const SUB_DIR = SUBMISSIONS_DIR

function imageSize(dataUrl) {
  const m = /^data:image\/[a-z0-9.+-]+;base64,([\s\S]+)$/i.exec(String(dataUrl || ''))
  const b64 = m ? m[1] : ''
  const bytes = Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0)
  let width = 0
  let height = 0
  try {
    const size = jpegSize(Buffer.from(b64, 'base64'))
    if (size) { width = size.width; height = size.height }
  } catch { /* 非 jpeg 时留空 */ }
  return { bytes: Math.max(0, bytes), width, height }
}

router.get('/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() })
})

router.get('/site', wrap(async (req, res) => {
  const data = await getSiteData()
  res.json(data)
}))

router.get('/album', wrap(async (req, res) => {
  res.set('Cache-Control', 'public, max-age=60')
  res.json({ buildings: await getAlbumByBuilding() })
}))

router.post('/submissions', wrap(async (req, res) => {
  const now = Date.now()
  const ip = req.ip || 'unknown'
  const recent = (submissionHits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000)
  if (recent.length >= 8) throw new ApiError(429, '提交太频繁，请稍后再试')
  recent.push(now)
  submissionHits.set(ip, recent)

  const input = submissionSchema.parse(req.body)

  let photo = null
  if (input.type === 'photo') {
    const sized = imageSize(input.dataUrl)
    // 与后台上传一致：单张 4MB 上限
    if (sized.bytes > 4 * 1024 * 1024) {
      throw new ApiError(413, `照片太大（${(sized.bytes / 1024 / 1024).toFixed(1)}MB），请换一张小一点的`)
    }
    try {
      const baseName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const main = saveDataUrl(input.dataUrl, SUB_DIR, 'pending', baseName)
      let thumb = ''
      const thumbSource = input.thumbDataUrl || (sized.bytes > 220 * 1024 ? input.dataUrl : '')
      if (thumbSource) {
        try {
          thumb = saveDataUrl(thumbSource, SUB_DIR, 'pending/thumbs', baseName).filePath
        } catch {
          thumb = ''
        }
      }
      photo = {
        path: main.filePath,
        thumb,
        width: input.photoWidth || sized.width,
        height: input.photoHeight || sized.height,
        bytes: main.bytes,
      }
    } catch (err) {
      throw new ApiError(500, `照片保存失败：${err.message}`)
    }
  }

  const submission = await createSubmission({ ...input, photo })
  res.status(201).json({ ok: true, submission })
}))

export default router
