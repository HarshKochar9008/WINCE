import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session } from '../types'
import './CreatorSessionCalendar.css'
import { 
  FaChevronLeft, 
  FaChevronRight, 
  FaCalendarCheck, 
  FaClock, 
  FaRupeeSign,
  FaUsers,
  FaEdit
} from 'react-icons/fa'

interface CreatorSessionCalendarProps {
  sessions: Session[]
}

interface CalendarEvent {
  id: number
  title: string
  startTime: Date
  price: string
  duration: string
  description: string
  image?: string
  bookingCount?: number
}

export function CreatorSessionCalendar({ sessions }: CreatorSessionCalendarProps) {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)

  // Convert sessions to calendar events
  const events = useMemo(() => {
    const calendarEvents: CalendarEvent[] = sessions.map((session) => ({
      id: session.id,
      title: session.title,
      startTime: new Date(session.start_time),
      price: session.price,
      duration: session.duration,
      description: session.description,
      image: session.image_url || session.image_file || session.image,
    }))

    return calendarEvents
  }, [sessions])

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

  // Check if event is in the past
  const isPast = (event: CalendarEvent) => {
    return event.startTime < new Date()
  }

  return (
    <div className="creator-session-calendar">
      {/* Calendar Header */}
      <div className="creator-calendar-header">
        <div className="creator-calendar-header-left">
          <h2 className="creator-calendar-title">
            <FaCalendarCheck className="creator-calendar-title-icon" />
            Your Sessions Calendar
          </h2>
          <button className="creator-calendar-today-btn" onClick={goToToday}>
            Today
          </button>
        </div>
        <div className="creator-calendar-nav">
          <button className="creator-calendar-nav-btn" onClick={goToPreviousMonth}>
            <FaChevronLeft />
          </button>
          <div className="creator-calendar-current-month">
            {monthNames[month]} {year}
          </div>
          <button className="creator-calendar-nav-btn" onClick={goToNextMonth}>
            <FaChevronRight />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="creator-calendar-legend">
        <div className="creator-legend-item">
          <span className="creator-legend-dot upcoming"></span>
          <span>Upcoming Sessions</span>
        </div>
        <div className="creator-legend-item">
          <span className="creator-legend-dot past"></span>
          <span>Past Sessions</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="creator-calendar-grid">
        {/* Day names */}
        {dayNames.map((day) => (
          <div key={day} className="creator-calendar-day-name">
            {day}
          </div>
        ))}

        {/* Empty cells before first day */}
        {Array.from({ length: startingDayOfWeek }).map((_, index) => (
          <div key={`empty-${index}`} className="creator-calendar-day empty"></div>
        ))}

        {/* Days */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const dayEvents = getEventsForDay(day)
          
          return (
            <div
              key={day}
              className={`creator-calendar-day ${isToday(day) ? 'today' : ''} ${
                dayEvents.length > 0 ? 'has-events' : ''
              }`}
            >
              <div className="creator-day-number">{day}</div>
              {dayEvents.length > 0 && (
                <div className="creator-day-events">
                  {dayEvents.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`creator-event-pill ${isPast(event) ? 'past' : 'upcoming'}`}
                      onClick={() => setSelectedEvent(event)}
                      title={event.title}
                    >
                      <span className="creator-event-time">
                        {event.startTime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </span>
                      <span className="creator-event-title">{event.title}</span>
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="creator-event-more">+{dayEvents.length - 2} more</div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="creator-event-modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="creator-event-modal" onClick={(e) => e.stopPropagation()}>
            <button className="creator-modal-close" onClick={() => setSelectedEvent(null)}>
              ×
            </button>
            
            {selectedEvent.image && (
              <div className="creator-modal-image">
                <img src={selectedEvent.image} alt={selectedEvent.title} />
              </div>
            )}
            
            <div className="creator-modal-content">
              <div className={`creator-modal-badge ${isPast(selectedEvent) ? 'past' : 'upcoming'}`}>
                {isPast(selectedEvent) ? 'Past Session' : 'Upcoming Session'}
              </div>
              
              <h3 className="creator-modal-title">{selectedEvent.title}</h3>
              
              {selectedEvent.description && (
                <p className="creator-modal-description">{selectedEvent.description}</p>
              )}
              
              <div className="creator-modal-details">
                <div className="creator-modal-detail-item">
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
                
                <div className="creator-modal-detail-item">
                  <FaClock />
                  <span>Duration: {formatDuration(selectedEvent.duration)}</span>
                </div>
                
                <div className="creator-modal-detail-item">
                  <FaRupeeSign />
                  <span>₹{selectedEvent.price}</span>
                </div>
                
                {selectedEvent.bookingCount !== undefined && (
                  <div className="creator-modal-detail-item">
                    <FaUsers />
                    <span>{selectedEvent.bookingCount} Booking{selectedEvent.bookingCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              
              <div className="creator-modal-actions">
                <button
                  className="creator-modal-action-btn primary"
                  onClick={() => {
                    navigate(`/sessions/${selectedEvent.id}`)
                    setSelectedEvent(null)
                  }}
                >
                  View Details
                </button>
                <button
                  className="creator-modal-action-btn edit"
                  onClick={() => {
                    // TODO: Navigate to edit page when implemented
                    alert('Edit functionality coming soon!')
                    setSelectedEvent(null)
                  }}
                >
                  <FaEdit /> Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
