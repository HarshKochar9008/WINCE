export type Role = 'USER' | 'CREATOR'

export type User = {
  id: number
  email: string
  name: string
  avatar: string
  role: Role
}

export type Session = {
  id: number
  title: string
  description: string
  price: string
  creator: number
  image: string
  image_file?: string
  image_url?: string
  start_time: string
  duration: string
  created_at: string
  updated_at: string
}

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED'

export type Booking = {
  id: number
  user: number
  session: number | Session
  status: BookingStatus
  payment_id?: string
  payment_status?: string
  amount_paid?: string
  created_at: string
}

