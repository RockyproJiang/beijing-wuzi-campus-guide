/**
 * 表面贴片几何：编辑器和前台共用同一套计算。
 *
 * 贴片就是一块「平面矩形」，用中心点 position + 法线 normal + 面内 UP 轴 uAxis 描述，
 * 再叠加 size / rot / cut，这样调整参数时不需要重建轮廓点，天生的旋转缩放就都成立。
 *
 *  - size：矩形原始宽高（米）
 *  - rot ：在贴片平面内旋转的角度（度），顺时针为正
 *  - cut ：半栋刀口。angle=刀口方向（度，0=沿贴片竖直方向切，正角度把刀口向右倾斜），
 *          offset=刀口相对贴片中心的垂直距离（米）。
 *          mode='split' 时一刀两块，返回两个矩形（正侧/负侧）；mode='half' 只返回正侧那块。
 */
import * as THREE from 'three'

const DEG = Math.PI / 180

function toVec(v, fallback) {
  if (!v) return fallback.clone()
  const out = new THREE.Vector3(Number(v.x) || 0, Number(v.y) || 0, Number(v.z) || 0)
  return out.lengthSq() < 1e-9 ? fallback.clone() : out.normalize()
}

/** 由中心 + 法线 + 面内上方向，算出贴片所在平面的完整坐标系 */
export function patchBasis(point) {
  const pos = new THREE.Vector3(
    Number(point?.position?.x) || 0,
    Number(point?.position?.y) || 0,
    Number(point?.position?.z) || 0,
  )
  const normal = toVec(point?.normal, new THREE.Vector3(0, 1, 0))

  // 贴片自身的 UP 轴：优先取存的 uAxis，否则用世界 Y 往平面里投影
  let vAxis = null
  const saved = point?.uAxis ? toVec(point.uAxis, null) : null
  if (saved) {
    // 去掉法线分量，保证与法线正交
    vAxis = saved.clone().addScaledVector(normal, -saved.dot(normal))
  }
  if (!vAxis || vAxis.lengthSq() < 1e-6) {
    const world = Math.abs(normal.y) > 0.9 ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0)
    vAxis = world.clone().addScaledVector(normal, -world.dot(normal))
  }
  if (vAxis.lengthSq() < 1e-6) vAxis = new THREE.Vector3(1, 0, 0)
  vAxis.normalize()

  // 面内 RIGHT 轴：从外面看过去 r 在右手边（v × n）
  const rAxis = new THREE.Vector3().crossVectors(vAxis, normal).normalize()
  // 重新正交化 v，防止浮点误差
  const up = new THREE.Vector3().crossVectors(normal, rAxis).normalize()
  return { pos, normal, right: rAxis, up }
}

/** 取贴片矩形尺寸（圆的直径也折算进来） */
export function patchSize(point) {
  let w = Number(point?.size?.width)
  let h = Number(point?.size?.height)
  if (!Number.isFinite(w) || w <= 0) w = Number(point?.width)
  if (!Number.isFinite(h) || h <= 0) h = Number(point?.height)
  if (point?.shape === 'circle') {
    const d = Math.max(1, Number(point?.radius) || 10) * 2
    if (!Number.isFinite(w) || w <= 0) w = d
    if (!Number.isFinite(h) || h <= 0) h = d
  }
  if (!Number.isFinite(w) || w <= 0) w = 20
  if (!Number.isFinite(h) || h <= 0) h = 12
  // 同时给出 w/h 与 width/height 两套键名：编辑器里两种写法都有调用点
  return { w, h, width: w, height: h }
}

/**
 * 求矩形被「刀口直线」切开后的某一块。
 * 刀口在贴片局部坐标 (u 向右, v 向上) 里是一条过的直线：
 *   方向 dir=(sin a, cos a)，法向 nrm=(cos a, -sin a)，到中心的有符号距离 s = offset
 * 取 s >= offset 的那块（正侧）。
 */
function cutRect(w, h, angleDeg, offset) {
  const a = angleDeg * DEG
  const dir = { u: Math.sin(a), v: Math.cos(a) }
  const nrm = { u: Math.cos(a), v: -Math.sin(a) }
  const hw = w / 2
  const hh = h / 2
  const corners = [
    { u: -hw, v: -hh },
    { u: hw, v: -hh },
    { u: hw, v: hh },
    { u: -hw, v: hh },
  ]
  const dist = corners.map((c) => c.u * nrm.u + c.v * nrm.v - offset)
  const poly = []
  for (let i = 0; i < 4; i++) {
    const p = corners[i]
    const q = corners[(i + 1) % 4]
    const dp = dist[i]
    const dq = dist[(i + 1) % 4]
    if (dp >= 0) poly.push({ ...p })
    if ((dp >= 0) !== (dq >= 0)) {
      const t = dp / (dp - dq)
      poly.push({ u: p.u + (q.u - p.u) * t, v: p.v + (q.v - p.v) * t })
    }
  }
  if (poly.length < 3) return null
  // 用多边形在刀口方向上的范围反推这块的包围尺寸与中心
  let uMin = Infinity, uMax = -Infinity, vMin = Infinity, vMax = -Infinity
  let luMin = Infinity, luMax = -Infinity, lvMin = Infinity, lvMax = -Infinity
  for (const pt of poly) {
    // 沿刀口方向
    const lu = pt.u * dir.u + pt.v * dir.v
    const lv = pt.u * nrm.u + pt.v * nrm.v
    if (lu < luMin) luMin = lu
    if (lu > luMax) luMax = lu
    if (lv < lvMin) lvMin = lv
    if (lv > lvMax) lvMax = lv
    if (pt.u < uMin) uMin = pt.u
    if (pt.u > uMax) uMax = pt.u
    if (pt.v < vMin) vMin = pt.v
    if (pt.v > vMax) vMax = pt.v
  }
  // 这块的中心，在原始 (u,v) 里 = 刀口坐标系中心往回转
  const cLu = (luMin + luMax) / 2
  const cLv = (lvMin + lvMax) / 2
  const cu = cLu * dir.u + cLv * nrm.u
  const cv = cLu * dir.v + cLv * nrm.v
  return {
    // 这块在刀口坐标系里的尺寸，外层仍按「原矩形尺寸」描述，方便两个半块共用同一组参数
    centerU: cu,
    centerV: cv,
    poly,
  }
}

/**
 * 计算一块贴片的世界包围矩形。
 * 返回 { center, right, up, width, height, corners, poly2d }，其中 poly2d 是真实轮廓
 * （只有半栋/整面被切过时才不是矩形），用于画边框。
 */
export function patchRect(point) {
  const { pos, normal, right, up } = patchBasis(point)
  const { w, h } = patchSize(point)
  const rot = (Number(point?.rot) || 0) * DEG

  // 面内旋转后的两个轴
  const r2 = right.clone().multiplyScalar(Math.cos(rot)).addScaledVector(up, -Math.sin(rot)).normalize()
  const u2 = up.clone().multiplyScalar(Math.cos(rot)).addScaledVector(right, Math.sin(rot)).normalize()

  const cut = point?.cut
  const hasCut = cut && Number.isFinite(Number(cut.angle)) && Number.isFinite(Number(cut.offset))
  let angle = hasCut ? Number(cut.angle) : 0
  let offset = hasCut ? Number(cut.offset) : 0
  // 半栋的另一半：法线翻转 180°、偏移取反，等价于取刀口的负侧
  if (hasCut && cut.side === 'neg') {
    angle += 180
    offset = -offset
  }

  const local = (u, v) => pos.clone().addScaledVector(r2, u).addScaledVector(u2, v)

  let corners
  let poly2d = null
  if (hasCut) {
    const piece = cutRect(w, h, angle, offset)
    if (piece) {
      poly2d = piece.poly
      corners = piece.poly.map((pt) => local(pt.u, pt.v))
    }
  }
  if (!corners) {
    corners = [
      local(-w / 2, -h / 2),
      local(w / 2, -h / 2),
      local(w / 2, h / 2),
      local(-w / 2, h / 2),
    ]
  }

  // 包围盒（在贴片坐标系里）
  const rel = corners.map((c) => ({
    u: c.clone().sub(pos).dot(r2),
    v: c.clone().sub(pos).dot(u2),
  }))
  const uMin = Math.min(...rel.map((p) => p.u))
  const uMax = Math.max(...rel.map((p) => p.u))
  const vMin = Math.min(...rel.map((p) => p.v))
  const vMax = Math.max(...rel.map((p) => p.v))

  return {
    center: pos,
    quadCenter: pos.clone().addScaledVector(r2, (uMin + uMax) / 2).addScaledVector(u2, (vMin + vMax) / 2),
    normal,
    right: r2,
    up: u2,
    width: Math.max(0.05, uMax - uMin),
    height: Math.max(0.05, vMax - vMin),
    corners,
    poly2d,
  }
}

/** 由一组 (u,v) 局部点 + 贴片坐标系，生成可直接放到 scene 里的 THREE.ShapeGeometry */
export function shapeGeometryFromUv(uvPoints, { right, up }) {
  const shape = new THREE.Shape()
  uvPoints.forEach((p, i) => {
    // ShapeGeometry 在 XY 平面，x=u, y=v
    if (i === 0) shape.moveTo(p.u, -p.v)
    else shape.lineTo(p.u, -p.v)
  })
  shape.closePath()
  const geo = new THREE.ShapeGeometry(shape)
  // ShapeGeometry 的 (x,y) 就是 (right, -up)，绕一下成为正确朝向
  const m = new THREE.Matrix4().makeBasis(right, up, new THREE.Vector3().crossVectors(right, up))
  geo.applyMatrix4(m)
  return geo
}

/** 把正侧/负侧两块「半栋」都算出来，给编辑器的预览用 */
export function patchHalfPair(point) {
  const cut = point?.cut || { angle: 0, offset: 0 }
  const a = patchRect(point)
  // 负侧：把 offset 取反并旋转 180°，等价于取另一侧
  const flipped = { ...point, cut: { angle: Number(cut.angle) + 180, offset: -Number(cut.offset) } }
  const b = patchRect(flipped)
  return { positive: a, negative: b, base: a }
}

export { DEG }