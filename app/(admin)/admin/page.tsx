import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import RealtimeDashboard from '@/components/admin/RealtimeDashboard'

export default async function AdminPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [
    { count: totalClients },
    { count: pendingBookings },
    { count: completedBookings },
    { data: upcomingBookings },
    { data: settings },
    { data: allBookings },
    { data: allClients },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count:'exact', head:true }).eq('role','client'),
    supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','pending'),
    supabase.from('bookings').select('*', { count:'exact', head:true }).eq('status','completed'),
    supabase.from('bookings').select('*, profiles(full_name, email)').in('status',['pending','confirmed']).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(6),
    supabase.from('platform_settings').select('price_amount, currency, sales_active').single(),
    supabase.from('bookings').select('scheduled_at, status').order('scheduled_at'),
    supabase.from('profiles').select('created_at').eq('role','client').order('created_at', { ascending:false }),
  ])

  const priceAmount = settings?.price_amount ?? 297
  const currency = settings?.currency ?? 'eur'

  // Build monthly data (last 6 months)
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - (5 - i))
    return { month: format(d, 'MMM', { locale: ro }), year: d.getFullYear(), m: d.getMonth(), bookings:0, clients:0, revenue:0 }
  })
  allBookings?.forEach(b => {
    const d = new Date(b.scheduled_at)
    const idx = months.findIndex(x => x.m === d.getMonth() && x.year === d.getFullYear())
    if (idx >= 0) { months[idx].bookings++; if (b.status==='completed') months[idx].revenue += priceAmount }
  })
  allClients?.forEach(c => {
    const d = new Date(c.created_at)
    const idx = months.findIndex(x => x.m === d.getMonth() && x.year === d.getFullYear())
    if (idx >= 0) months[idx].clients++
  })

  return (
    <RealtimeDashboard initial={{
      totalClients: totalClients ?? 0,
      pendingBookings: pendingBookings ?? 0,
      completedBookings: completedBookings ?? 0,
      revenue: (completedBookings ?? 0) * priceAmount,
      currency,
      salesActive: settings?.sales_active ?? true,
      priceAmount,
      upcomingBookings: (upcomingBookings as any) ?? [],
      monthlyData: months,
    }}/>
  )
}
