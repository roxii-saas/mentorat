import type { Gran, RangeKey } from '@/lib/admin-analytics'

// Filtri dell'Overview ricordati tra un aggiornamento della pagina e l'altro (cookie funzionale dell'admin, 1 anno).
// Si salva il NOME del periodo ("today"), non le date: "Azi" resta "Azi" anche domani.
export type OverviewFilters = { product: string; range: RangeKey; gran: Gran; from?: string; to?: string }

export const FILTER_COOKIE = 'ov_filters'
export const DEFAULT_FILTERS: OverviewFilters = { product: 'all', range: 'today', gran: 'day' }

const RANGES: RangeKey[] = ['today', 'yesterday', 'week', 'month', 'lastmonth', 7, 30, 90, 365, 'custom']
const GRANS: Gran[] = ['day', 'week', 'month']
const ISO = /^\d{4}-\d{2}-\d{2}$/
const minusDays = (iso: string, n: number) => new Date(Date.parse(iso) - n * 86400000).toISOString().slice(0, 10)

export function serializeFilters(f: OverviewFilters): string {
  return JSON.stringify({ p: f.product, r: f.range, g: f.gran, ...(f.range === 'custom' ? { f: f.from, t: f.to } : {}) })
}

// Legge il cookie in modo difensivo: qualunque valore non valido torna al default (Azi, tutti i prodotti)
export function parseFilters(raw: string | undefined, productIds: string[], today: string): OverviewFilters {
  if (!raw) return { ...DEFAULT_FILTERS }
  let o: Record<string, unknown> | null = null
  for (const candidate of [raw, safeDecode(raw)]) {
    try { const v = JSON.parse(candidate); if (v && typeof v === 'object') { o = v as Record<string, unknown>; break } } catch {}
  }
  if (!o) return { ...DEFAULT_FILTERS }

  const range = RANGES.includes(o.r as RangeKey) ? (o.r as RangeKey) : DEFAULT_FILTERS.range
  const gran = GRANS.includes(o.g as Gran) ? (o.g as Gran) : DEFAULT_FILTERS.gran
  const product = o.p === 'all' || (typeof o.p === 'string' && productIds.includes(o.p)) ? (o.p as string) : 'all'
  const out: OverviewFilters = { product, range, gran }
  if (range === 'custom') {
    const okDate = (v: unknown): v is string => typeof v === 'string' && ISO.test(v) && !Number.isNaN(Date.parse(v))
    if (okDate(o.f) && okDate(o.t)) { out.from = o.f; out.to = o.t }
    else { out.from = minusDays(today, 29); out.to = today }
  }
  return out
}

function safeDecode(s: string) { try { return decodeURIComponent(s) } catch { return s } }

export function writeFiltersCookie(f: OverviewFilters) {
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${FILTER_COOKIE}=${encodeURIComponent(serializeFilters(f))}; path=/; max-age=31536000; SameSite=Lax${secure}`
}
