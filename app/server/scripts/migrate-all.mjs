/**
 * 依次跑完所有结构迁移（幂等，重复执行安全）
 *
 * 用途：服务器上的库可能是很早的版本，缺 v17 / v18 / v19 加的字段。
 * deploy.sh / update.sh 都会调用它，然后再同步内容数据。
 *
 * 用法：node server/scripts/migrate-all.mjs
 */
import '../env.js'

const STEPS = ['migrate-v12.mjs', 'migrate-v17.mjs', 'migrate-v18.mjs', 'migrate-v19.mjs']

for (const file of STEPS) {
  console.log(`\n[migrate] ${file}`)
  try {
    await import(`./${file}`)
  } catch (error) {
    console.error(`[migrate] ${file} 失败：${error.message}`)
    process.exit(1)
  }
}

console.log('\n[migrate] 全部结构迁移完成')
process.exit(0)
