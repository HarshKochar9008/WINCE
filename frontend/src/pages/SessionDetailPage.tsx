import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../state/auth/AuthContext'
import type { Booking, Session } from '../types'

declare global {
  interface Window {
    Razorpay: any
  }
}

export function SessionDetailPage() {
  const { id } = useParams()
  const sessionId = Number(id)
  const { apiFetch, user } = useAuth()

  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bookingStatus, setBookingStatus] = useState<string | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setError(null)
        const data = await apiFetch<Session>(`/api/sessions/${sessionId}/`, { method: 'GET' }, { skipAuth: true })
        if (mounted) setSession(data)
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
  }, [apiFetch, sessionId])

  const canBook = useMemo(() => {
    if (!user || !session) return false
    if (user.role !== 'USER') return false
    if (session.creator === user.id) return false
    return true
  }, [user, session])

  async function book() {
    setBookingStatus(null)
    setIsProcessingPayment(true)
    try {
      // Create booking
      const booking = await apiFetch<Booking>('/api/bookings/', {
        method: 'POST',
        body: JSON.stringify({ session_id: sessionId }),
      })

      // Create payment order
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

        // Initialize Razorpay
        const options = {
          key: paymentOrder.key_id,
          amount: paymentOrder.amount,
          currency: paymentOrder.currency,
          order_id: paymentOrder.order_id,
          name: 'Ahoum Sessions',
          description: `Payment for ${session?.title || 'Session'}`,
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
              setBookingStatus('Booking confirmed! Payment successful. Check your dashboard.')
            } catch (e) {
              const msg =
                e && typeof e === 'object' && 'message' in e
                  ? String((e as any).message)
                  : 'Payment verification failed'
              setBookingStatus(`Payment verification failed: ${msg}`)
            } finally {
              setIsProcessingPayment(false)
            }
          },
          prefill: {
            name: user?.name || '',
            email: user?.email || '',
          },
          theme: {
            color: '#3399cc',
          },
        }

        const razorpay = new window.Razorpay(options)
        razorpay.on('payment.failed', function (response: any) {
          setBookingStatus(`Payment failed: ${response.error.description || 'Unknown error'}`)
          setIsProcessingPayment(false)
        })
        razorpay.open()
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
      setBookingStatus(`Booking failed: ${msg}`)
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
            <div className="pill">₹ {session.price}</div>
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

          <div className="row">
            {canBook ? (
              <button className="btn btn-primary" onClick={book} disabled={isProcessingPayment}>
                {isProcessingPayment ? 'Processing payment…' : `Book session - ₹${session.price}`}
              </button>
            ) : user ? (
              <span className="muted">Login as a normal user to book.</span>
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

