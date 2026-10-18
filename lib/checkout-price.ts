import type { SupabaseClient } from '@supabase/supabase-js'
import { applyCode, codeLabel, codeProblem, currentPrice, type CodeFields, type PromoFields } from '@/lib/pricing'

export type Quote = {
  ok: true
  base: number; price: number; promoActive: boolean   // prețul de bază și prețul curent (după promoție)
  subtotal: number                                     // după codul de reducere
  discount: number                                     // cât s-a redus cu codul
  bump: number; total: number; currency: string
  code: { id: string; code: string; label: string } | null
  promoEndsAt: string | null
} | { ok: false; error: string; status: number }

type ProductRow = PromoFields & {
  id: string; slug: string; name: string; kind: string; currency: string
  sales_active: boolean; bump_active: boolean; bump_price: number | null
}

// UNICA sursă a prețului de plată: serverul îl calculează din baza de date, niciodată din ce trimite browserul.
export async function quote(supabase: SupabaseClient, slug: string, codeInput: string | null | undefined, wantBump: boolean, now: Date = new Date()): Promise<Quote> {
  const { data } = await supabase.from('products')
    .select('id, slug, name, kind, price_amount, compare_price, currency, sales_active, bump_active, bump_price, promo_type, promo_value, promo_starts_at, promo_ends_at')
    .eq('slug', slug).maybeSingle()
  const product = data as ProductRow | null
  if (!product || product.kind !== 'digital') return { ok: false, error: 'Produs inexistent.', status: 404 }
  if (!product.sales_active) return { ok: false, error: 'Vânzările sunt oprite momentan.', status: 403 }

  const cur = currentPrice(product, now)
  let subtotal = cur.price
  let code: { id: string; code: string; label: string } | null = null

  const typed = String(codeInput ?? '').trim()
  if (typed) {
    const { data: row } = await supabase.from('discount_codes').select('*')
      .eq('product_id', product.id).ilike('code', typed.replace(/[%_\\]/g, m => '\\' + m)).maybeSingle()
    // Același mesaj pentru „nu există” și „nu e al acestui produs”: nu se pot ghici codurile
    if (!row) return { ok: false, error: 'Cod de reducere invalid.', status: 422 }
    const problem = codeProblem(row as CodeFields, now)
    if (problem) return { ok: false, error: problem, status: 422 }
    subtotal = applyCode(cur.price, row as CodeFields)
    code = { id: row.id, code: row.code, label: codeLabel(row as CodeFields, product.currency) }
  }

  const bump = wantBump && product.bump_active && product.bump_price ? product.bump_price : 0
  return {
    ok: true, base: cur.base, price: cur.price, promoActive: cur.promoActive, subtotal, discount: cur.price - subtotal,
    bump, total: subtotal + bump, currency: product.currency, code, promoEndsAt: cur.endsAt,
  }
}
