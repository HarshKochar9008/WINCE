import { useEffect, useMemo, useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Booking, Session } from '../types'
import './ExploreSessionsPage.css'

declare global {
  interface Window {
    Razorpay: any
  }
}

function formatMoney(amount: string) {
  const n = Number(amount)
  if (Number.isFinite(n)) return n.toLocaleString(undefined, { style: 'currency', currency: 'INR' })
  return amount
}

function formatDuration(duration: string) {
  const parts = duration.split(':').map(Number)
  const hours = parts[0] || 0
  const minutes = parts[1] || 0
  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h`
  if (minutes > 0) return `${minutes}m`
  return duration
}

interface SessionCardProps {
  session: Session
  onBook: (session: Session) => Promise<void>
  isBooking: boolean
  canBook: boolean
  user: any
}

function SessionCard({ session, onBook, isBooking, canBook, user }: SessionCardProps) {
  const navigate = useNavigate()

  const handleBookClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (canBook && !isBooking) {
      onBook(session)
    } else if (!user) {
      navigate('/login', { state: { from: `/sessions/${session.id}` } })
    }
  }

  const handleCardClick = () => {
    navigate(`/sessions/${session.id}`)
  }

  return (
    <div className="explore-session-card" onClick={handleCardClick}>
      {(session.image_url || session.image) && (
        <div className="explore-session-card__image-wrapper">
          <img
            src={session.image_url || session.image}
            alt={session.title}
            className="explore-session-card__image"
          />
          <div className="explore-session-card__overlay">
            <div className="explore-session-card__price-badge">{formatMoney(session.price)}</div>
          </div>
        </div>
      )}
      <div className="explore-session-card__content">
        <div className="explore-session-card__header">
          <h3 className="explore-session-card__title">{session.title}</h3>
          <div className="explore-session-card__meta">
            <span className="explore-session-card__date">
              {new Date(session.start_time).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            <span className="explore-session-card__time">
              {new Date(session.start_time).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            <span className="explore-session-card__duration">{formatDuration(session.duration)}</span>
          </div>
        </div>
        {session.description && (
          <p className="explore-session-card__description">{session.description.substring(0, 120)}...</p>
        )}
        <div className="explore-session-card__actions">
          <Link to={`/sessions/${session.id}`} className="explore-session-card__view-btn">
            View Details
          </Link>
          {canBook ? (
            <button
              className="explore-session-card__book-btn"
              onClick={handleBookClick}
              disabled={isBooking}
            >
              {isBooking ? 'Booking...' : 'Book Now'}
            </button>
          ) : user ? (
            <span className="explore-session-card__disabled-text">Login as user to book</span>
          ) : (
            <Link
              to="/login"
              state={{ from: `/sessions/${session.id}` }}
              className="explore-session-card__book-btn"
            >
              Login to Book
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

export function ExploreSessionsPage() {
  const { apiFetch, user } = useAuth()
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingStatus, setBookingStatus] = useState<{ [key: number]: string }>({})
  const [bookingSessionId, setBookingSessionId] = useState<number | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      const existingScript = document.body.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
      if (existingScript) {
        document.body.removeChild(existingScript)
      }
    }
  }, [])

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

  const canBookSession = (session: Session) => {
    if (!user) return false
    if (user.role !== 'USER') return false
    if (session.creator === user.id) return false
    return true
  }

  const handleBook = async (session: Session) => {
    if (!user) return

    setBookingSessionId(session.id) 
    setBookingStatus((prev) => ({ ...prev, [session.id]: '' }))

    try {
      const booking = await apiFetch<Booking>('/api/bookings/', {
        method: 'POST',
        body: JSON.stringify({ session_id: session.id }),
      })

      try {
        const paymentOrder = await apiFetch<{
          order_id: string
          amount: number
          currency: string
          key_id: string
        }>('/api/bookings/create-payment-order/', {
          method: 'POST',
          body: JSON.stringify({ booking_id: booking.id }),
        })

        const options = {
          key: paymentOrder.key_id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          order_id: paymentOrder.order_id,
          name: 'Ahoum Sessions',
          description: `Payment for ${session.title}`,
          handler: async function (response: any) {
            try {
              await apiFetch(`/api/bookings/${booking.id}/verify_payment/`, {
                method: 'POST',
                body: JSON.stringify({
                  payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  razorpay_order_id: response.razorpay_order_id,
                }),
              })
              setBookingStatus((prev) => ({
                ...prev,
                [session.id]: 'Booking confirmed! Payment successful.',
              }))
            } catch (e) {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as any).message)
                  : 'Payment verification failed'
              setBookingStatus((prev) => ({
                ...prev,
                [session.id]: `Payment verification failed: ${msg}`,
              }))
            } finally {
              setBookingSessionId(null)
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#2563eb',
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.on('payment.failed', function (response: any) {
          setBookingStatus((prev) => ({
            ...prev,
            [session.id]: `Payment failed: ${response.error.description || 'Unknown error'}`,
          }))
          setBookingSessionId(null)
        })
        razorpay.open()
      } catch (paymentError) {
        const msg =
          paymentError && typeof paymentError === 'object' && 'message' in paymentError
            ? String((paymentError as any).message)
            : 'Payment gateway not available'
        if (msg.includes('not configured') || msg.includes('503')) {
          setBookingStatus((prev) => ({
            ...prev,
            [session.id]: 'Booked! (Payment gateway not configured)',
          }))
        } else {
          setBookingStatus((prev) => ({
            ...prev,
            [session.id]: `Payment setup failed: ${msg}`,
          }))
        }
        setBookingSessionId(null)
      }
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Booking failed'
      if (session) {
        setBookingStatus((prev) => ({
          ...prev,
          [session.id]: `Booking failed: ${msg}`,
        }))
      }
      setBookingSessionId(null)
    }
  }

  const upcomingSessions = useMemo(() => {
    const now = new Date()
    return sessions.filter((s) => new Date(s.start_time) > now).sort((a, b) => {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    })
  }, [sessions])

  return (
    <div className="explore-sessions-page">
      <div className="explore-sessions-header">
        <div>
            <Link to="/dashboard">
            <h1 style={{ color: '#0f172a', textDecoration: 'none', cursor: 'pointer' }}>Explore Sessions</h1>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="explore-sessions-loading">
          <div className="card">Loading sessions…</div>
        </div>
      ) : error ? (
        <div className="explore-sessions-error">
          <div className="card error">Error: {error}</div>
        </div>
      ) : upcomingSessions.length === 0 ? (
        <div className="explore-sessions-empty">
          <div className="card">
            <p>No upcoming sessions available. Check back later!</p>
          </div>
        </div>
      ) : (
        <>
          <div className="explore-sessions-grid" ref={scrollContainerRef}>
            {upcomingSessions.map((session) => (
              <div key={session.id} className="explore-session-wrapper">
                <SessionCard
                  session={session}
                  onBook={handleBook}
                  isBooking={bookingSessionId === session.id}
                  canBook={canBookSession(session)}
                  user={user}
                />
                {bookingStatus[session.id] && (
                  <div className="explore-session-status">{bookingStatus[session.id]}</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
