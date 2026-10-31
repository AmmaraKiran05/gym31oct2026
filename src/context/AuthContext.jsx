import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState('loading') // loading | ready | error
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    // No session hint cookie = never logged in here; skip the request (and a console 401).
    if (!document.cookie.split(';').some((c) => c.trim().startsWith('pf_auth='))) {
      setUser(null)
      setError(null)
      setStatus('ready')
      return
    }
    setStatus('loading')
    try {
      const { user } = await api('/auth/me')
      setUser(user)
      setError(null)
      setStatus('ready')
    } catch (err) {
      if (err.status === 401) {
        setUser(null)
        setError(null)
        setStatus('ready')
      } else {
        setError(err)
        setStatus('error')
      }
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const login = useCallback(async (email, password) => {
    const { user } = await api('/auth/login', { method: 'POST', body: { email, password } })
    setUser(user)
    setStatus('ready')
    return user
  }, [])

  const signup = useCallback(async (payload) => {
    const { user } = await api('/auth/signup', { method: 'POST', body: payload })
    setUser(user)
    setStatus('ready')
    return user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' })
    } finally {
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, status, error, refresh, login, signup, logout }}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export const firstName = (user) => user?.fullName?.split(/\s+/)[0] ?? ''
export const initials = (user) =>
  (user?.fullName ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
