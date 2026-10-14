// Meta Pixel lato browser (solo client). Tutto è disattivato finché:
//  1) NEXT_PUBLIC_META_PIXEL_ID non è impostato, e
//  2) la visitatrice non ha accettato i cookie di marketing (GDPR / ePrivacy).
// Gli eventi richiesti PRIMA della scelta restano solo in memoria (nulla viene inviato)
// e partono se accetta; se rifiuta vengono scartati.

export const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? ''
export const META_ENABLED = /^\d{8,20}$/.test(PIXEL_ID)

const CONSENT_KEY = 'meta_consent'
const CONSENT_EVENT = 'meta-consent-change'
const CONSENT_TTL_MS = 180 * 24 * 60 * 60 * 1000 // si richiede di nuovo dopo ~6 mesi

export type ConsentState = 'granted' | 'denied' | 'unknown'
export type MetaParams = Record<string, string | number | boolean | string[] | undefined>

type Fbq = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue: unknown[][]
  push: Fbq
  loaded: boolean
  version: string
}
declare global {
  interface Window { fbq?: Fbq; _fbq?: Fbq }
}

export function getConsent(): ConsentState {
  if (typeof window === 'undefined') return 'unknown'
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY)
    if (!raw) return 'unknown'
    const { v, t } = JSON.parse(raw) as { v: ConsentState; t: number }
    if (Date.now() - t > CONSENT_TTL_MS) return 'unknown'
    return v === 'granted' || v === 'denied' ? v : 'unknown'
  } catch {
    return 'unknown'
  }
}

export function setConsent(v: 'granted' | 'denied') {
  try { window.localStorage.setItem(CONSENT_KEY, JSON.stringify({ v, t: Date.now() })) } catch {}
  if (v === 'granted') activate()
  else { queued.length = 0; clearMetaCookies() }
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function resetConsent() {
  try { window.localStorage.removeItem(CONSENT_KEY) } catch {}
  window.dispatchEvent(new Event(CONSENT_EVENT))
}

export function onConsentChange(cb: () => void) {
  window.addEventListener(CONSENT_EVENT, cb)
  return () => window.removeEventListener(CONSENT_EVENT, cb)
}

// Se ritira il consenso, rimuove i cookie Meta già presenti
function clearMetaCookies() {
  for (const name of ['_fbp', '_fbc']) {
    document.cookie = `${name}=; Max-Age=0; path=/`
    document.cookie = `${name}=; Max-Age=0; path=/; domain=.${location.hostname.split('.').slice(-2).join('.')}`
  }
}

function readCookie(name: string) {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`))
  return m ? decodeURIComponent(m[1]) : undefined
}

// Carica fbevents.js (idempotente). Lo stub mette in coda le chiamate fino al caricamento.
function ensurePixel() {
  if (!META_ENABLED || window.fbq) return
  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) fbq.callMethod(...args)
    else fbq.queue.push(args)
  } as Fbq
  fbq.push = fbq
  fbq.loaded = true
  fbq.version = '2.0'
  fbq.queue = []
  window.fbq = fbq
  window._fbq = fbq
  const s = document.createElement('script')
  s.async = true
  s.src = 'https://connect.facebook.net/en_US/fbevents.js'
  document.head.appendChild(s)
  window.fbq('init', PIXEL_ID)
}

type Queued = { name: string; params?: MetaParams; eventId?: string; path: string }
const queued: Queued[] = []

function send(name: string, params?: MetaParams, eventId?: string) {
  ensurePixel()
  // eventID = chiave di deduplicazione con la Conversions API (stesso id inviato dal server)
  window.fbq?.('track', name, params ?? {}, eventId ? { eventID: eventId } : undefined)
}

// Chiamata quando la visitatrice accetta (o all'avvio se aveva già accettato)
function activate() {
  ensurePixel()
  send('PageView')
  const here = location.pathname
  // solo gli eventi della pagina in cui si trova ora
  for (const q of queued.splice(0)) if (q.path === here) send(q.name, q.params, q.eventId)
}

export function trackPageView() {
  if (getConsent() === 'granted') send('PageView')
}

export function startIfConsented() {
  if (META_ENABLED && getConsent() === 'granted') ensurePixel()
}

export function trackMeta(name: string, params?: MetaParams, eventId?: string) {
  if (!META_ENABLED || typeof window === 'undefined') return
  const c = getConsent()
  if (c === 'granted') send(name, params, eventId)
  else if (c === 'unknown') queued.push({ name, params, eventId, path: location.pathname })
}

// Contesto da passare al server con il checkout, per la Conversions API.
// consent '1' solo se ha accettato: altrimenti il server NON invia nulla a Meta.
export function getMetaContext() {
  if (typeof window === 'undefined') return { consent: '0' as const }
  if (!META_ENABLED || getConsent() !== 'granted') return { consent: '0' as const }
  return {
    consent: '1' as const,
    fbp: readCookie('_fbp'),
    fbc: readCookie('_fbc'),
    url: location.href.split('?')[0],
  }
}
