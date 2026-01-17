import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Booking, Session } from '../types'
import './CreatorDashboardPage.css'

function minutesToDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const hh = String(h).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  return `${hh}:${mm}:00`
}

export function CreatorDashboardPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()

  const [sessions, setSessions] = useState<Session[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('499.00')
  const [image, setImage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [startTime, setStartTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [uploadingImage, setUploadingImage] = useState<number | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        const [allSessions, creatorBookings] = await Promise.all([
          apiFetch<Session[]>('/api/sessions/', { method: 'GET' }, { skipAuth: true }),
          apiFetch<Booking[]>('/api/bookings/', { method: 'GET' }),
        ])
        if (!mounted) return
        setSessions(allSessions)
        setBookings(creatorBookings)
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

  const mySessions = useMemo(() => sessions.filter((s) => s.creator === user?.id), [sessions, user?.id])

  async function createSession(e: FormEvent) {
    e.preventDefault()
    setNotice(null)
    setError(null)

    try {
      if (!startTime) throw new Error('Start time is required')
      const startIso = new Date(startTime).toISOString()
      const duration = minutesToDuration(durationMinutes)

      const created = await apiFetch<Session>('/api/sessions/', {
        method: 'POST',
        body: JSON.stringify({ title, description, price, image, start_time: startIso, duration }),
      })
      setSessions((prev) => [created, ...prev])
      setNotice('Session created.')

      // Upload image file if provided
      if (imageFile && created.id) {
        setUploadingImage(created.id)
        try {
          const formData = new FormData()
          formData.append('image', imageFile)

          const updated = await apiFetch<Session>(`/api/sessions/${created.id}/upload_image/`, {
            method: 'POST',
            body: formData,
          })

          setSessions((prev) => prev.map((s) => (s.id === created.id ? updated : s)))
          setNotice('Session created and image uploaded.')
        } catch (uploadError) {
          const msg =
            uploadError && typeof uploadError === 'object' && 'message' in uploadError
              ? String((uploadError as any).message)
              : 'Image upload failed'
          setNotice(`Session created, but image upload failed: ${msg}`)
        } finally {
          setUploadingImage(null)
        }
      }

      setTitle('')
      setDescription('')
      setImage('')
      setImageFile(null)
    } catch (e2) {
      const msg = e2 && typeof e2 === 'object' && 'message' in e2 ? String((e2 as any).message) : 'Create failed'
      setError(msg)
    }
  }

  return (
    <div className="creator-dashboard-modern">
      {/* Header Section */}
      <div className="creator-header-section">
        <button className="creator-back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <h1 className="creator-title">Creator Dashboard</h1>
        <p className="creator-subtitle">Create sessions and manage your bookings</p>
      </div>

      {/* Alert Messages */}
      {isLoading && <div className="creator-alert creator-alert-info">Loading…</div>}
      {error && <div className="creator-alert creator-alert-error">Error: {error}</div>}
      {notice && <div className="creator-alert creator-alert-success">{notice}</div>}

      {/* Create Session Form */}
      <div className="creator-form-section">
        <h2 className="creator-form-title">Create a Session</h2>
        <form onSubmit={createSession}>
          <div className="creator-form-field">
            <label className="creator-form-label">Title</label>
            <input
              className="creator-form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Enter session title"
            />
          </div>

          <div className="creator-form-field">
            <label className="creator-form-label">Description</label>
            <textarea
              className="creator-form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Describe your session"
            />
          </div>

          <div className="creator-form-row">
            <div className="creator-form-field">
              <label className="creator-form-label">Price (₹)</label>
              <input
                className="creator-form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                inputMode="decimal"
                required
                placeholder="499.00"
              />
            </div>

            <div className="creator-form-field">
              <label className="creator-form-label">Duration (minutes)</label>
              <input
                className="creator-form-input"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                type="number"
                min={15}
                step={15}
                required
              />
            </div>
          </div>

          <div className="creator-form-field">
            <label className="creator-form-label">Start time</label>
            <input
              className="creator-form-input"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              type="datetime-local"
              required
            />
          </div>

          <div className="creator-form-field">
            <label className="creator-form-label">Image URL (optional)</label>
            <input
              className="creator-form-input"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="https://…"
            />
            <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
              Or upload an image file below
            </small>
          </div>

          <div className="creator-form-field">
            <label className="creator-form-label">Upload Image File (optional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  setImageFile(file)
                  if (image) setImage('')
                }
              }}
              style={{ padding: '8px', fontSize: '14px' }}
            />
            {imageFile && (
              <small style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
                Selected: {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
              </small>
            )}
          </div>

          <div className="creator-form-actions">
            <button className="creator-button creator-button-primary" type="submit">
              Create Session
            </button>
            <Link to="/" className="creator-button creator-button-secondary">
              View Public Sessions
            </Link>
          </div>
        </form>
      </div>

      {/* My Sessions */}
      <div className="creator-sessions-section">
        <h2 className="creator-section-title">My Sessions ({mySessions.length})</h2>
        {mySessions.length === 0 ? (
          <div className="creator-empty-state">No sessions yet. Create your first session above!</div>
        ) : (
          <div className="creator-sessions-list">
            {mySessions.map((s) => (
              <Link key={s.id} to={`/sessions/${s.id}`} className="creator-session-item">
                <div className="creator-session-content">
                  <div className="creator-session-title">{s.title}</div>
                  <div className="creator-session-meta">
                    {new Date(s.start_time).toLocaleString()}
                    {uploadingImage === s.id && <span style={{ marginLeft: '12px', color: '#0066ff' }}>Uploading image…</span>}
                  </div>
                </div>
                <div className="creator-session-price">₹ {s.price}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div className="creator-bookings-section">
        <h2 className="creator-section-title">Bookings on My Sessions ({bookings.length})</h2>
        {bookings.length === 0 ? (
          <div className="creator-empty-state">No bookings yet.</div>
        ) : (
          <div>
            {bookings.map((b) => (
              <div key={b.id} className="creator-booking-item">
                <div className="creator-booking-title">
                  Booking #{b.id}
                  {typeof b.session === 'object' ? ` - ${b.session.title}` : ''}
                </div>
                <div className="creator-booking-meta">
                  {typeof b.session === 'object' ? (
                    <>
                      Session: {b.session.title} • Created {new Date(b.created_at).toLocaleString()}
                      {b.payment_status && (
                        <>
                          <br />
                          Payment: {b.payment_status}
                          {b.amount_paid && ` (₹${b.amount_paid})`}
                        </>
                      )}
                    </>
                  ) : (
                    <>Session {b.session} • {new Date(b.created_at).toLocaleString()}</>
                  )}
                </div>
                <div className={`creator-booking-status ${b.status.toLowerCase()}`}>{b.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
