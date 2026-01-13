import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Booking, Session } from '../types'
import './SessionCalendar.css'
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaCalendarCheck, 
  FaClock, 
  FaRupeeSign,
  FaUser,
  FaTimes
} from 'react-icons/fa'

interface SessionCalendarProps {
  bookings: Booking[]
  sessions: Session[]
}

interface CalendarEvent {
  id: number
  title: string
  startTime: Date
  price: string
  duration: string
  type: 'booked' | 'available'
  status?: string
  sessionId: number
  image?: string
}

export function SessionCalendar({ bookings, sessions }: SessionCalendarProps) {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Convert bookings and sessions to calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = []
    
    // Add booked sessions
    bookings.forEach((booking) => {
      const session = typeof booking.session === 'object' ? booking.session : null
      if (session) {
        calendarEvents.push({
          id: booking.id,
          title: session.title,
          startTime: new Date(session.start_time),
          price: session.price,
          duration: session.duration,
          type: 'booked',
          status: booking.status,
          sessionId: session.id,
          image: session.image_url || session.image_file || session.image
        })
      }
    })

    // Add available sessions (not booked)
    const bookedSessionIds = new Set(
      bookings
        .map(b => typeof b.session === 'object' ? b.session.id : b.session)
    )
    
    sessions.forEach((session) => {
      if (!bookedSessionIds.has(session.id)) {
        calendarEvents.push({
          id: session.id,
          title: session.title,
          startTime: new Date(session.start_time),
          price: session.price,
          duration: session.duration,
          type: 'available',
          sessionId: session.id,
          image: session.image_url || session.image_file || session.image
        })
      }
    })

    return calendarEvents
  }, [bookings, sessions])

  // Calendar calculations
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Get events for a specific day
  const getEventsForDay = (day: number) => {
    return events.filter((event) => {
      const eventDate = event.startTime
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      )
    })
  }

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Format duration
  const formatDuration = (duration: string) => {
    const match = duration.match(/(\d+):(\d+):(\d+)/)
    if (match) {
      const hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      if (hours > 0) return `${hours}h ${minutes}m`
      return `${minutes}m`
    }
    return duration
  }

  // Check if date is today
  const isToday = (day: number) => {
    const today = new Date()
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    )
  }

  return (
    <div className="session-calendar">
      {/* Calendar Header */}
      <div className="calendar-header">
        <div className="calendar-header-left">
          <h2 className="calendar-title">
            <FaCalendarCheck className="calendar-title-icon" />
            Session Calendar
          </h2>
          <button className="calendar-today-btn" onClick={goToToday}>
            Today
          </button>
        </div>
        <div className="calendar-nav">
          <button className="calendar-nav-btn" onClick={goToPreviousMonth}>
            <FaChevronLeft />
          </button>
          <div className="calendar-current-month">
            {monthNames[month]} {year}
          </div>
          <button className="calendar-nav-btn" onClick={goToNextMonth}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot booked"></span>
          <span>Your Bookings</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot available"></span>
          <span>Available Sessions</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day names */}
        {dayNames.map((day) => (
          <div key={day} className="calendar-day-name">
            {day}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="calendar-day empty"></div>
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dayEvents = getEventsForDay(day)
          const hasBooked = dayEvents.some(e => e.type === 'booked')
          const hasAvailable = dayEvents.some(e => e.type === 'available')
          
          return (
            <div
              key={day}
              className={`calendar-day ${isToday(day) ? 'today' : ''} ${
                dayEvents.length > 0 ? 'has-events' : ''
              }`}
            >
              <div className="day-number">{day}</div>
              {dayEvents.length > 0 && (
                <div className="day-events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={`${event.type}-${event.id}`}
                      className={`event-pill ${event.type}`}
                      onClick={() => setSelectedEvent(event)}
                      title={event.title}
                    >
                      <span className="event-time">
                        {event.startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                      <span className="event-title">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="event-more">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              )}
              {dayEvents.length > 0 && (
                <div className="day-indicators">
                  {hasBooked && <span className="indicator booked"></span>}
                  {hasAvailable && <span className="indicator available"></span>}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="event-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="event-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedEvent(null)}>
              <FaTimes />
            </button>
            
            {selectedEvent.image && (
              <div className="modal-image">
                <img src={selectedEvent.image} alt={selectedEvent.title} />
              </div>
            )}
            
            <div className="modal-content">
              <div className={`modal-badge ${selectedEvent.type}`}>
                {selectedEvent.type === 'booked' ? 'Your Booking' : 'Available'}
              </div>
              
              <h3 className="modal-title">{selectedEvent.title}</h3>
              
              <div className="modal-details">
                <div className="modal-detail-item">
                  <FaClock />
                  <span>
                    {selectedEvent.startTime.toLocaleString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                
                <div className="modal-detail-item">
                  <FaClock />
                  <span>Duration: {formatDuration(selectedEvent.duration)}</span>
                </div>
                
                <div className="modal-detail-item">
                  <FaRupeeSign />
                  <span>₹{selectedEvent.price}</span>
                </div>
                
                {selectedEvent.status && (
                  <div className="modal-detail-item">
                    <FaUser />
                    <span>Status: {selectedEvent.status}</span>
                  </div>
                )}
              </div>
              
              <div className="modal-actions">
                <button
                  className="modal-action-btn primary"
                  onClick={() => {
                    navigate(`/sessions/${selectedEvent.sessionId}`)
                    setSelectedEvent(null)
                  }}
                >
                  View Details
                </button>
                <button
                  className="modal-action-btn secondary"
                  onClick={() => setSelectedEvent(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
