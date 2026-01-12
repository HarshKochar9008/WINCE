import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Session } from '../types'

function formatMoney(amount: string) {
  const n = Number(amount)
  if (Number.isFinite(n)) return n.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
  return amount
}

export function HomePage() {
  const { apiFetch } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        const data = await apiFetch<Session[]>('/api/sessions/', { method: 'GET' }, { skipAuth: true })
        if (mounted) setSessions(data)
      } catch (e) {
        const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Failed to load'
        if (mounted) setError(msg)
      } finally {
        if (mounted) setIsLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [apiFetch])

  const cards = useMemo(
    () =>
      sessions.map((s) => (
        <Link key={s.id} to={`/sessions/${s.id}`} className="card session-card">
          {(s.image_url || s.image) && (
            <img
              src={s.image_url || s.image}
              alt={s.title}
              style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px 4px 0 0' }}
            />
          )}
          <div className="session-card__top">
            <div>
              <div className="h3">{s.title}</div>
              <div className="muted">{new Date(s.start_time).toLocaleString()}</div>
            </div>
            <div className="pill">{formatMoney(s.price)}</div>
          </div>
          {s.description ? <p className="muted clamp-2">{s.description}</p> : null}
        </Link>
      )),
    [sessions],
  )

  return (
    <div className="stack">
      <div className="page-header">
        <div>
          <h1>Sessions</h1>
          <p className="muted">Browse upcoming sessions. Login to book and see your dashboard.</p>
        </div>
      </div>

      {isLoading ? <div className="card">Loading sessions…</div> : null}
      {error ? <div className="card error">Error: {error}</div> : null}

      <div className="grid">{cards}</div>
    </div>
  )
}

