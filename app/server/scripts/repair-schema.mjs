/**
 * 单独修一次库结构（不改任何数据）
 *
 * 服务器上如果发现「上传照片 / 投稿」报 500，多半是库结构比代码旧
 * （旧快照建的库缺 location_submissions 的 photo_* 那几列）。
 *
 * 用法（在 app 目录下）：
 *   npm run db:repair
 * 或：
 *   node server/scripts/repair-schema.mjs
 *
 * 服务启动时也会自动跑同一份逻辑（server/schema.js），
 * 这个脚本只是方便在不重启服务的情况下手动补一次。
 */
import '../env.js'
import { ensureSchema } from '../schema.js'
import { pool } from '../db.js'

const result = await ensureSchema()

if (result.applied.length) {
  console.log(`\n已补齐 ${result.applied.length} 项：`)
  for (const item of result.applied) console.log(`  · ${item}`)
} else {
  console.log('\n没有需要补的项，表结构已是最新')
}

if (result.failed.length) {
  console.error(`\n有 ${result.failed.length} 项补失败了：`)
  for (const f of result.failed) console.error(`  · ${f.item}：${f.error}`)
  console.error('\n如果提示权限不足，请用 root 账号执行一次：')
  console.error('  mysql -uroot -p -e "ALTER TABLE location_submissions ADD COLUMN ..."')
}

await pool.end()
process.exit(result.failed.length ? 1 : 0)
