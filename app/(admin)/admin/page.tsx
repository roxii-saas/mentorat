import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import RealtimeDashboard from '@/components/admin/RealtimeDashboard'

export default async function AdminPage() {
  await requireAdmin()
  const supabase = await createClient()

  const [
    { data: purchases },
    { data: settings },
  ] = await Promise.all([
    supabase.from('purchases')
      .select('id, name, email, phone, amount, currency, created_at, stripe_payment_intent_id')
      .order('created_at', { ascending: false }),
    supabase.from('platform_settings')
      .select('price_amount, currency, sales_active')
      .single(),
  ])

  const priceAmount = settings?.price_amount ?? 297
  const currency = settings?.currency ?? 'eur'

  // Build monthly data (ultimi 12 mesi) dalla tabella purchases
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setDate(1)
    d.setMonth(d.getMonth() - (11 - i))
    return {
      label: format(d, 'MMM', { locale: ro }),
      year: d.getFullYear(),
      month: d.getMonth(),
      purchases: 0,
      revenue: 0,
    }
  })

  purchases?.forEach(p => {
    const d = new Date(p.created_at)
    const idx = months.findIndex(m => m.month === d.getMonth() && m.year === d.getFullYear())
    if (idx >= 0) {
      months[idx].purchases++
      months[idx].revenue += p.amount ?? priceAmount
    }
  })

  const totalRevenue = purchases?.reduce((sum, p) => sum + (p.amount ?? priceAmount), 0) ?? 0
  const totalPurchases = purchases?.length ?? 0

  // Ultime 6 prenotazioni
  const recentPurchases = (purchases ?? []).slice(0, 6).map(p => ({
    id: p.id,
    name: p.name || p.email?.split('@')[0] || '—',
    email: p.email,
    phone: p.phone,
    amount: p.amount,
    currency: p.currency,
    created_at: p.created_at,
  }))

  return (
    <RealtimeDashboard initial={{
      totalPurchases,
      totalRevenue,
      currency,
      salesActive: settings?.sales_active ?? true,
      priceAmount,
      monthlyData: months,
      recentPurchases,
    }}/>
  )
}
