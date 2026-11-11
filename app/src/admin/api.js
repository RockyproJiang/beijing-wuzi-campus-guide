let unauthorizedHandler = null

export function onUnauthorized(handler) {
  unauthorizedHandler = handler
}

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export async function api(path, options = {}) {
  const { method = 'GET', body, headers = {}, signal } = options
  const requestHeaders = { ...headers }
  if (body !== undefined) requestHeaders['Content-Type'] = 'application/json'

  const res = await fetch('/api/admin' + path, {
    method,
    credentials: 'same-origin',
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { error: text || `请求失败（${res.status}）` }
  }

  if (!res.ok) {
    if (res.status === 401 && path !== '/login') unauthorizedHandler?.()
    throw new ApiError(data?.error || `请求失败（${res.status}）`, res.status, data?.details)
  }

  return data
}

export function formatTime(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function actionLabel(action) {
  const map = {
    login: '登录',
    login_failed: '登录失败',
    logout: '退出',
    create: '新增',
    update: '修改',
    delete: '删除',
    restore: '恢复',
    purge: '彻底删除',
    reorder: '排序',
    import: '导入',
    change_password: '修改密码',
  }
  return map[action] || action
}

export function entityLabel(entity) {
  const map = {
    auth: '账号',
    category: '分类',
    building: '建筑',
    calendar: '校历',
    tip: '提示',
    alias: '搜索别名',
    digital_campus: '数字校园',
    school_profile: '学校信息',
    submission: '位置投稿',
    site: '整站数据',
  }
  return map[entity] || entity
}
