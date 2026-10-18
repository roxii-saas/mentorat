import { createHash } from 'crypto'
import { isPrivatePath } from '@/lib/private-paths'

// Statistici proprii, fără cookie-uri: regulile care rulează pe server (/api/track).
// Funcții pure → testabile. Nu se salvează niciodată IP-ul: se folosește doar la calculul codului anonim zilnic.

export type TrackEvent = 'pv' | 'hb' | 'scroll' | 'focus' | 'submit' | 'purchase' | 'click'
const EVENTS: TrackEvent[] = ['pv', 'hb', 'scroll', 'focus', 'submit', 'purchase', 'click']

// Roboți, previzualizări de link, monitorizare, browsere fără interfață
export const BOT_RE = /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp|telegram|discord|preview|curl\/|wget|python-|go-http|axios|node-fetch|java\/|libwww|phantom|selenium|puppeteer|playwright|httpclient/i

export type UA = { device: 'mobile' | 'tablet' | 'desktop'; browser: string; os: string; inApp: 'facebook' | 'instagram' | 'tiktok' | null }

export function parseUA(ua: string): UA {
  const inApp = /FBAN|FBAV|FB_IAB/i.test(ua) ? 'facebook' : /Instagram/i.test(ua) ? 'instagram' : /TikTok|musical_ly|BytedanceWebview|Bytedance/i.test(ua) ? 'tiktok' : null
  const device = /iPad|Tablet|(Android(?!.*Mobile))/i.test(ua) ? 'tablet' : /Mobi|iPhone|iPod|Android.*Mobile|Windows Phone/i.test(ua) ? 'mobile' : 'desktop'
  const browser =
    inApp === 'facebook' ? 'Facebook (în aplicație)' :
    inApp === 'instagram' ? 'Instagram (în aplicație)' :
    inApp === 'tiktok' ? 'TikTok (în aplicație)' :
    /Edg(e|A|iOS)?\//.test(ua) ? 'Edge' :
    /OPR\/|Opera/.test(ua) ? 'Opera' :
    /SamsungBrowser/.test(ua) ? 'Samsung Internet' :
    /Firefox|FxiOS/.test(ua) ? 'Firefox' :
    /CriOS|Chrome/.test(ua) ? 'Chrome' :
    /Safari/.test(ua) ? 'Safari' : 'Altul'
  const os = /iPhone|iPad|iPod/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /CrOS/.test(ua) ? 'ChromeOS' : /Mac OS X|Macintosh/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Altul'
  return { device, browser, os, inApp }
}

const lower = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().toLowerCase().slice(0, n) : '')
const SOURCE_ALIAS: Record<string, string> = { fb: 'facebook', ig: 'instagram', 'l.facebook.com': 'facebook', yt: 'youtube', tt: 'tiktok' }

// Sursa traficului: UTM > identificatori de reclame (fbclid/gclid/ttclid) > referrer > aplicația în care s-a deschis linkul
export function classifySource(i: { search?: string; ref?: string; ownHost: string; inApp: UA['inApp'] }): { source: string; medium: string; campaign: string; refHost: string } {
  const sp = new URLSearchParams((i.search ?? '').slice(0, 500))
  let refHost = ''
  try { if (i.ref) refHost = new URL(i.ref).hostname.replace(/^www\./, '').toLowerCase() } catch {}
  if (refHost === i.ownHost.replace(/^www\./, '').split(':')[0]) refHost = ''   // navigare internă
  const campaign = lower(sp.get('utm_campaign'), 100)
  const utmSource = lower(sp.get('utm_source'), 60)
  const utmMedium = lower(sp.get('utm_medium'), 40)

  if (utmSource) {
    const source = SOURCE_ALIAS[utmSource] ?? utmSource
    return { source, medium: utmMedium || (sp.has('fbclid') || sp.has('gclid') ? 'paid' : 'campanie'), campaign, refHost }
  }
  if (sp.has('fbclid')) return { source: 'facebook', medium: 'paid', campaign, refHost }
  if (sp.has('gclid')) return { source: 'google', medium: 'paid', campaign, refHost }
  if (sp.has('ttclid')) return { source: 'tiktok', medium: 'paid', campaign, refHost }
  if (refHost) {
    const map: [RegExp, string, string][] = [
      [/(^|\.)(facebook|fb)\.com$|^l\.facebook\.com$|^lm\.facebook\.com$|^m\.facebook\.com$/, 'facebook', 'social'],
      [/(^|\.)instagram\.com$/, 'instagram', 'social'],
      [/(^|\.)google\.[a-z.]+$/, 'google', 'organic'],
      [/(^|\.)bing\.com$/, 'bing', 'organic'],
      [/(^|\.)duckduckgo\.com$/, 'duckduckgo', 'organic'],
      [/(^|\.)youtube\.com$|^youtu\.be$/, 'youtube', 'social'],
      [/(^|\.)tiktok\.com$/, 'tiktok', 'social'],
      [/^t\.co$|(^|\.)(twitter|x)\.com$/, 'twitter', 'social'],
      [/(^|\.)linkedin\.com$|^lnkd\.in$/, 'linkedin', 'social'],
      [/(^|\.)whatsapp\.com$|^wa\.me$/, 'whatsapp', 'social'],
    ]
    for (const [re, source, medium] of map) if (re.test(refHost)) return { source, medium, campaign, refHost }
    return { source: refHost.slice(0, 60), medium: 'referral', campaign, refHost }
  }
  if (i.inApp) return { source: i.inApp, medium: 'în aplicație', campaign, refHost }
  return { source: 'direct', medium: '', campaign, refHost }
}

// Cod anonim al vizitatorului: se schimbă în fiecare zi, nu poate fi inversat fără sarea secretă; IP-ul nu se salvează.
export function visitorId(secret: string, day: string, ip: string, ua: string): string {
  return createHash('sha256').update(`${secret}|${day}|${ip}|${ua}`).digest('hex').slice(0, 32)
}

export function readGeo(h: { get(n: string): string | null }) {
  const num = (v: string | null, lo: number, hi: number) => { const n = v ? Number(v) : NaN; return Number.isFinite(n) && n >= lo && n <= hi ? Math.round(n * 100) / 100 : null }
  let city = h.get('x-vercel-ip-city') ?? ''
  try { city = decodeURIComponent(city) } catch {}
  const country = (h.get('x-vercel-ip-country') ?? '').toUpperCase()
  return {
    country: /^[A-Z]{2}$/.test(country) ? country : '',
    region: (h.get('x-vercel-ip-country-region') ?? '').slice(0, 40),
    city: city.slice(0, 80),
    lat: num(h.get('x-vercel-ip-latitude'), -90, 90),   // rotunjit la 2 zecimale (~1 km): poziție de oraș, nu de adresă
    lon: num(h.get('x-vercel-ip-longitude'), -180, 180),
  }
}

export type CleanBody = {
  e: TrackEvent; p: string; r: string; q: string; sw: number | null; l: string; s: number; ms: number
  d: string; pr: string; v: number | null; c: string; pi: string
}

// Validează și curăță ce trimite browserul (nu are încredere în nimic)
export function sanitizeBody(b: unknown): CleanBody | null {
  if (!b || typeof b !== 'object') return null
  const o = b as Record<string, unknown>
  if (!EVENTS.includes(o.e as TrackEvent)) return null
  let p = typeof o.p === 'string' ? o.p.split('?')[0].split('#')[0] : ''
  if (!/^\/[A-Za-z0-9\-_./]{0,150}$/.test(p) || p.includes('..')) return null
  if (p.length > 1) p = p.replace(/\/+$/, '')
  if (isPrivatePath(p)) return null
  const int = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : null)
  const pi = typeof o.pi === 'string' && /^pi_[A-Za-z0-9_]{5,80}$/.test(o.pi) ? o.pi : ''
  const pr = typeof o.pr === 'string' && /^[a-z0-9-]{1,40}$/.test(o.pr) ? o.pr : ''
  const c = typeof o.c === 'string' && /^[A-Za-z]{3}$/.test(o.c) ? o.c.toLowerCase() : ''
  const str = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '')
  return {
    e: o.e as TrackEvent, p, r: str(o.r, 300), q: str(o.q, 500), sw: int(o.sw, 100, 10000), l: str(o.l, 16),
    s: int(o.s, 0, 100) ?? 0, ms: int(o.ms, 0, 60000) ?? 0, d: str(o.d, 40).replace(/[^A-Za-z0-9_-]/g, ''), pr,
    v: int(o.v, 0, 1_000_000), c, pi,
  }
}

// Tot ce intră în funcția SQL track_visit (fără IP, fără date personale)
export function buildPayload(i: { body: CleanBody; vid: string; ua: UA; geo: ReturnType<typeof readGeo>; ownHost: string }) {
  const { body: b, vid, ua, geo } = i
  const src = b.e === 'pv' && (b.r || b.q) ? classifySource({ search: b.q, ref: b.r, ownHost: i.ownHost, inApp: ua.inApp }) : null
  const fallback = !src && ua.inApp ? { source: ua.inApp, medium: 'în aplicație', campaign: '', refHost: '' } : null
  const s = src ?? fallback ?? { source: 'direct', medium: '', campaign: '', refHost: '' }
  return {
    vid, ev: b.e, path: b.p, scroll: b.s, ms: b.ms, d: b.d, product: b.pr, value: b.v ?? '', cur: b.c, pi: b.pi,
    country: geo.country, region: geo.region, city: geo.city, lat: geo.lat ?? '', lon: geo.lon ?? '',
    device: ua.device, browser: ua.browser, os: ua.os, lang: b.l, sw: b.sw ?? '',
    src: s.source, med: s.medium, cmp: s.campaign, ref: s.refHost,
  }
}
