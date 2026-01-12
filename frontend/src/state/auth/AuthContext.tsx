import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '../../types'

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000'

function joinUrl(base: string, path: string) {
  const b = base.endsWith('/') ? base.slice(0, -1) : base
  const p = path.startsWith('/') ? path : `/${path}`
  return `${b}${p}`
}

async function safeJson(res: Response) {
  const contentType = res.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return null
  try {
    return await res.json()
  } catch {
    return null
  }
}

type LoginResponse = { access: string; refresh: string }
type RefreshResponse = { access: string }
type GoogleLoginResponse = { access: string; refresh: string; user: User }
type GitHubLoginResponse = { access: string; refresh: string; user: User }
type RegisterResponse = { access: string; refresh: string; user: User; message?: string }

type ApiError = { status: number; message: string; details?: unknown }

type AuthContextValue = {
  user: User | null
  isLoading: boolean
  accessToken: string | null
  refreshToken: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: { name: string; email: string; password: string; avatar?: string }) => Promise<void>
  googleLogin: (credential: string) => Promise<User>
  githubLogin: (code: string) => Promise<User>
  logout: () => void
  apiFetch: <T = unknown>(
    path: string,
    init?: RequestInit,
    opts?: { skipAuth?: boolean },
  ) => Promise<T>
  refreshSession: () => Promise<boolean>
  updateProfile: (data: { name?: string; avatar?: string }) => Promise<User>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY))
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(REFRESH_TOKEN_KEY))

  function persistTokens(nextAccess: string | null, nextRefresh: string | null) {
    setAccessToken(nextAccess)
    setRefreshToken(nextRefresh)
    if (nextAccess) localStorage.setItem(ACCESS_TOKEN_KEY, nextAccess)
    else localStorage.removeItem(ACCESS_TOKEN_KEY)
    if (nextRefresh) localStorage.setItem(REFRESH_TOKEN_KEY, nextRefresh)
    else localStorage.removeItem(REFRESH_TOKEN_KEY)
  }

  function logout() {
    persistTokens(null, null)
    setUser(null)
  }

  async function refreshSession(): Promise<boolean> {
    if (!refreshToken) return false
    const res = await fetch(joinUrl(API_BASE_URL, '/api/auth/token/refresh/'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh: refreshToken }),
    })
    if (!res.ok) {
      logout()
      return false
    }
    const data = (await res.json()) as RefreshResponse
    persistTokens(data.access, refreshToken)
    return true
  }

  async function apiFetch<T = unknown>(
    path: string,
    init: RequestInit = {},
    opts: { skipAuth?: boolean } = {},
  ): Promise<T> {
    const headers = new Headers(init.headers)
    // Set Content-Type to application/json if body exists and is not FormData
    if (init.body && !headers.has('Content-Type')) {
      if (init.body instanceof FormData) {
        // Don't set Content-Type for FormData, browser will set it with boundary
      } else {
        headers.set('Content-Type', 'application/json')
      }
    }
    if (!opts.skipAuth && accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

    const doFetch = () => fetch(joinUrl(API_BASE_URL, path), { ...init, headers })

    let res = await doFetch()
    if (res.status === 401 && !opts.skipAuth) {
      const refreshed = await refreshSession()
      if (refreshed) {
        headers.set('Authorization', `Bearer ${localStorage.getItem(ACCESS_TOKEN_KEY) ?? ''}`)
        res = await doFetch()
      }
    }

    if (!res.ok) {
      const body = await safeJson(res)
      const message =
        (body && typeof body === 'object' && body !== null && 'detail' in body && typeof body.detail === 'string'
          ? body.detail
          : null) ?? `Request failed (${res.status})`
      const err: ApiError = { status: res.status, message, details: body }
      throw err
    }

    const body = await safeJson(res)
    return body as T
  }

  async function fetchMe() {
    const me = await apiFetch<User>('/api/users/me/', { method: 'GET' })
    setUser(me)
  }

  async function updateProfile(data: { name?: string; avatar?: string }) {
    const updated = await apiFetch<User>('/api/users/me/', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    setUser(updated)
    return updated
  }

  async function login(email: string, password: string) {
    const data = await apiFetch<LoginResponse>(
      '/api/auth/token/',
      { method: 'POST', body: JSON.stringify({ email, password }) },
      { skipAuth: true },
    )
    persistTokens(data.access, data.refresh)
    await fetchMe()
  }

  async function googleLogin(credential: string): Promise<User> {
    const data = await apiFetch<GoogleLoginResponse>(
      '/api/users/google-login/',
      { method: 'POST', body: JSON.stringify({ credential }) },
      { skipAuth: true },
    )
    persistTokens(data.access, data.refresh)
    setUser(data.user)
    return data.user
  }

  async function githubLogin(code: string): Promise<User> {
    const data = await apiFetch<GitHubLoginResponse>(
      '/api/users/github-login/',
      { method: 'POST', body: JSON.stringify({ code }) },
      { skipAuth: true },
    )
    persistTokens(data.access, data.refresh)
    setUser(data.user)
    return data.user
  }

  async function register(input: { name: string; email: string; password: string; avatar?: string }) {
    const data = await apiFetch<RegisterResponse>(
      '/api/users/register/',
      { method: 'POST', body: JSON.stringify(input) },
      { skipAuth: true },
    )
    persistTokens(data.access, data.refresh)
    setUser(data.user)
  }

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        if (accessToken) await fetchMe()
      } catch {
        // If access is stale, try refresh once.
        const ok = await refreshSession()
        if (ok) {
          try {
            await fetchMe()
          } catch {
            logout()
          }
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    })()
    return () => {
      isMounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      accessToken,
      refreshToken,
      login,
      register,
      googleLogin,
      githubLogin,
      logout,
      apiFetch,
      refreshSession,
      updateProfile,
    }),
    [user, isLoading, accessToken, refreshToken, login, register, googleLogin, githubLogin, logout, apiFetch, refreshSession, updateProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}

