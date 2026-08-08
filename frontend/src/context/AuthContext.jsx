import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { apiFetch, apiJson } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const hydrate = useCallback(async () => {
    try {
      const data = await apiJson('/auth/me')
      setUser(data.user)
      return data.user
    } catch {
      try {
        const refreshRes = await apiFetch('/auth/refresh', { method: 'POST' })
        if (refreshRes.ok) {
          const data = await refreshRes.json()
          setUser(data.user)
          return data.user
        }
      } catch {
        // session fully expired
      }
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    hydrate().finally(() => setLoading(false))
  }, [hydrate])

  const login = useCallback(async (email, password) => {
    const data = await apiJson('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (body) => {
    await apiJson('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    })
    return login(body.email, body.password)
  }, [login])

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  const updateUser = useCallback((updated) => {
    setUser(updated)
  }, [])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    hydrate,
    isAuthenticated: !!user,
  }), [user, loading, login, register, logout, updateUser, hydrate])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
