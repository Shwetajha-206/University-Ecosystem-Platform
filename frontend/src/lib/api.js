/** Relative API base — Vite/nginx proxy keeps cookies same-origin in dev & prod */
export const API = 'https://university-ecosystem-backend.onrender.com/api'

let refreshPromise = null

async function silentRefresh() {
  if (!refreshPromise) {
    refreshPromise = fetch(`${API}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    }).finally(() => {
      refreshPromise = null
    })
  }
  return refreshPromise
}

/**
 * Fetch wrapper with credentials + automatic silent token refresh on 401.
 * Tokens live in HttpOnly cookies — never stored in localStorage.
 */
export function safeUrl(url) {
  if (typeof url !== 'string' || !url.trim()) return null
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') return parsed.href
  } catch { /* invalid */ }
  return null
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API}${path.startsWith('/') ? path : `/${path}`}`

  const headers = { ...options.headers }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (res.status === 401 && !options._retry && !path.includes('/auth/refresh')) {
    const refreshRes = await silentRefresh()
    if (refreshRes.ok) {
      return apiFetch(path, { ...options, _retry: true })
    }
  }

  return res
}

export async function apiJson(path, options = {}) {
  const res = await apiFetch(path, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err = new Error(data.message || 'Request failed')
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}
