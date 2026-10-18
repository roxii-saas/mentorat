// Prețuri, promoții programate și coduri de reducere. Funcții pure: aceleași reguli pe server (plata) și în browser (afișare).
// Prețurile sunt numere întregi (RON/EUR); orice reducere se rotunjește și nu coboară sub 2.

export type PromoFields = {
  price_amount: number; compare_price: number | null
  promo_type?: 'price' | 'percent' | null; promo_value?: number | null
  promo_starts_at?: string | null; promo_ends_at?: string | null
}
export type CodeFields = {
  type: 'percent' | 'amount' | 'price'; value: number
  starts_at: string | null; ends_at: string | null
  max_uses: number | null; used_count: number; active: boolean
}

export type PromoState = 'none' | 'scheduled' | 'active' | 'ended'

export function promoState(p: PromoFields, now: Date = new Date()): PromoState {
  if (!p.promo_type || !p.promo_value) return 'none'
  const t = now.getTime()
  if (p.promo_starts_at && t < Date.parse(p.promo_starts_at)) return 'scheduled'
  if (p.promo_ends_at && t >= Date.parse(p.promo_ends_at)) return 'ended'
  return 'active'
}

// minim 2: sub această sumă Stripe nu poate încasa
const clamp = (n: number) => Math.max(2, Math.round(n))

/** Prețul promoției pornind de la prețul de bază (fără a verifica perioada) */
export function promoPrice(p: Pick<PromoFields, 'price_amount' | 'promo_type' | 'promo_value'>): number {
  if (!p.promo_type || !p.promo_value) return p.price_amount
  return p.promo_type === 'price' ? clamp(p.promo_value) : clamp(p.price_amount * (100 - Math.min(99, p.promo_value)) / 100)
}

/** Prețul de vânzare în acest moment */
export function currentPrice(p: PromoFields, now: Date = new Date()) {
  const active = promoState(p, now) === 'active'
  const price = active ? promoPrice(p) : p.price_amount
  return { price, base: p.price_amount, promoActive: active, endsAt: active ? p.promo_ends_at ?? null : null }
}

/** Produsul așa cum îl vede clientul acum: prețul curent, iar prețul de bază apare tăiat dacă promoția e activă */
export function withCurrentPrice<T extends PromoFields>(p: T, now: Date = new Date()): T & { promo_active: boolean; promo_ends: string | null } {
  const c = currentPrice(p, now)
  return {
    ...p,
    price_amount: c.price,
    compare_price: c.promoActive && c.base > c.price ? c.base : p.compare_price,
    promo_active: c.promoActive,
    promo_ends: c.endsAt,
  }
}

export function codeProblem(c: CodeFields, now: Date = new Date()): string | null {
  const t = now.getTime()
  if (!c.active) return 'Acest cod nu mai este activ.'
  if (c.starts_at && t < Date.parse(c.starts_at)) return 'Acest cod nu este încă valabil.'
  if (c.ends_at && t >= Date.parse(c.ends_at)) return 'Acest cod a expirat.'
  if (c.max_uses != null && c.used_count >= c.max_uses) return 'Acest cod a fost folosit de numărul maxim de ori.'
  return null
}

export function applyCode(price: number, c: Pick<CodeFields, 'type' | 'value'>): number {
  if (c.type === 'percent') return clamp(price * (100 - Math.min(99, c.value)) / 100)
  if (c.type === 'amount') return clamp(price - c.value)
  return Math.min(price, clamp(c.value))   // „preț final”: nu poate crește prețul
}

export const codeLabel = (c: Pick<CodeFields, 'type' | 'value'>, currency: string) =>
  c.type === 'percent' ? `-${c.value}%` : c.type === 'amount' ? `-${c.value} ${currency.toUpperCase()}` : `preț ${c.value} ${currency.toUpperCase()}`

// ───── Ora României: administratoarea alege data și ora după ceasul din România, indiferent de unde se conectează ─────
const TZ = 'Europe/Bucharest'
function offsetMin(utcMs: number): number {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
  const g = Object.fromEntries(f.formatToParts(new Date(utcMs)).map(x => [x.type, x.value]))
  return Math.round((Date.UTC(+g.year, +g.month - 1, +g.day, +g.hour, +g.minute, +g.second) - Math.floor(utcMs / 1000) * 1000) / 60000)
}
/** '2026-10-25T23:59' (ora României) → ISO UTC */
export function bucharestInputToIso(local: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local)
  if (!m) return null
  const guess = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])
  let utc = guess - offsetMin(guess) * 60000
  utc = guess - offsetMin(utc) * 60000
  return new Date(utc).toISOString()
}
/** ISO UTC → '2026-10-25T23:59' (ora României), pentru <input type="datetime-local"> */
export function isoToBucharestInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const ms = Date.parse(iso)
  return Number.isNaN(ms) ? '' : new Date(ms + offsetMin(ms) * 60000).toISOString().slice(0, 16)
}
export function formatBucharest(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ro-RO', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
