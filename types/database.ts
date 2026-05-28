export type Role = 'client' | 'admin'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  role: Role
  stripe_customer_id: string | null
  stripe_payment_intent_id: string | null
  purchased_at: string | null
  created_at: string
}

export interface Booking {
  id: string
  client_id: string
  scheduled_at: string
  duration_minutes: number
  status: BookingStatus
  meet_link: string | null
  client_notes: string | null
  admin_notes: string | null
  created_at: string
  profiles?: Profile
}

export interface Availability {
  id: string
  date: string          // YYYY-MM-DD
  start_time: string    // HH:MM
  end_time: string      // HH:MM
  is_booked: boolean
  created_at: string
}

export interface PlatformSettings {
  id: string
  price_amount: number       // in euro (es. 297)
  currency: string           // 'eur'
  product_name: string
  product_description: string
  sales_active: boolean
  updated_at: string
}
