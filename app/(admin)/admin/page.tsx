import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import OverviewDashboard from '@/components/admin/OverviewDashboard'
import { addDays, bucharestDay } from '@/lib/admin-analytics'
import { WINDOW_DAYS, loadDailySales } from '@/lib/admin-sales'

export default async function AdminPage() {
  await requireAdmin()
  const supabase = await createClient()
  const today = bucharestDay(new Date())

  const [{ data: products }, daily, { data: recent }] = await Promise.all([
    supabase.from('products').select('id, slug, name, kind, currency').order('created_at'),
    // Totali per giorno/prodotto/valuta: il filtro per prodotto, periodo e dettaglio si fa nel browser, senza ricaricare
    loadDailySales(supabase, addDays(today, -(WINDOW_DAYS - 1)), today),
    supabase.from('purchases')
      .select('id, name, email, amount, currency, created_at, product_id, bump_included')
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  return (
    <OverviewDashboard
      today={today}
      products={products ?? []}
      daily={daily}
      recent={(recent ?? []).map(r => ({ ...r, currency: (r.currency ?? 'eur') as string, bump_included: !!r.bump_included }))}
    />
  )
}
