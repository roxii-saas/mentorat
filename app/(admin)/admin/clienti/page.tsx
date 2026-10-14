import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import ClientiView, { PAGE_SIZE, type ClientRow } from '@/components/admin/ClientiView'
import { loadProductStats } from '@/lib/admin-products'
import { bucharestDay } from '@/lib/admin-analytics'

export default async function ClientiPage({ searchParams }: PageProps<'/admin/clienti'>) {
  await requireAdmin()
  const supabase = await createClient()
  const sp = await searchParams
  const slug = typeof sp.p === 'string' ? sp.p : undefined
  // Rimuove i caratteri speciali del filtro PostgREST: la ricerca è solo testo semplice
  const q = (typeof sp.q === 'string' ? sp.q : '').replace(/[%*,()\\]/g, ' ').trim().slice(0, 60)
  const page = Math.max(1, Number(typeof sp.page === 'string' ? sp.page : 1) || 1)

  const { products, active, allSales, allRevenue } = await loadProductStats(supabase, bucharestDay(new Date()), slug)

  let query = supabase
    .from('purchases')
    .select('id, name, email, phone, amount, currency, created_at, product_id, bump_included', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
  if (active) query = query.eq('product_id', active.id)
  if (q) query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%`)
  const { data: rows, count } = await query

  return (
    <ClientiView purchases={(rows ?? []) as ClientRow[]} total={count ?? 0} page={page} q={q}
      products={products} active={active} allSales={allSales} allRevenue={allRevenue} />
  )
}
