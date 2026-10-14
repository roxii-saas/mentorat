import { createHash } from 'crypto'
import type Stripe from 'stripe'

// Meta Conversions API (server → Meta). Si attiva solo se sono impostati
// NEXT_PUBLIC_META_PIXEL_ID e META_CAPI_TOKEN, e solo per chi ha accettato i cookie di marketing.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID
const TOKEN = process.env.META_CAPI_TOKEN
const TEST_CODE = process.env.META_TEST_EVENT_CODE // opzionale: per provare in Events Manager → Test events
const GRAPH_VERSION = process.env.META_GRAPH_VERSION ?? 'v23.0'

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex')

// Meta vuole i dati normalizzati (minuscolo, senza spazi) e poi hashati SHA-256
export const hashEmail = (email: string) => sha256(email.trim().toLowerCase())
export const hashText = (t: string) => sha256(t.trim().toLowerCase())

// Telefono: solo cifre con prefisso internazionale. I numeri romeni 07xx… → 407xx…
export function normalizePhone(raw: string): string | null {
  let d = raw.replace(/\D/g, '')
  if (!d) return null
  if (d.startsWith('00')) d = d.slice(2)
  else if (d.startsWith('0') && d.length === 10) d = '40' + d.slice(1)
  else if (d.length === 9 && d.startsWith('7')) d = '40' + d
  return d.length >= 8 ? d : null
}
export const hashPhone = (raw: string) => {
  const n = normalizePhone(raw)
  return n ? sha256(n) : undefined
}

// Dati del browser da salvare nei metadata del PaymentIntent al momento del checkout.
// Se non c'è consenso non si salva NIENTE (nemmeno IP e user agent).
export function metaMetadataFromRequest(
  req: Request,
  ctx: { consent?: string; fbp?: string; fbc?: string; url?: string }
): Record<string, string> {
  if (ctx.consent !== '1') return { meta_consent: '0' }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? ''
  return {
    meta_consent: '1',
    meta_fbp: (ctx.fbp ?? '').slice(0, 200),
    meta_fbc: (ctx.fbc ?? '').slice(0, 300),
    meta_url: (ctx.url ?? '').slice(0, 300),
    meta_ip: ip.slice(0, 64),
    meta_ua: (req.headers.get('user-agent') ?? '').slice(0, 400),
  }
}

type PurchaseInfo = { name?: string; email: string; phone?: string; contentId: string }

// Purchase lato server. event_id = id del PaymentIntent: è lo stesso che il browser invia
// dalla pagina di ringraziamento, così Meta conta UNA sola vendita (deduplicazione).
// Non lancia mai errori: un problema con Meta non deve toccare webhook, database o email.
export async function sendMetaPurchase(pi: Stripe.PaymentIntent, info: PurchaseInfo): Promise<void> {
  if (!PIXEL_ID || !TOKEN) return
  if (pi.metadata?.meta_consent !== '1') {
    console.log('[Meta] Purchase non inviato: nessun consenso marketing')
    return
  }

  const [first, ...rest] = (info.name ?? '').trim().split(/\s+/).filter(Boolean)
  const user = {
    em: [hashEmail(info.email)],
    ph: info.phone ? [hashPhone(info.phone)].filter(Boolean) : undefined,
    fn: first ? [hashText(first)] : undefined,
    ln: rest.length ? [hashText(rest.join(' '))] : undefined,
    fbp: pi.metadata.meta_fbp || undefined,
    fbc: pi.metadata.meta_fbc || undefined,
    client_ip_address: pi.metadata.meta_ip || undefined,
    client_user_agent: pi.metadata.meta_ua || undefined,
  }

  const body = {
    data: [{
      event_name: 'Purchase',
      event_time: Math.floor(Date.now() / 1000),
      event_id: pi.id,
      action_source: 'website',
      event_source_url: pi.metadata.meta_url || undefined,
      user_data: user,
      custom_data: {
        value: pi.amount / 100,
        currency: pi.currency.toUpperCase(),
        content_ids: [info.contentId],
        content_type: 'product',
        order_id: pi.id,
      },
    }],
    ...(TEST_CODE ? { test_event_code: TEST_CODE } : {}),
  }

  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${PIXEL_ID}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(4000),
    })
    const text = await res.text()
    if (!res.ok) console.error('[Meta] CAPI errore:', res.status, text)
    else console.log('[Meta] Purchase inviato:', pi.id, text)
  } catch (e) {
    console.error('[Meta] CAPI fetch fallita:', e)
  }
}
