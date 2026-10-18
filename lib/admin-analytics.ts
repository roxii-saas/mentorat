// Logica pura (senza React né Supabase) per l'analisi delle vendite nell'Overview.
// Tutte le date sono stringhe 'YYYY-MM-DD' = giorno in ora di Bucarest, come le calcola il database:
// niente fusi orari del browser, quindi stesso risultato per chiunque e a qualsiasi ora.

export const BUSINESS_TZ = 'Europe/Bucharest'

export type DailyRow = { day: string; product_id: string | null; currency: string; sales: number; revenue: number; bumps: number }
export type ProductInfo = { id: string; slug: string; name: string; kind: string; currency: string }
export type Gran = 'day' | 'week' | 'month'
export type CurTotals = Record<string, { sales: number; revenue: number }>
export type DayAgg = { sales: number; bumps: number; cur: CurTotals; prod: Record<string, { sales: number; cur: CurTotals }> }
export type Bucket = { key: string; from: string; to: string; label: string; long: string; agg: DayAgg }
export type RawPurchase = { amount: number | null; currency: string | null; created_at: string; product_id: string | null; bump_included?: boolean | null }

const MONTHS = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sep', 'oct', 'nov', 'dec']
const DOW = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm']
export const NO_PRODUCT = 'none'

// ── Date come stringhe ────────────────────────────────────────────────
const toUTC = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d) }
const fromUTC = (ms: number) => new Date(ms).toISOString().slice(0, 10)
export const addDays = (iso: string, n: number) => fromUTC(toUTC(iso) + n * 86400000)
export const dayDiff = (a: string, b: string) => Math.round((toUTC(b) - toUTC(a)) / 86400000)
export const daysBetween = (from: string, to: string) => Array.from({ length: Math.max(0, dayDiff(from, to)) + 1 }, (_, i) => addDays(from, i))
const dow = (iso: string) => new Date(toUTC(iso)).getUTCDay()
export const weekStart = (iso: string) => addDays(iso, -((dow(iso) + 6) % 7))
export const shortDay = (iso: string) => `${Number(iso.slice(8))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
export const longDay = (iso: string) => `${DOW[dow(iso)]} ${shortDay(iso)}`
export const monthLabel = (iso: string) => `${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`
export const clampDay = (iso: string, min: string, max: string) => (iso < min ? min : iso > max ? max : iso)

// Giorno corrente / giorno di un istante, in ora di Bucarest
const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: BUSINESS_TZ, year: 'numeric', month: '2-digit', day: '2-digit' })
export const bucharestDay = (d: Date | string) => dayFmt.format(typeof d === 'string' ? new Date(d) : d)
export const bucharestTime = (d: string) =>
  new Intl.DateTimeFormat('ro-RO', { timeZone: BUSINESS_TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(d))

// Mezzanotte di Bucarest di un giorno, come istante UTC (serve solo al ripiego senza funzioni SQL)
function tzOffsetMs(utcMs: number): number {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: BUSINESS_TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(new Date(utcMs)).map(x => [x.type, x.value])
  )
  return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second) - utcMs
}
export function bucharestMidnightUtc(day: string): Date {
  const guess = toUTC(day)
  let utc = guess - tzOffsetMs(guess)
  const off2 = tzOffsetMs(utc)
  if (utc !== guess - off2) utc = guess - off2 // giorno di cambio ora legale
  return new Date(utc)
}

// ── Formattazione ─────────────────────────────────────────────────────
export const nf = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
export const money = (n: number, cur: string) => `${nf(n)} ${cur.toUpperCase()}`
export function revenueText(cur: CurTotals, order: string[] = []): string {
  const keys = Object.keys(cur).filter(c => cur[c].revenue > 0)
  keys.sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99) || a.localeCompare(b))
  return keys.length ? keys.map(c => money(cur[c].revenue, c)).join(' + ') : '—'
}

// ── Aggregazione ──────────────────────────────────────────────────────
export const emptyAgg = (): DayAgg => ({ sales: 0, bumps: 0, cur: {}, prod: {} })

function addCur(into: CurTotals, c: string, sales: number, revenue: number) {
  const t = (into[c] ??= { sales: 0, revenue: 0 })
  t.sales += sales
  t.revenue += revenue
}

export function mergeAgg(into: DayAgg, from: DayAgg): DayAgg {
  into.sales += from.sales
  into.bumps += from.bumps
  for (const c of Object.keys(from.cur)) addCur(into.cur, c, from.cur[c].sales, from.cur[c].revenue)
  for (const p of Object.keys(from.prod)) {
    const t = (into.prod[p] ??= { sales: 0, cur: {} })
    t.sales += from.prod[p].sales
    for (const c of Object.keys(from.prod[p].cur)) addCur(t.cur, c, from.prod[p].cur[c].sales, from.prod[p].cur[c].revenue)
  }
  return into
}

// Indice giorno → totali, filtrato per prodotto (null = tutti)
export function indexDaily(rows: DailyRow[], productId: string | null): Map<string, DayAgg> {
  const idx = new Map<string, DayAgg>()
  for (const r of rows) {
    const pid = r.product_id ?? NO_PRODUCT
    if (productId !== null && pid !== productId) continue
    const cur = r.currency.toLowerCase()
    const a = idx.get(r.day) ?? emptyAgg()
    a.sales += r.sales
    a.bumps += r.bumps
    addCur(a.cur, cur, r.sales, r.revenue)
    const p = (a.prod[pid] ??= { sales: 0, cur: {} })
    p.sales += r.sales
    addCur(p.cur, cur, r.sales, r.revenue)
    idx.set(r.day, a)
  }
  return idx
}

export function buildBuckets(days: string[], gran: Gran, idx: Map<string, DayAgg>): Bucket[] {
  const out: Bucket[] = []
  const byKey = new Map<string, Bucket>()
  for (const day of days) {
    const key = gran === 'day' ? day : gran === 'week' ? weekStart(day) : day.slice(0, 7)
    let b = byKey.get(key)
    if (!b) {
      b = { key, from: day, to: day, label: '', long: '', agg: emptyAgg() }
      byKey.set(key, b)
      out.push(b)
    }
    b.to = day
    const a = idx.get(day)
    if (a) mergeAgg(b.agg, a)
  }
  for (const b of out) {
    if (gran === 'day') { b.label = shortDay(b.from); b.long = longDay(b.from) }
    else if (gran === 'week') { b.label = shortDay(b.from); b.long = b.from === b.to ? longDay(b.from) : `${shortDay(b.from)} – ${shortDay(b.to)}` }
    else { b.label = MONTHS[Number(b.key.slice(5)) - 1]; b.long = monthLabel(b.key + '-01') }
  }
  return out
}

export const sumBuckets = (buckets: Bucket[]): DayAgg => buckets.reduce((acc, b) => mergeAgg(acc, b.agg), emptyAgg())
export const sumDays = (days: string[], idx: Map<string, DayAgg>): DayAgg =>
  days.reduce((acc, d) => { const a = idx.get(d); return a ? mergeAgg(acc, a) : acc }, emptyAgg())

// Variazione % rispetto al periodo precedente; null se non confrontabile
export function pctChange(now: number, before: number): number | null {
  if (before <= 0) return null
  return Math.round(((now - before) / before) * 100)
}

// Migliore periodo per numero di vendite (a parità, il più recente)
export function bestBucket(buckets: Bucket[]): Bucket | null {
  let best: Bucket | null = null
  for (const b of buckets) if (b.agg.sales > 0 && (!best || b.agg.sales >= best.agg.sales)) best = b
  return best
}

// Ripiego quando le funzioni SQL non sono ancora installate: aggrega gli acquisti grezzi (giorno in ora di Bucarest)
export function aggregateRaw(rows: RawPurchase[]): DailyRow[] {
  const m = new Map<string, DailyRow>()
  for (const r of rows) {
    const day = bucharestDay(r.created_at)
    const cur = (r.currency ?? 'eur').toLowerCase()
    const key = `${day}|${r.product_id ?? ''}|${cur}`
    const t = m.get(key) ?? { day, product_id: r.product_id, currency: cur, sales: 0, revenue: 0, bumps: 0 }
    t.sales += 1
    t.revenue += r.amount ?? 0
    if (r.bump_included) t.bumps += 1
    m.set(key, t)
  }
  return [...m.values()].sort((a, b) => a.day.localeCompare(b.day))
}

// Colori per prodotto (si ciclano se in futuro ci sono più prodotti)
export const PRODUCT_COLORS = [
  { fg: '#8A008D', bg: '#FBEBFB', bar: '#B800BA' },
  { fg: '#5A00C2', bg: '#EFE6FE', bar: '#6B00E8' },
  { fg: '#0B6B49', bg: '#E3F6EE', bar: '#12875F' },
  { fg: '#8A5300', bg: '#FDF1DC', bar: '#B36A00' },
] as const
export const productLabel = (p: Pick<ProductInfo, 'slug'>) => p.slug.charAt(0).toUpperCase() + p.slug.slice(1)

// ── Periodi predefiniti (Azi, Ieri, Săptămâna aceasta, …) ─────────────────────────────
export type RangeKey = 'today' | 'yesterday' | 'week' | 'month' | 'lastmonth' | 7 | 30 | 90 | 365 | 'custom'
export const isSingleDay = (r: RangeKey) => r === 'today' || r === 'yesterday'

export const monthStart = (iso: string) => iso.slice(0, 8) + '01'
export const lastDayOfMonth = (iso: string) => {
  const [y, m] = iso.split('-').map(Number)
  return fromUTC(Date.UTC(y, m, 0)) // giorno 0 del mese successivo = ultimo giorno di questo mese
}

export function rangeBounds(r: RangeKey, today: string, custom?: { from: string; to: string }, minDay?: string): { from: string; to: string } {
  switch (r) {
    case 'today': return { from: today, to: today }
    case 'yesterday': { const y = addDays(today, -1); return { from: y, to: y } }
    case 'week': return { from: weekStart(today), to: today }
    case 'month': return { from: monthStart(today), to: today }
    case 'lastmonth': { const end = addDays(monthStart(today), -1); return { from: monthStart(end), to: end } }
    case 'custom': {
      const c = custom ?? { from: today, to: today }
      let a = c.from, b = c.to
      if (a > b) [a, b] = [b, a]
      if (minDay) { a = clampDay(a, minDay, today); b = clampDay(b, minDay, today) }
      else { a = a > today ? today : a; b = b > today ? today : b }
      return { from: a, to: b }
    }
    default: return { from: addDays(today, -(r - 1)), to: today }
  }
}

// Periodo con cui confrontare: per i periodi "fino a oggi" si confronta la stessa porzione del periodo precedente
export function compareBounds(r: RangeKey, from: string, to: string): { from: string; to: string; label: string } {
  if (r === 'today') return { from: addDays(from, -1), to: addDays(from, -1), label: 'față de ieri' }
  if (r === 'yesterday') return { from: addDays(from, -1), to: addDays(from, -1), label: 'față de ziua precedentă' }
  if (r === 'week') return { from: addDays(from, -7), to: addDays(to, -7), label: 'față de săptămâna trecută (aceeași perioadă)' }
  if (r === 'month') {
    const pf = monthStart(addDays(from, -1))
    const pt = addDays(pf, Number(to.slice(8)) - 1)
    const pl = lastDayOfMonth(pf)
    return { from: pf, to: pt > pl ? pl : pt, label: 'față de luna trecută (aceeași perioadă)' }
  }
  if (r === 'lastmonth') {
    const pe = addDays(from, -1)
    return { from: monthStart(pe), to: pe, label: 'față de luna precedentă' }
  }
  const len = dayDiff(from, to) + 1
  return { from: addDays(from, -len), to: addDays(from, -1), label: 'față de perioada anterioară' }
}

export const RANGE_LABEL: Record<string, string> = {
  today: 'azi', yesterday: 'ieri', week: 'săptămâna aceasta', month: 'luna aceasta', lastmonth: 'luna trecută',
}
export function rangeNote(r: RangeKey, from: string, to: string): string {
  if (typeof r === 'string' && r !== 'custom') return RANGE_LABEL[r]
  if (r === 365) return 'ultimele 12 luni'
  if (typeof r === 'number') return `ultimele ${r} zile`
  return from === to ? shortDay(from) : `${shortDay(from)} – ${shortDay(to)}`
}

// ── Dettaglio orario (per Azi / Ieri) ─────────────────────────────────────────────────
export type HourRow = { hour: number; product_id: string | null; currency: string; sales: number; revenue: number; bumps: number }
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: BUSINESS_TZ, hour: '2-digit', hourCycle: 'h23' })
export const bucharestHour = (d: Date | string) => Number(hourFmt.format(typeof d === 'string' ? new Date(d) : d))

export function indexHourly(rows: HourRow[], productId: string | null): Map<number, DayAgg> {
  const idx = new Map<number, DayAgg>()
  for (const r of rows) {
    const pid = r.product_id ?? NO_PRODUCT
    if (productId !== null && pid !== productId) continue
    const cur = r.currency.toLowerCase()
    const a = idx.get(r.hour) ?? emptyAgg()
    a.sales += r.sales
    a.bumps += r.bumps
    addCur(a.cur, cur, r.sales, r.revenue)
    const p = (a.prod[pid] ??= { sales: 0, cur: {} })
    p.sales += r.sales
    addCur(p.cur, cur, r.sales, r.revenue)
    idx.set(r.hour, a)
  }
  return idx
}

const hh = (h: number) => String(h).padStart(2, '0')
// 24 ore del giorno (se è oggi, solo fino all'ora corrente)
export function buildHourBuckets(day: string, lastHour: number, idx: Map<number, DayAgg>): Bucket[] {
  return Array.from({ length: lastHour + 1 }, (_, h) => ({
    key: `${day}T${hh(h)}`, from: day, to: day, label: hh(h),
    long: `${hh(h)}:00 – ${hh((h + 1) % 24)}:00`, agg: idx.get(h) ?? emptyAgg(),
  }))
}

export function aggregateRawHourly(rows: RawPurchase[]): HourRow[] {
  const m = new Map<string, HourRow>()
  for (const r of rows) {
    const hour = bucharestHour(r.created_at)
    const cur = (r.currency ?? 'eur').toLowerCase()
    const key = `${hour}|${r.product_id ?? ''}|${cur}`
    const t = m.get(key) ?? { hour, product_id: r.product_id, currency: cur, sales: 0, revenue: 0, bumps: 0 }
    t.sales += 1
    t.revenue += r.amount ?? 0
    if (r.bump_included) t.bumps += 1
    m.set(key, t)
  }
  return [...m.values()].sort((a, b) => a.hour - b.hour)
}
