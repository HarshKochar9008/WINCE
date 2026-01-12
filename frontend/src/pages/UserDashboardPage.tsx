import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Booking } from '../types'
import { AvatarSelector } from '../components/AvatarSelector'
import './UserDashboardPage.css'

export function UserDashboardPage() {
  const navigate = useNavigate()
  const { user, apiFetch, updateProfile } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileName, setProfileName] = useState(user?.name || '')
  const [profileAvatar, setProfileAvatar] = useState(user?.avatar || '/Avatar/Avatar 1.png')
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setProfileName(user.name)
      setProfileAvatar(user.avatar || '/Avatar/Avatar 1.png')
    }
  }, [user])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        const data = await apiFetch<Booking[]>('/api/bookings/', { method: 'GET' })
        if (mounted) setBookings(data)
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

  const { activeBookings, pastBookings } = useMemo(() => {
    const now = new Date()
    const active: Booking[] = []
    const past: Booking[] = []

    bookings.forEach((b) => {
      const session = typeof b.session === 'object' ? b.session : null
      if (session && new Date(session.start_time) > now) {
        active.push(b)
      } else {
        past.push(b)
      }
    })

    return { activeBookings: active, pastBookings: past }
  }, [bookings])

  // Calculate progress (sessions completed vs total)
  const progressDay = Math.min(activeBookings.length + pastBookings.length, 14)
  const progressTotal = 14

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault()
    setProfileError(null)
    setProfileLoading(true)
    try {
      await updateProfile({ name: profileName, avatar: profileAvatar })
      setIsEditingProfile(false)
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Update failed'
      setProfileError(msg)
    } finally {
      setProfileLoading(false)
    }
  }

  function formatSessionTitle(booking: Booking) {
    const session = typeof booking.session === 'object' ? booking.session : null
    return session ? session.title : `Session #${booking.session}`
  }

  function getSessionStartTime(booking: Booking) {
    const session = typeof booking.session === 'object' ? booking.session : null
    return session ? new Date(session.start_time) : null
  }

  return (
    <div className="dashboard-modern">
      
      <div className="dashboard-header-section">
        <button className="dashboard-back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="dashboard-progress">Day {progressDay} of {progressTotal}</div>
        <h1 className="dashboard-title">Your Journey</h1>
        <div className="dashboard-header-actions">
          <button className="dashboard-start-button" onClick={() => navigate('/')}>
            Start
          </button>
          <a href="#" className="dashboard-watch-link" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            Explore sessions
          </a>
        </div>
      </div>

      <div className="dashboard-features">
        <Link to="/" className="dashboard-feature-card peach">
          <div className="dashboard-feature-icon">
            <img src="/images/Boat.png" alt="Staying on track" />
          </div>
          <div className="dashboard-feature-text">Staying on track</div>
        </Link>
        <Link to="/" className="dashboard-feature-card lavender">
          <div className="dashboard-feature-icon">
            <img src="/images/Bird2.png" alt="Calming Flight Anxiety" />
          </div>
          <div className="dashboard-feature-text">Calming Flight Anxiety</div>
        </Link>
        <Link to="/" className="dashboard-feature-card blue">
          <div className="dashboard-feature-icon">
            <img src="/images/Whale.png" alt="Deep sleep" />
          </div>
          <div className="dashboard-feature-text">Deep sleep</div>
        </Link>
      </div>

      {/* Stats Section */}
      <div className="dashboard-stats-grid">
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{activeBookings.length}</div>
          <div className="dashboard-stat-label">Active Bookings</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{pastBookings.length}</div>
          <div className="dashboard-stat-label">Completed</div>
        </div>
        <div className="dashboard-stat-card">
          <div className="dashboard-stat-value">{bookings.length}</div>
          <div className="dashboard-stat-label">Total Sessions</div>
        </div>
      </div>

      {/* <div className="dashboard-profile-section">
        <div className="dashboard-profile-header">
          <h2 className="dashboard-section-title">Profile</h2>
          {!isEditingProfile && (
            <button className="dashboard-action-button" onClick={() => setIsEditingProfile(true)}>
              Edit
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#475569' }}>Name</span>
              <input
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                required
                disabled={profileLoading}
                style={{
                  padding: '10px 12px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <AvatarSelector selectedAvatar={profileAvatar || '/Avatar/Avatar 1.png'} onSelectAvatar={setProfileAvatar} />
            </div>

            {profileError ? <div style={{ color: '#dc2626', fontSize: '14px' }}>Error: {profileError}</div> : null}

            <div className="dashboard-quick-actions">
              <button className="dashboard-action-button primary" type="submit" disabled={profileLoading}>
                {profileLoading ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                className="dashboard-action-button"
                type="button"
                onClick={() => {
                  setIsEditingProfile(false)
                  setProfileError(null)
                  if (user) {
                    setProfileName(user.name)
                    setProfileAvatar(user.avatar)
                  }
                }}
                disabled={profileLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="dashboard-profile-content">
            <div className="dashboard-profile-avatar">
              {user?.avatar ? (
                <img src={user.avatar.startsWith('/') ? user.avatar : `/${user.avatar}`} alt="Avatar" />
              ) : (
                <img src="/Avatar/Avatar 1.png" alt="Default Avatar" />
              )}
            </div>
            <div className="dashboard-profile-info">
              <div className="dashboard-profile-name">{user?.name || 'Not set'}</div>
              <div className="dashboard-profile-email">{user?.email}</div>
              <div className="dashboard-profile-role">{user?.role}</div>
            </div>
          </div>
        )}
      </div> */}

      {activeBookings.length > 0 && (
        <div className="dashboard-bookings-section">
          <h2 className="dashboard-section-title">Active Bookings</h2>
          {isLoading ? (
            <div className="dashboard-empty-state">Loading bookings…</div>
          ) : error ? (
            <div className="dashboard-empty-state" style={{ color: '#dc2626' }}>Error: {error}</div>
          ) : (
            <div className="dashboard-bookings-list">
              {activeBookings.map((b) => {
                const startTime = getSessionStartTime(b)
                return (
                  <div key={b.id} className="dashboard-booking-item">
                    <div className="dashboard-booking-content">
                      <div className="dashboard-booking-title">{formatSessionTitle(b)}</div>
                      <div className="dashboard-booking-meta">
                        {startTime && <span>📅 {startTime.toLocaleString()}</span>}
                        <span>🕐 Created {new Date(b.created_at).toLocaleDateString()}</span>
                        {b.payment_status && <span>💳 {b.payment_status}</span>}
                      </div>
                    </div>
                    <div className={`dashboard-booking-status ${b.status.toLowerCase()}`}>{b.status}</div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
      {pastBookings.length > 0 && (
        <div className="dashboard-bookings-section">
          <h2 className="dashboard-section-title">Past Bookings</h2>
          <div className="dashboard-bookings-list">
            {pastBookings.map((b) => {
              const startTime = getSessionStartTime(b)
              return (
                <div key={b.id} className="dashboard-booking-item">
                  <div className="dashboard-booking-content">
                    <div className="dashboard-booking-title">{formatSessionTitle(b)}</div>
                    <div className="dashboard-booking-meta">
                      {startTime && <span>📅 {startTime.toLocaleString()}</span>}
                      <span>🕐 Created {new Date(b.created_at).toLocaleDateString()}</span>
                      {b.payment_status && <span>💳 {b.payment_status}</span>}
                    </div>
                  </div>
                  <div className={`dashboard-booking-status ${b.status.toLowerCase()}`}>{b.status}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
      {bookings.length === 0 && !isLoading && (
        <div className="dashboard-empty-state">
          <h3>No bookings yet</h3>
          <p>Start exploring and book your first session!</p>
          <Link to="/" className="dashboard-action-button primary" style={{ marginTop: '16px', display: 'inline-block' }}>
            Browse Sessions
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="dashboard-quick-actions">
        <Link to="/" className="dashboard-action-button primary">
          Browse Sessions
        </Link>
        {activeBookings.length > 0 && (
          <Link to="/" className="dashboard-action-button">
            View Calendar
          </Link>
        )}
      </div>
    </div>
  )
}

