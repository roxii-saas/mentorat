import type { SupabaseClient } from '@supabase/supabase-js'
import type { ProductStat } from '@/components/admin/ProductTabs'

type PurchaseRow = { product_id: string | null; amount: number | null }

// Prodotti + totali per prodotto, e quello selezionato da ?p= (default: mentorat)
export async function loadProductStats(supabase: SupabaseClient, purchases: PurchaseRow[], selectedSlug?: string) {
  const { data } = await supabase.from('products').select('id, slug, name, kind, currency, sales_active').order('created_at')
  const products: ProductStat[] = (data ?? []).map(p => {
    const rows = purchases.filter(r => r.product_id === p.id)
    return { ...p, sales: rows.length, revenue: rows.reduce((s, r) => s + (r.amount ?? 0), 0) }
  })
  const active = products.find(p => p.slug === selectedSlug) ?? products.find(p => p.slug === 'mentorat') ?? null
  return { products, active }
}
