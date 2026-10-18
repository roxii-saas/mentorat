import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ProductWorkspace, { type OrderLite, type Tab } from '@/components/admin/products/ProductWorkspace'
import { addDays, bucharestDay } from '@/lib/admin-analytics'
import { loadDailySales } from '@/lib/admin-sales'
import type { Product } from '@/lib/products'

const TABS: Tab[] = ['previzualizare', 'analiza', 'detalii', 'upgrade', 'livrare', 'landing']

export default async function ProdusePage({ searchParams }: { searchParams: Promise<{ p?: string; t?: string }> }) {
  await requireAdmin()
  const { p, t } = await searchParams
  const supabase = await createClient()
  const today = bucharestDay(new Date())

  const { data } = await supabase.from('products').select('*').order('created_at')
  const products = (data ?? []) as Product[]
  const active = products.find(x => x.slug === p) ?? products.find(x => x.kind === 'digital') ?? products[0]

  const [daily, { data: orders }] = await Promise.all([
    loadDailySales(supabase, addDays(today, -89), today),
    active
      ? supabase.from('purchases').select('id, name, email, amount, currency, created_at, bump_included')
          .eq('product_id', active.id).order('created_at', { ascending: false }).limit(10)
      : Promise.resolve({ data: [] }),
  ])

  return (
    <ProductWorkspace
      products={products}
      activeSlug={active?.slug ?? ''}
      initialTab={TABS.includes(t as Tab) ? (t as Tab) : 'previzualizare'}
      daily={daily}
      today={today}
      orders={(orders ?? []) as OrderLite[]}
    />
  )
}
