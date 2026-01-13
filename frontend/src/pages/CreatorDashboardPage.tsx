import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Booking, Session } from '../types'
import './CreatorDashboardPage.css'
import { FaCalendarAlt, FaRupeeSign, FaClock, FaCreditCard, FaMoneyBillWave, FaTimes } from 'react-icons/fa'
import { CreatorSessionCalendar } from '../components/CreatorSessionCalendar'

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
  const [showCalendar, setShowCalendar] = useState(false)

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
  
  const bookingsForMySessions = useMemo(() => {
    const mySessionIds = new Set(mySessions.map(s => s.id))
    return bookings.filter(b => {
      const sessionId = typeof b.session === 'object' ? b.session.id : b.session
      return mySessionIds.has(sessionId)
    })
  }, [bookings, mySessions])

  const [meetLink, setMeetLink] = useState('')
  const bookingStats = useMemo(() => {
    const total = bookingsForMySessions.length
    const confirmed = bookingsForMySessions.filter(b => b.status === 'CONFIRMED').length
    const pending = bookingsForMySessions.filter(b => b.status === 'PENDING').length
    const cancelled = bookingsForMySessions.filter(b => b.status === 'CANCELLED').length
    const totalRevenue = bookingsForMySessions
      .filter(b => b.status === 'CONFIRMED' && b.amount_paid)
      .reduce((sum, b) => sum + parseFloat(b.amount_paid || '0'), 0)
    return { total, confirmed, pending, cancelled, totalRevenue }
  }, [bookingsForMySessions])

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

  async function deleteSession(sessionId: number) {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }
    try {
      await apiFetch(`/api/sessions/${sessionId}/`, { method: 'DELETE' })
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
      setNotice('Session deleted successfully.')
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Delete failed'
      setError(msg)
    }
  }

  async function updateSession(sessionId: number, updates: Partial<Session>) {
    try {
      const updated = await apiFetch<Session>(`/api/sessions/${sessionId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      })
      setSessions((prev) => prev.map((s) => (s.id === sessionId ? updated : s)))
      setNotice('Session updated successfully.')
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Update failed'
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
          <div className="meet-link-field">
            <label className="creator-form-label">Meet Link</label>
            <input
              className="creator-form-input"
              value={meetLink}
              onChange={(e) => setMeetLink(e.target.value)}
              placeholder="https://…"
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
            <Link to="/explore" className="creator-button creator-button-secondary">
              View Public Sessions
            </Link>
          </div>
        </form>
      </div>

      {/* Booking Overview Stats */}
      {mySessions.length > 0 && (
        <div className="creator-stats-section">
          <h2 className="creator-section-title">Booking Overview</h2>
          <div className="creator-stats-grid">
            <div className="creator-stat-card">
              <div className="creator-stat-value">{bookingStats.total}</div>
              <div className="creator-stat-label">Total Bookings</div>
            </div>
            <div className="creator-stat-card">
              <div className="creator-stat-value">{bookingStats.confirmed}</div>
              <div className="creator-stat-label">Confirmed</div>
            </div>
            <div className="creator-stat-card">
              <div className="creator-stat-value">{bookingStats.pending}</div>
              <div className="creator-stat-label">Pending</div>
            </div>
            <div className="creator-stat-card">
              <div className="creator-stat-value">₹{bookingStats.totalRevenue.toFixed(2)}</div>
              <div className="creator-stat-label">Total Revenue</div>
            </div>
          </div>
        </div>
      )}


      {/* My Sessions */}
      <div className="creator-sessions-section">
        <h2 className="creator-section-title">My Sessions ({mySessions.length})</h2>
        {mySessions.length === 0 ? (
          <div className="creator-empty-state">No sessions yet. Create your first session above!</div>
        ) : (
          <div className="creator-sessions-list">
            {mySessions.map((s) => (
              <div key={s.id} className="creator-session-item-wrapper">
                <Link to={`/sessions/${s.id}`} className="creator-session-item">
                  <div className="creator-session-content">
                    <div className="creator-session-title">{s.title}</div>
                    <div className="creator-session-meta">
                      {new Date(s.start_time).toLocaleString()}
                      {uploadingImage === s.id && <span style={{ marginLeft: '12px', color: '#0066ff' }}>Uploading image…</span>}
                    </div>
                  </div>
                  <div className="creator-session-price">₹ {s.price}</div>
                </Link>
                <div className="creator-session-actions">
                  <button
                    className="creator-action-btn creator-action-btn-edit"
                    onClick={() => {
                      const newTitle = prompt('Enter new title:', s.title)
                      if (newTitle && newTitle !== s.title) {
                        updateSession(s.id, { title: newTitle })
                      }
                    }}
                    title="Edit title"
                  >
                    ✏️
                  </button>
                  <button
                    className="creator-action-btn creator-action-btn-delete"
                    onClick={() => deleteSession(s.id)}
                    title="Delete session"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bookings */}
      <div className="creator-bookings-section">
        <h2 className="creator-section-title">Bookings on My Sessions ({bookingsForMySessions.length})</h2>
        {bookingsForMySessions.length === 0 ? (
          <div className="creator-empty-state">No bookings yet.</div>
        ) : (
          <div>
            {bookingsForMySessions.map((b) => {
              const session = typeof b.session === 'object' ? b.session : null
              return (
                <div key={b.id} className="creator-booking-item">
                  <div className="creator-booking-content-wrapper">
                    <div className="creator-booking-title">
                      {session ? (
                        <Link to={`/sessions/${session.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {session.title}
                        </Link>
                      ) : (
                        `Booking #${b.id}`
                      )}
                    </div>
                    <div className="creator-booking-meta">
                      {session && (
                        <>
                          <span><FaCalendarAlt style={{ marginRight: '6px' }} />{new Date(session.start_time).toLocaleString()}</span>
                          <span><FaRupeeSign style={{ marginRight: '6px' }} />₹{session.price}</span>
                        </>
                      )}
                      <span><FaClock style={{ marginRight: '6px' }} />Booked {new Date(b.created_at).toLocaleString()}</span>
                      {b.payment_status && (
                        <span><FaCreditCard style={{ marginRight: '6px' }} />Payment: {b.payment_status}</span>
                      )}
                      {b.amount_paid && (
                        <span><FaMoneyBillWave style={{ marginRight: '6px' }} />Amount: ₹{b.amount_paid}</span>
                      )}
                    </div>
                  </div>
                  <div className={`creator-booking-status ${b.status.toLowerCase()}`}>{b.status}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Floating Calendar Icon */}
      {mySessions.length > 0 && (
        <button 
          className="creator-floating-calendar-btn"
          onClick={() => setShowCalendar(true)}
          title="Open Calendar"
        >
          <FaCalendarAlt />
        </button>
      )}

      {/* Calendar Drawer Overlay */}
      {showCalendar && (
        <div className="creator-calendar-drawer-overlay" onClick={() => setShowCalendar(false)}>
          <div className="creator-calendar-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="creator-calendar-drawer-header">
              <h2>Session Calendar</h2>
              <button 
                className="creator-calendar-drawer-close"
                onClick={() => setShowCalendar(false)}
                title="Close Calendar"
              >
                <FaTimes />
              </button>
            </div>
            <div className="creator-calendar-drawer-content">
              <CreatorSessionCalendar sessions={mySessions} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

