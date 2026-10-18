import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import OverviewDashboard from '@/components/admin/OverviewDashboard'
import { addDays, bucharestDay, bucharestHour } from '@/lib/admin-analytics'
import { WINDOW_DAYS, loadDailySales } from '@/lib/admin-sales'
import { FILTER_COOKIE, parseFilters } from '@/lib/overview-filters'

export default async function AdminPage() {
  await requireAdmin()
  const supabase = await createClient()
  const now = new Date()
  const today = bucharestDay(now)

  const [{ data: products }, daily, { data: recent }, jar] = await Promise.all([
    supabase.from('products').select('id, slug, name, kind, currency').order('created_at'),
    // Totali per giorno/prodotto/valuta: filtri, periodi e dettaglio si cambiano nel browser, senza ricaricare
    loadDailySales(supabase, addDays(today, -(WINDOW_DAYS - 1)), today),
    supabase.from('purchases')
      .select('id, name, email, amount, currency, created_at, product_id, bump_included')
      .order('created_at', { ascending: false })
      .limit(8),
    cookies(),
  ])

  // Filtri ricordati (default: Azi, tutti i prodotti). Letti qui, sul server, così la pagina arriva già col periodo giusto.
  const initial = parseFilters(jar.get(FILTER_COOKIE)?.value, (products ?? []).map(p => p.id), today)

  return (
    <OverviewDashboard
      today={today}
      nowHour={bucharestHour(now)}
      initial={initial}
      products={products ?? []}
      daily={daily}
      recent={(recent ?? []).map(r => ({ ...r, currency: (r.currency ?? 'eur') as string, bump_included: !!r.bump_included }))}
    />
  )
}
