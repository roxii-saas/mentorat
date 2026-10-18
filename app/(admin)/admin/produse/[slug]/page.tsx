import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import ProductWorkspace, { type OrderLite, type Tab } from '@/components/admin/products/ProductWorkspace'
import { addDays, bucharestDay } from '@/lib/admin-analytics'
import { loadDailySales } from '@/lib/admin-sales'
import type { Product } from '@/lib/products'

const TABS: Tab[] = ['previzualizare', 'analiza', 'detalii', 'upgrade', 'livrare', 'landing']

export default async function ProductPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string }> }) {
  await requireAdmin()
  const [{ slug }, { t }] = await Promise.all([params, searchParams])
  const supabase = await createClient()
  const today = bucharestDay(new Date())

  const { data } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle()
  if (!data) notFound()
  const product = data as Product

  const [daily, { data: orders }] = await Promise.all([
    loadDailySales(supabase, addDays(today, -89), today),
    supabase.from('purchases').select('id, name, email, amount, currency, created_at, bump_included')
      .eq('product_id', product.id).order('created_at', { ascending: false }).limit(10),
  ])

  return (
    <ProductWorkspace
      product={product}
      initialTab={TABS.includes(t as Tab) ? (t as Tab) : 'previzualizare'}
      daily={daily}
      today={today}
      orders={(orders ?? []) as OrderLite[]}
    />
  )
}
