import { requireAdmin } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { ProductList } from '@/components/admin/products/ProductWorkspace'
import { addDays, bucharestDay } from '@/lib/admin-analytics'
import { loadDailySales } from '@/lib/admin-sales'
import type { Product } from '@/lib/products'

export default async function ProdusePage() {
  await requireAdmin()
  const supabase = await createClient()
  const today = bucharestDay(new Date())
  const [{ data }, daily] = await Promise.all([
    supabase.from('products').select('*').order('created_at'),
    loadDailySales(supabase, addDays(today, -29), today),
  ])
  return <ProductList products={(data ?? []) as Product[]} daily={daily} today={today} />
}
