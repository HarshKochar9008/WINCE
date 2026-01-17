import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Booking, Session } from '../types'
import { loadStripe } from '@stripe/stripe-js'
import { FaCheckCircle, FaHourglassHalf, FaTimesCircle } from 'react-icons/fa'

export function SessionDetailPage() {
  const { id } = useParams()
  const sessionId = Number(id)
  const { apiFetch, user } = useAuth()

  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingStatus, setBookingStatus] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [existingBooking, setExistingBooking] = useState<Booking | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        const data = await apiFetch<Session>(`/api/sessions/${sessionId}/`, { method: 'GET' }, { skipAuth: true })
        if (mounted) setSession(data)

        // Check if user already has a booking for this session
        if (user) {
          try {
            const bookings = await apiFetch<Booking[]>('/api/bookings/', { method: 'GET' })
            const existing = bookings.find(b => {
              const bookingSessionId = typeof b.session === 'object' ? b.session.id : b.session
              return bookingSessionId === sessionId
            })
            if (mounted && existing) {
              setExistingBooking(existing)
            }
          } catch (e) {
            // Ignore errors fetching bookings
          }
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
  }, [apiFetch, sessionId, user])

  const canBook = useMemo(() => {
    if (!user || !session) return false
    // Users and creators can book sessions, but creators cannot book their own sessions
    if (user.role === 'CREATOR' && session.creator === user.id) return false
    return true
  }, [user, session])

  async function book() {
    // Check if already booked
    if (existingBooking) {
      setBookingStatus(`You already have a ${existingBooking.status.toLowerCase()} booking for this session. Check your dashboard.`)
      return
    }

    setBookingStatus(null)
    setIsProcessingPayment(true)
    try {
      // Create booking
      const booking = await apiFetch<Booking>('/api/bookings/', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      })
      setExistingBooking(booking)

      // Check if session is free (price = 0)
      const isFreeSession = session && parseFloat(session.price) === 0
      
      if (isFreeSession) {
        // Free sessions are auto-confirmed, no payment needed
        setBookingStatus('Booked successfully! This is a free session.')
        setIsProcessingPayment(false)
        // Refresh to get the updated booking status
        try {
          const bookings = await apiFetch<Booking[]>('/api/bookings/', { method: 'GET' })
          const existing = bookings.find(b => {
            const bookingSessionId = typeof b.session === 'object' ? b.session.id : b.session
            return bookingSessionId === sessionId
          })
          if (existing) setExistingBooking(existing)
        } catch {}
        return
      }

      // Create Stripe Checkout Session for paid sessions
      try {
        const checkoutSession = await apiFetch<{
          session_id: string
          url: string
          publishable_key: string
        }>('/api/bookings/create-payment-order/', {
          method: 'POST',
          body: JSON.stringify({ booking_id: booking.id }),
        })

        // Load Stripe and redirect to checkout
        const stripe = await loadStripe(checkoutSession.publishable_key)
        
        if (!stripe) {
          throw new Error('Failed to load Stripe')
        }

        // Redirect to Stripe Checkout
        const { error } = await stripe.redirectToCheckout({
          sessionId: checkoutSession.session_id,
        })

        if (error) {
          setBookingStatus(`Payment failed: ${error.message}`)
          setIsProcessingPayment(false)
        }
      } catch (paymentError) {
        // If payment gateway is not configured, just confirm booking
        const msg =
          paymentError && typeof paymentError === 'object' && 'message' in paymentError
            ? String((paymentError as any).message)
            : 'Payment gateway not available'
        if (msg.includes('not configured') || msg.includes('503')) {
          setBookingStatus('Booked! (Payment gateway not configured - booking confirmed without payment)')
        } else {
          setBookingStatus(`Payment setup failed: ${msg}. Booking created but payment pending.`)
        }
        setIsProcessingPayment(false)
      }
    } catch (e) {
      const msg = e && typeof e === 'object' && 'message' in e ? String((e as any).message) : 'Booking failed'
      
      // Check if it's a duplicate booking error
      if (msg.includes('already booked')) {
        setBookingStatus('You have already booked this session. Check your dashboard to see your existing booking.')
        // Refresh to show the existing booking
        try {
          const bookings = await apiFetch<Booking[]>('/api/bookings/', { method: 'GET' })
          const existing = bookings.find(b => {
            const bookingSessionId = typeof b.session === 'object' ? b.session.id : b.session
            return bookingSessionId === sessionId
          })
          if (existing) setExistingBooking(existing)
        } catch {}
      } else {
        setBookingStatus(`Booking failed: ${msg}`)
      }
      setIsProcessingPayment(false)
    }
  }

  if (Number.isNaN(sessionId)) {
    return (
      <div className="card error">
        Invalid session id. <Link to="/">Back to home</Link>
      </div>
    )
  }

  return (
    <div className="stack">
      {isLoading ? <div className="card">Loading session…</div> : null}
      {error ? <div className="card error">Error: {error}</div> : null}

      {session ? (
        <div className="card stack">
          <div className="row row-between">
            <div>
              <div className="h2">{session.title}</div>
              <div className="muted">{new Date(session.start_time).toLocaleString()}</div>
            </div>
            <div className="pill">{parseFloat(session.price) === 0 ? 'Free' : `₹ ${session.price}`}</div>
          </div>

          {(session.image_url || session.image) && (
            <img
              className="hero-image"
              src={session.image_url || session.image}
              alt={session.title}
            />
          )}

          {session.description ? <p>{session.description}</p> : <p className="muted">No description.</p>}

          <div className="muted">
            Duration: <code>{session.duration}</code>
          </div>

          {existingBooking && (
            <div className="card subtle" style={{ backgroundColor: existingBooking.status === 'CONFIRMED' ? '#d4edda' : '#fff3cd', padding: '16px', marginBottom: '16px' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {existingBooking.status === 'CONFIRMED' ? (
                  <>
                    <FaCheckCircle style={{ color: '#28a745' }} /> Already Booked
                  </>
                ) : existingBooking.status === 'PENDING' ? (
                  <>
                    <FaHourglassHalf style={{ color: '#ffc107' }} /> Booking Pending
                  </>
                ) : (
                  <>
                    <FaTimesCircle style={{ color: '#dc3545' }} /> Booking Cancelled
                  </>
                )}
              </strong>
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                Status: <strong>{existingBooking.status}</strong>
                {existingBooking.payment_status && ` • Payment: ${existingBooking.payment_status}`}
                {existingBooking.amount_paid && ` • Amount: ₹${existingBooking.amount_paid}`}
              </div>
              <div style={{ marginTop: '8px' }}>
                <Link to="/dashboard" className="btn btn-secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
                  View in Dashboard
                </Link>
              </div>
            </div>
          )}

          <div className="row">
            {canBook ? (
              existingBooking ? (
                <button className="btn btn-primary" disabled style={{ opacity: 0.6, cursor: 'not-allowed' }}>
                  Already Booked
                </button>
              ) : (
                <button className="btn btn-primary" onClick={book} disabled={isProcessingPayment}>
                  {isProcessingPayment ? 'Processing payment…' : parseFloat(session.price) === 0 ? 'Book Free Session' : `Book session - ₹${session.price}`}
                </button>
              )
            ) : user ? (
              <span className="muted">Cannot book your own session.</span>
            ) : (
              <Link className="btn btn-primary" to="/login" state={{ from: `/sessions/${sessionId}` }}>
                Login to book
              </Link>
            )}

            <Link className="btn btn-secondary" to="/">
              Back
            </Link>
          </div>

          {bookingStatus ? <div className="card subtle">{bookingStatus}</div> : null}
        </div>
      ) : null}
    </div>
  )
}

