import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import ClientDashboard from '@/components/dashboard/ClientDashboard'

export default async function DashboardPage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const [{ data: profile }, { data: bookings }] = await Promise.all([
    supabase.from('profiles').select('full_name, purchased_at, email').eq('id', user.id).single(),
    supabase.from('bookings').select('*').eq('client_id', user.id).order('scheduled_at', { ascending: false }),
  ])

  return (
    <ClientDashboard initial={{
      profile: profile ?? { full_name: null, purchased_at: null, email: user.email ?? '' },
      bookings: (bookings ?? []) as any,
    }}/>
  )
}
