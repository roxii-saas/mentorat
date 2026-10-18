// Tipuri și ajutoare pentru pagina "Live" (vizitatorii de pe site)
export type StageKey = 'browsing' | 'offer' | 'checkout' | 'form' | 'paying' | 'purchased'

export type LiveSession = {
  id: string; first_seen: string; last_seen: string
  country: string | null; region: string | null; city: string | null; lat: number | null; lon: number | null
  device: string | null; browser: string | null; os: string | null; lang: string | null; screen_w: number | null
  source: string | null; medium: string | null; campaign: string | null; referrer: string | null
  landing_path: string | null; current_path: string | null
  page_views: number; max_scroll: number; active_seconds: number
  stage: StageKey; stage_rank: number
  product_slug: string | null; cart_value: number | null; cart_currency: string | null; purchase_id: string | null
  purchase: { name: string | null; amount: number | null; currency: string | null } | null
}

export type Funnel = {
  visitors: number; offer: number; checkout: number; form: number; paying: number; purchased: number; avg_active: number
  scroll25: number; scroll50: number; scroll75: number; scroll100: number
}
export type Summary = {
  funnel: Funnel
  sources: { source: string; medium: string; n: number; checkout: number; purchased: number }[]
  campaigns: { campaign: string; source: string; n: number; checkout: number; purchased: number }[]
  countries: { country: string; n: number; checkout: number; purchased: number }[]
  cities: { city: string; country: string; lat: number | null; lon: number | null; n: number; checkout: number; purchased: number }[]
  devices: { device: string; n: number; purchased: number }[]
  browsers: { browser: string; n: number; purchased: number }[]
  pages: { path: string; views: number; visitors: number }[]
  heat: { lat: number; lon: number; n: number; hot: number }[]
}
export type SessionEvent = { at: string; event: string; path: string | null; data: Record<string, unknown> | null }

export const STAGES: { key: StageKey; rank: number; label: string; short: string; fg: string; bg: string; dot: string }[] = [
  { key: 'browsing',  rank: 0, label: 'Navighează',          short: 'Navighează',   fg: '#4B4B5E', bg: '#EEEEF4', dot: '#8A8AA0' },
  { key: 'offer',     rank: 1, label: 'Vede oferta',         short: 'Oferta',       fg: '#5A00C2', bg: '#EFE6FE', dot: '#7C3AED' },
  { key: 'checkout',  rank: 2, label: 'În checkout',         short: 'Checkout',     fg: '#8A5300', bg: '#FDF1DC', dot: '#D97706' },
  { key: 'form',      rank: 3, label: 'Completează datele',  short: 'Completează',  fg: '#9A3412', bg: '#FFEDD5', dot: '#EA580C' },
  { key: 'paying',    rank: 4, label: 'Plătește acum',       short: 'Plătește',     fg: '#B42318', bg: '#FDE8E6', dot: '#DC2626' },
  { key: 'purchased', rank: 5, label: 'A cumpărat',          short: 'A cumpărat',   fg: '#0B6B49', bg: '#E3F6EE', dot: '#16A34A' },
]
export const stageOf = (k: string) => STAGES.find(s => s.key === k) ?? STAGES[0]

export const ACTIVE_SEC = 90     // "pe site acum": ultima activitate în ultimele 90 s (bătaia de inimă vine la 30 s)
export const RECENT_SEC = 600    // "recent": ultimele 10 minute

const PAGE_LABELS: Record<string, string> = {
  '/': 'Pagina principală (Mentorat)',
  '/checkout': 'Checkout Mentorat',
  '/checkout/success': 'Mulțumim (Mentorat)',
  '/prompturi': 'Oferta Prompturi',
  '/prompturi/checkout': 'Checkout Prompturi',
  '/prompturi/multumim': 'Mulțumim (Prompturi)',
  '/termeni-si-conditii': 'Termeni și condiții',
  '/politica-de-confidentialitate': 'Confidențialitate',
  '/politica-de-cookie': 'Politica de cookie',
}
export const pageLabel = (p: string | null) => (p ? PAGE_LABELS[p] ?? p : '—')

export function secondsAgo(iso: string, now: number) { return Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000)) }
export function agoText(sec: number) {
  if (sec < 60) return `acum ${sec} s`
  if (sec < 3600) return `acum ${Math.floor(sec / 60)} min`
  return `acum ${Math.floor(sec / 3600)} h`
}
export function durationText(sec: number) {
  if (sec < 60) return `${sec} s`
  const m = Math.floor(sec / 60), s = sec % 60
  return m < 60 ? (s ? `${m} min ${s} s` : `${m} min`) : `${Math.floor(m / 60)} h ${m % 60} min`
}

const regionNames = (() => { try { return new Intl.DisplayNames(['ro'], { type: 'region' }) } catch { return null } })()
export function countryName(code: string | null) {
  if (!code || code === '??') return 'Necunoscut'
  try { return regionNames?.of(code) ?? code } catch { return code }
}
export const placeText = (s: Pick<LiveSession, 'city' | 'country'>) => [s.city, countryName(s.country)].filter(Boolean).join(', ') || 'Locație necunoscută'

const MEDIUM_TEXT: Record<string, string> = { paid: 'reclamă plătită', social: 'social', organic: 'căutare organică', referral: 'alt site', 'în aplicație': 'în aplicație', campanie: 'campanie' }
const SOURCE_TEXT: Record<string, string> = { facebook: 'Facebook', instagram: 'Instagram', google: 'Google', tiktok: 'TikTok', youtube: 'YouTube', twitter: 'X / Twitter', linkedin: 'LinkedIn', whatsapp: 'WhatsApp', bing: 'Bing', direct: 'Direct' }
export function sourceText(source: string | null, medium: string | null) {
  const s = source || 'direct'
  const name = SOURCE_TEXT[s] ?? s
  const m = medium ? MEDIUM_TEXT[medium] ?? medium : ''
  return m ? `${name} · ${m}` : name
}

export const money = (n: number | null, cur: string | null) => (n == null ? '' : `${Math.round(n).toLocaleString('ro-RO')} ${(cur ?? '').toUpperCase()}`.trim())
export const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)}%` : '—')

// Cum arată un eveniment din istoricul unui vizitator
export function eventText(e: SessionEvent): string {
  const d = e.data ?? {}
  switch (e.event) {
    case 'pv': return `A deschis: ${pageLabel(e.path)}`
    case 'scroll': return `A derulat până la ${d.scroll ?? '?'}% din ${pageLabel(e.path)}`
    case 'click': return d.d === 'buy' ? 'A apăsat pe butonul de cumpărare' : 'A apăsat pe un link spre checkout'
    case 'focus': return 'A început să completeze datele în formular'
    case 'submit': return `A apăsat pe „Plătește”${d.value ? ` (${money(Number(d.value), String(d.cur ?? ''))})` : ''}`
    case 'purchase': return `A cumpărat${d.value ? ` — ${money(Number(d.value), String(d.cur ?? ''))}` : ''}`
    default: return e.event
  }
}
