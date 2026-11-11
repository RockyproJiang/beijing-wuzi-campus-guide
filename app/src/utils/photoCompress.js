/**
 * 浏览器端图片压缩（相册 / 投稿用）
 * 规则（与用户确认）：
 *  - 目标 ≤ 1MB，尽量压到 ~750KB
 *  - 原图小于 700KB 时保持原样，不放大
 *  - 长边上限 2400px
 */

export const PHOTO_MAX_BYTES = 1024 * 1024
export const PHOTO_TARGET_BYTES = 750 * 1024
export const PHOTO_KEEP_BYTES = 700 * 1024
const MAX_EDGE = 2400

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片读取失败，请换一张试试'))
    }
    img.src = url
  })
}

function drawToCanvas(img, maxEdge) {
  let w = img.naturalWidth || img.width
  let h = img.naturalHeight || img.height
  const scale = Math.min(1, maxEdge / Math.max(w, h))
  w = Math.max(1, Math.round(w * scale))
  h = Math.max(1, Math.round(h * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingQuality = 'high'
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

function toBlob(canvas, quality) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality)
  })
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('图片编码失败'))
    reader.readAsDataURL(blob)
  })
}

/**
 * 压缩一张图片。
 * @returns {Promise<{dataUrl:string, blob:Blob, width:number, height:number,
 *   sizeBytes:number, origBytes:number, compressed:boolean}>}
 */
export async function compressPhoto(file, options = {}) {
  const target = options.target ?? PHOTO_TARGET_BYTES
  const keep = options.keep ?? PHOTO_KEEP_BYTES
  const max = options.max ?? PHOTO_MAX_BYTES

  if (!file || !file.type?.startsWith('image/')) {
    throw new Error('只支持图片文件')
  }

  const img = await loadImage(file)
  const origBytes = file.size

  // 小图（且格式可接受）直接原样使用
  if (origBytes <= keep && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return {
      dataUrl: await blobToDataUrl(file),
      blob: file,
      width: img.naturalWidth,
      height: img.naturalHeight,
      sizeBytes: origBytes,
      origBytes,
      compressed: false,
    }
  }

  let maxEdge = MAX_EDGE
  let best = null
  for (let round = 0; round < 4; round += 1) {
    const canvas = drawToCanvas(img, maxEdge)
    for (const quality of [0.86, 0.78, 0.7, 0.62, 0.54, 0.46]) {
      const blob = await toBlob(canvas, quality)
      if (!blob) continue
      if (!best || blob.size < best.blob.size) best = { blob, width: canvas.width, height: canvas.height }
      if (blob.size <= target) {
        return {
          dataUrl: await blobToDataUrl(blob),
          blob,
          width: canvas.width,
          height: canvas.height,
          sizeBytes: blob.size,
          origBytes,
          compressed: true,
        }
      }
    }
    maxEdge = Math.round(maxEdge * 0.78)
  }

  if (best && best.blob.size <= max) {
    return {
      dataUrl: await blobToDataUrl(best.blob),
      blob: best.blob,
      width: best.width,
      height: best.height,
      sizeBytes: best.blob.size,
      origBytes,
      compressed: true,
    }
  }
  throw new Error('这张图压缩后仍然超过 1MB，请换一张')
}

/** 生成缩略图 dataURL（列表用，约 420px） */
export async function makeThumbDataUrl(fileOrBlob, edge = 420) {
  const img = await loadImage(fileOrBlob)
  const canvas = drawToCanvas(img, edge)
  const blob = await toBlob(canvas, 0.72)
  return blob ? blobToDataUrl(blob) : ''
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}