// 3D 模型与配套资源的版本号。
//
// public/models 下的文件由 express.static 以 immutable 缓存下发，
// 浏览器在缓存期内不会重新请求。每次替换 campus.glb / poster.webp /
// manifest.json 后，把下面的版本号改一下（例如日期或文件大小），
// 引用处会带上 ?v=xxx，从而绕过旧缓存。
export const MODEL_VERSION = '20261107-3925016'

export const MODEL_URL = `/models/campus.glb?v=${MODEL_VERSION}`
export const MANIFEST_URL = `/models/manifest.json?v=${MODEL_VERSION}`
export const POSTER_URL = `/models/poster.webp?v=${MODEL_VERSION}`