import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { format } from 'date-fns'
import { ro } from 'date-fns/locale'
import RealtimeDashboard from '@/components/admin/RealtimeDashboard'
import ProductTabs from '@/components/admin/ProductTabs'
import { loadProductStats } from '@/lib/admin-products'

export default async function AdminPage({ searchParams }: PageProps<'/admin'>) {
  await requireAdmin()
  const supabase = await createClient()
  const { p } = await searchParams

  const [
    { data: allPurchases },
    { data: settings },
  ] = await Promise.all([
    // select('*'): funziona anche prima della migration products (colonna product_id assente)
    supabase.from('purchases')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase.from('platform_settings')
      .select('price_amount, currency, sales_active')
      .single(),
  ])

  const { products, active } = await loadProductStats(supabase, allPurchases ?? [], typeof p === 'string' ? p : undefined)
  const purchases = active ? (allPurchases ?? []).filter(x => x.product_id === active.id) : allPurchases
  const isMentorat = !active || active.kind === 'mentorat'

  const priceAmount = isMentorat ? (settings?.price_amount ?? 297) : 0
  const currency = active?.currency ?? settings?.currency ?? 'eur'

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
    <div className="space-y-4 sm:space-y-5">
    <ProductTabs products={products} active={active?.slug ?? ''} basePath="/admin" />
    <RealtimeDashboard key={active?.id ?? 'all'} productId={active?.id} productSlug={active?.slug} kind={isMentorat ? 'mentorat' : 'digital'} initial={{
      totalPurchases,
      totalRevenue,
      currency,
      salesActive: isMentorat ? (settings?.sales_active ?? true) : !!active?.sales_active,
      priceAmount,
      monthlyData: months,
      recentPurchases,
    }}/>
    </div>
  )
}
