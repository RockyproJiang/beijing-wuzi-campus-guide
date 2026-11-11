/**
 * 在原 manifest 基础上增量更新：
 *   - 去掉被切掉的原对象 楼29
 *   - 加上新对象 楼29_8号楼 / 楼29_医院（已在别处加过则跳过）
 * 注意：blend 里还能看到「追加楼04」旧名残留，确认 GLB 根节点里没有它。
 */
import fs from 'node:fs'

const P = 'public/models/manifest.json'
const nodes = JSON.parse(fs.readFileSync('docs/reference/_glb_nodes.json', 'utf8'))
const roots = nodes.roots

const manifest = JSON.parse(fs.readFileSync(P, 'utf8'))
const before = manifest.objects.length

const GONE = ['楼29']
const NEW = [
  { name: '楼29_8号楼', type: 'building' },
  { name: '楼29_医院', type: 'building' },
]

console.log('GLB 里与楼29相关：', roots.filter((n) => n.startsWith('楼29')).join(', '))
console.log('GLB 里的追加楼04：', roots.filter((n) => n.startsWith('追加楼04')).join(', '))

const kept = manifest.objects.filter((o) => !GONE.includes(o.name))
const names = new Set(kept.map((o) => o.name))
for (const item of NEW) {
  if (!names.has(item.name)) {
    kept.push(item)
    names.add(item.name)
  }
}
manifest.objects = kept
fs.writeFileSync(P, JSON.stringify(manifest))
console.log('count:', before, '->', kept.length)
console.log('加入：', NEW.map((x) => x.name).join(', '))