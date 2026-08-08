import { useEffect, useState } from 'react'

/**
 * Persist non-URL UI state across browser refresh (tab-scoped).
 * Use for half-filled forms, open modals, scroll positions, etc.
 */
export function useSessionState(key, defaultValue) {
  const [state, setState] = useState(() => {
    try {
      const raw = sessionStorage.getItem(key)
      return raw != null ? JSON.parse(raw) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(state))
    } catch {
      // quota exceeded — ignore
    }
  }, [key, state])

  const clear = () => {
    sessionStorage.removeItem(key)
    setState(defaultValue)
  }

  return [state, setState, clear]
}

export function saveSessionDraft(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value))
}

export function loadSessionDraft(key, fallback = null) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw != null ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function clearSessionDraft(key) {
  sessionStorage.removeItem(key)
}
