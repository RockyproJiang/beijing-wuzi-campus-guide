import * as THREE from 'three'

/**
 * 保留草坪原来的几何形状/范围，只把材质换成纯色、无纹理、无阴影的简单材质。
 * 这样不会改变草坪面积，也不会再有草坪纹理或自阴影造成的闪烁。
 */
export function applySimpleGrass(scene, model) {
  if (!scene || !model) return

  // 兼容之前版本可能残留的矩形草坪平面
  const oldPlane = scene.getObjectByName('__simple_grass')
  if (oldPlane) {
    scene.remove(oldPlane)
    oldPlane.geometry?.dispose()
    oldPlane.material?.dispose()
  }

  const material = new THREE.MeshBasicMaterial({
    color: 0x819762,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  // 草坪整片铺在校区内、和湖面/铺装只差几厘米，不推开就会互相抢深度（相机一动就闪）。
  // 让草坪在深度上「往后退」，保证湖面、铺装、人行道永远压在它上面。
  const grassDepth = material.clone()
  grassDepth.depthTest = true
  grassDepth.depthWrite = true
  grassDepth.side = THREE.DoubleSide

  model.traverse((obj) => {
    if (!obj.isMesh) return
    // 水面也一样：它贴着草坪，往「卡」的方向推一点，才能稳定盖住草地
    if (/^湖/.test(obj.name)) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of mats) {
        if (!m) continue
        m.polygonOffset = false
        m.depthWrite = false
        m.needsUpdate = true
      }
      obj.castShadow = false
      return
    }
    if (!/^绿化/.test(obj.name)) return
    obj.material = grassDepth
    obj.castShadow = false
    obj.receiveShadow = false
  })

  // Campus3D 之后还会对「扁平地面」统一套 polygonOffset(+1)，
  // 那会把草坪和水面的偏移覆盖掉，所以这里再补一遍，保证草坪退后、水面靠前。
  model.traverse((obj) => {
    if (!obj.isMesh) return
    if (/^绿化/.test(obj.name)) {
      obj.material = grassDepth
      obj.userData.grassDepth = true
    } else if (/^湖/.test(obj.name)) {
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
      for (const m of mats) {
        if (!m) continue
        m.polygonOffset = false
        m.depthWrite = false
      }
      obj.userData.lakeDepth = true
    }
  })
}
