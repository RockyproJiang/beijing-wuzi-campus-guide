import fs from 'node:fs'
import path from 'node:path'

/**
 * 极简 JPEG 尺寸解析（只读 SOF 段，不依赖第三方库）。
 * 返回 { width, height } 或 null。
 */
export function jpegSize(buffer) {
  if (!buffer || buffer.length < 4) return null
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return null
  let offset = 2
  while (offset < buffer.length - 9) {
    if (buffer[offset] !== 0xff) {
      offset += 1
      continue
    }
    const marker = buffer[offset + 1]
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }
    const length = buffer.readUInt16BE(offset + 2)
    // SOF0..SOF15（排除 DHT=C4 / JPG=C8 / DAC=CC）
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      const height = buffer.readUInt16BE(offset + 5)
      const width = buffer.readUInt16BE(offset + 7)
      return { width, height }
    }
    offset += 2 + length
  }
  return null
}

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/pjpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export function extFromMime(mime) {
  return MIME_EXT[String(mime || '').toLowerCase()] || 'jpg'
}

/**
 * 保存 dataURL 到磁盘。dataURL 形如 data:image/jpeg;base64,xxxx
 * baseDir 会被自动创建；子目录用 relDir（如 album/2026-11）。
 */
export function saveDataUrl(dataUrl, baseDir, relDir, baseName) {
  const m = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i.exec(String(dataUrl || '').trim())
  if (!m) throw new Error('图片数据格式不正确')
  const mime = m[1].toLowerCase()
  const ext = extFromMime(mime)
  const buffer = Buffer.from(m[2], 'base64')
  const dir = path.join(baseDir, relDir)
  fs.mkdirSync(dir, { recursive: true })
  const fileName = `${baseName}.${ext}`
  fs.writeFileSync(path.join(dir, fileName), buffer)
  return {
    mime,
    bytes: buffer.length,
    width: jpegSize(buffer)?.width || 0,
    height: jpegSize(buffer)?.height || 0,
    filePath: path.posix.join(relDir.split(path.sep).join('/'), fileName),
  }
}

export function removeFile(baseDir, relPath) {
  if (!relPath) return
  const target = path.resolve(baseDir, relPath)
  if (!target.startsWith(path.resolve(baseDir) + path.sep)) return
  try {
    fs.unlinkSync(target)
  } catch {
    /* 文件已不存在，忽略 */
  }
}

export function safeName(input, fallback = 'photo') {
  const base = String(input || '')
    .normalize('NFKC')
    .replace(/[^\w\u4e00-\u9fa5-]+/g, '')
    .slice(0, 24)
  return base || fallback
}