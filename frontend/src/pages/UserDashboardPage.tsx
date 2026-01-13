import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Booking, Session } from '../types'
import './UserDashboardPage.css'
import { FaCalendarAlt, FaRupeeSign, FaClock, FaCreditCard, FaMoneyBillWave, FaTimes, FaBars } from 'react-icons/fa'
import { loadStripe } from '@stripe/stripe-js'
import { SessionCalendar } from '../components/SessionCalendar'
import { Sidebar } from '../components/Sidebar'

export function UserDashboardPage() {
  const navigate = useNavigate()
  const { user, apiFetch } = useAuth()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState<number | null>(null)
  const [paymentError, setPaymentError] = useState<{ [key: number]: string }>({})
  const [showCalendar, setShowCalendar] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        const [bookingsData, sessionsData] = await Promise.all([
          apiFetch<Booking[]>('/api/bookings/', { method: 'GET' }),
          apiFetch<Session[]>('/api/sessions/', { method: 'GET' })
        ])
        if (mounted) {
          setBookings(bookingsData)
          setSessions(sessionsData)
        }
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const paymentStatus = params.get('payment')
    const bookingId = params.get('booking_id')
    
    if (paymentStatus === 'success' && bookingId) {
      const verifyPayment = async () => {
        try {
          const sessionId = params.get('session_id')
          if (sessionId) {
            await apiFetch(`/api/bookings/${bookingId}/verify_payment/`, {
              method: 'POST',
              body: JSON.stringify({ session_id: sessionId }),
            })
            const data = await apiFetch<Booking[]>('/api/bookings/', { method: 'GET' })
            setBookings(data)
          }
        } catch (e) {
          console.error('Payment verification failed:', e)
        } finally {
          window.history.replaceState({}, '', '/dashboard')
        }
      }
      verifyPayment()
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, '', '/dashboard')
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

  function formatSessionTitle(booking: Booking) {
    const session = typeof booking.session === 'object' ? booking.session : null
    return session ? session.title : `Session #${booking.session}`
  }

  function getSessionStartTime(booking: Booking) {
    const session = typeof booking.session === 'object' ? booking.session : null
    return session ? new Date(session.start_time) : null
  }

  async function handlePayment(booking: Booking) {
    const session = typeof booking.session === 'object' ? booking.session : null
    if (!session || !user) return

    setPaymentLoading(booking.id)
    setPaymentError((prev) => ({ ...prev, [booking.id]: '' }))

    try {
      const checkoutSession = await apiFetch<{
        session_id: string
        url: string
        publishable_key: string
      }>('/api/bookings/create-payment-order/', {
        method: 'POST',
        body: JSON.stringify({ booking_id: booking.id }),
      })

      const stripe = await loadStripe(checkoutSession.publishable_key)
      
      if (!stripe) {
        throw new Error('Failed to load Stripe')
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId: checkoutSession.session_id,
      })

      if (error) {
        setPaymentError((prev) => ({
          ...prev,
          [booking.id]: `Payment failed: ${error.message}`,
        }))
        setPaymentLoading(null)
      }
    } catch (paymentError) {
      const msg =
        paymentError && typeof paymentError === 'object' && 'message' in paymentError
          ? String((paymentError as any).message)
          : 'Payment gateway not available'
      setPaymentError((prev) => ({
        ...prev,
        [booking.id]: `Payment setup failed: ${msg}`,
      }))
      setPaymentLoading(null)
    }
  }

  return (
    <div className="dashboard-with-sidebar">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="dashboard-modern">
        <div className="dashboard-container-box">
          <div className="dashboard-header-section">
            <div className="dashboard-header-content">
              <button 
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open menu"
              >
                <FaBars />
              </button>
              <div className="dashboard-header-text">
                <h1 className="dashboard-title">Dashboard</h1>
                <p className="dashboard-subtitle">Hi, {user?.name}</p>
              </div>
              <button className="dashboard-start-button" onClick={() => navigate('/explore')}>
                Book Now
              </button>
            </div>
          </div>

        <div className="dashboard-features">
          <Link to="/explore" className="dashboard-feature-card peach">
            <div className="dashboard-feature-icon">
              <img src="/images/Boat.png" alt="Explore New Sessions" />
            </div>
            <div className="dashboard-feature-text">Explore New Sessions</div>
          </Link>
          <div 
            className="dashboard-feature-card lavender" 
            style={{ cursor: 'pointer' }}
            onClick={() => setShowCalendar(true)}
          >
            <div className="dashboard-feature-icon">
              <img src="/images/Bird2.png" alt="My Schedule" />
            </div>
            <div className="dashboard-feature-text">My Schedule</div>
          </div>
          <Link to="/profile" className="dashboard-feature-card blue">
            <div className="dashboard-feature-icon">
              <img src="/images/Whale.png" alt="My Profile" />
            </div>
            <div className="dashboard-feature-text">My Profile</div>
          </Link>
        </div>

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


      </div>

              <button 
          className="vertical-calendar-btn"
          onClick={() => setShowCalendar(true)}
          title="Open Calendar"
        >
          <span className="vertical-text">CALENDAR</span>
        </button>

      {activeBookings.length > 0 && (
        <div className="dashboard-bookings-section">
          <h2 className="dashboard-section-title">Active Bookings</h2>
          {isLoading ? (
            <div className="dashboard-empty-state">Loading bookings…</div>
          ) : error ? (
            <div className="dashboard-empty-state dashboard-error-state">Error: {error}</div>
          ) : (
            <div className="dashboard-bookings-list">
              {activeBookings.map((b) => {
                const startTime = getSessionStartTime(b)
                const session = typeof b.session === 'object' ? b.session : null
                const isPending = b.payment_status !== 'paid' && b.status === 'PENDING'
                return (
                  <div key={b.id} className="dashboard-booking-item">
                    <div className="dashboard-booking-content">
                      <div className="dashboard-booking-title">
                        {session ? (
                          <Link to={`/sessions/${session.id}`}>
                            {formatSessionTitle(b)}
                          </Link>
                        ) : (
                          formatSessionTitle(b)
                        )}
                      </div>
                      <div className="dashboard-booking-meta">
                        {startTime && <span><FaCalendarAlt style={{ marginRight: '6px' }} />{startTime.toLocaleString()}</span>}
                        {session && <span><FaRupeeSign style={{ marginRight: '6px' }} />₹{session.price}</span>}
                        <span><FaClock style={{ marginRight: '6px' }} />Booked {new Date(b.created_at).toLocaleDateString()}</span>
                        {b.payment_status && <span><FaCreditCard style={{ marginRight: '6px' }} />{b.payment_status}</span>}
                        {b.amount_paid && <span><FaMoneyBillWave style={{ marginRight: '6px' }} />Paid: ₹{b.amount_paid}</span>}
                      </div>
                      {paymentError[b.id] && (
                        <div className="dashboard-payment-error">
                          {paymentError[b.id]}
                        </div>
                      )}
                      {isPending && (
                        <button style={{ marginTop: '30px' }}
                          className="dashboard-action-button primary"
                          onClick={() => handlePayment(b)}
                          disabled={paymentLoading === b.id}
                        >
                          {paymentLoading === b.id ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}
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
              const session = typeof b.session === 'object' ? b.session : null
              const isPending = b.payment_status !== 'paid' && b.status === 'PENDING'
              return (
                <div key={b.id} className="dashboard-booking-item">
                  <div className="dashboard-booking-content">
                    <div className="dashboard-booking-title">
                      {session ? (
                        <Link to={`/sessions/${session.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {formatSessionTitle(b)}
                        </Link>
                      ) : (
                        formatSessionTitle(b)
                      )}
                    </div>
                    <div className="dashboard-booking-meta">
                      {startTime && <span><FaCalendarAlt style={{ marginRight: '6px' }} />{startTime.toLocaleString()}</span>}
                      {session && <span><FaRupeeSign style={{ marginRight: '6px' }} />₹{session.price}</span>}
                      <span><FaClock style={{ marginRight: '6px' }} />Booked {new Date(b.created_at).toLocaleDateString()}</span>
                      {b.payment_status && <span><FaCreditCard style={{ marginRight: '6px' }} />{b.payment_status}</span>}
                      {b.amount_paid && <span><FaMoneyBillWave style={{ marginRight: '6px' }} />Paid: ₹{b.amount_paid}</span>}
                    </div>
                    {paymentError[b.id] && (
                      <div className="dashboard-payment-error">
                        {paymentError[b.id]}
                      </div>
                    )}
                    {isPending && (
                      <button
                        className="dashboard-action-button primary"
                        onClick={() => handlePayment(b)}
                        disabled={paymentLoading === b.id}
                      >
                        {paymentLoading === b.id ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}
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
          <Link to="/explore" className="dashboard-action-button primary dashboard-empty-cta">
            Browse Sessions
          </Link>
        </div>
      )}

      {showCalendar && (
        <div className="calendar-drawer-overlay" onClick={() => setShowCalendar(false)}>
          <div className="calendar-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-drawer-header">
              <h2>Session Calendar</h2>
              <button 
                className="calendar-drawer-close"
                onClick={() => setShowCalendar(false)}
                title="Close Calendar"
              >
                <FaTimes />
              </button>
            </div>
            <div className="calendar-drawer-content">
              <SessionCalendar bookings={bookings} sessions={sessions} />
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

