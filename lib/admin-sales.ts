import type { SupabaseClient } from '@supabase/supabase-js'
import { addDays, aggregateRaw, aggregateRawHourly, bucharestMidnightUtc, type DailyRow, type HourRow, type RawPurchase } from '@/lib/admin-analytics'

// Finestra di dati caricata nell'Overview: 2 anni (serve anche per confrontare "12 luni" col periodo precedente)
export const WINDOW_DAYS = 730

export type OrderRow = {
  id: string; name: string | null; email: string; phone: string | null
  amount: number | null; currency: string; created_at: string; product_id: string | null; bump_included: boolean
}
export type OrdersResult = { total: number; rows: OrderRow[] }

const PAGE = 1000
const MAX_PAGES = 30

// Totali per giorno/prodotto/valuta, aggregati nel database (funzione SQL admin_sales_by_day).
// Se la funzione non è ancora installata, ripiega su un calcolo equivalente leggendo gli acquisti a pagine.
export async function loadDailySales(supabase: SupabaseClient, from: string, to: string): Promise<DailyRow[]> {
  const { data, error } = await supabase.rpc('admin_sales_by_day', { p_from: from, p_to: to })
  if (!error && Array.isArray(data)) return data as DailyRow[]

  console.warn('[Overview] admin_sales_by_day non disponibile, ripiego sul calcolo diretto:', error?.message)
  const start = bucharestMidnightUtc(from).toISOString()
  const end = bucharestMidnightUtc(addDays(to, 1)).toISOString()
  const rows: RawPurchase[] = []
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data: part, error: e } = await supabase
      .from('purchases')
      .select('amount, currency, created_at, product_id, bump_included')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1)
    if (e || !part) { console.error('[Overview] lettura acquisti fallita:', e?.message); break }
    rows.push(...(part as RawPurchase[]))
    if (part.length < PAGE) break
  }
  return aggregateRaw(rows)
}

// Ordini di un intervallo (riga espansa del tabel). Stesso ripiego di sopra.
export async function fetchOrders(
  supabase: SupabaseClient, from: string, to: string, productId: string | null, limit = 20
): Promise<OrdersResult> {
  const { data, error } = await supabase.rpc('admin_orders', { p_from: from, p_to: to, p_product: productId, p_limit: limit })
  if (!error && data && typeof data === 'object') return data as OrdersResult

  let q = supabase
    .from('purchases')
    .select('id, name, email, phone, amount, currency, created_at, product_id, bump_included', { count: 'exact' })
    .gte('created_at', bucharestMidnightUtc(from).toISOString())
    .lt('created_at', bucharestMidnightUtc(addDays(to, 1)).toISOString())
    .order('created_at', { ascending: false })
    .limit(limit)
  if (productId) q = q.eq('product_id', productId)
  const { data: rows, count, error: e2 } = await q
  if (e2) throw new Error(e2.message)
  return { total: count ?? rows?.length ?? 0, rows: (rows ?? []) as OrderRow[] }
}

// Totali per ora di un singolo giorno (vista "Azi" / "Ieri"). Stesso ripiego delle funzioni sopra.
export async function fetchHourly(supabase: SupabaseClient, day: string): Promise<HourRow[]> {
  const { data, error } = await supabase.rpc('admin_sales_by_hour', { p_day: day })
  if (!error && Array.isArray(data)) return data as HourRow[]

  const { data: part, error: e } = await supabase
    .from('purchases')
    .select('amount, currency, created_at, product_id, bump_included')
    .gte('created_at', bucharestMidnightUtc(day).toISOString())
    .lt('created_at', bucharestMidnightUtc(addDays(day, 1)).toISOString())
    .limit(5000)
  if (e) throw new Error(e.message)
  return aggregateRawHourly((part ?? []) as RawPurchase[])
}
