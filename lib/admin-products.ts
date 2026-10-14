import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductStat } from '@/components/admin/ProductTabs'
import { NO_PRODUCT } from '@/lib/admin-analytics'
import { loadDailySales } from '@/lib/admin-sales'

// Prodotti con totali (vendite e incassi di sempre) e prodotto scelto da ?p=<slug> (nessuno = tutti).
// I totali vengono dai dati aggregati dal database, non da una lista di acquisti che si ferma a 1000 righe.
export async function loadProductStats(supabase: SupabaseClient, today: string, selectedSlug?: string) {
  const [{ data }, daily] = await Promise.all([
    supabase.from('products').select('id, slug, name, kind, currency, sales_active').order('created_at'),
    loadDailySales(supabase, '2020-01-01', today),
  ])
  const per = new Map<string, { sales: number; revenue: number }>()
  const allRevenue: Record<string, number> = {}
  let allSales = 0
  for (const r of daily) {
    const k = r.product_id ?? NO_PRODUCT
    const t = per.get(k) ?? { sales: 0, revenue: 0 }
    t.sales += r.sales
    t.revenue += r.revenue
    per.set(k, t)
    allSales += r.sales
    allRevenue[r.currency.toLowerCase()] = (allRevenue[r.currency.toLowerCase()] ?? 0) + r.revenue
  }
  const products: ProductStat[] = (data ?? []).map(p => ({ ...p, sales: per.get(p.id)?.sales ?? 0, revenue: per.get(p.id)?.revenue ?? 0 }))
  const active = products.find(p => p.slug === selectedSlug) ?? null
  return { products, active, allSales, allRevenue }
}
