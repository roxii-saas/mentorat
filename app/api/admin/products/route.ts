import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { isAdminRequest } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PRODUCT_FILES_BUCKET, PRODUCTS_TAG } from '@/lib/products'
import { slugError } from '@/lib/product-slug'
import { adminRecipients, sendAdminSaleEmail } from '@/lib/delivery'

const EDITABLE = [
  'name', 'price_amount', 'compare_price', 'currency', 'sales_active',
  'bump_active', 'bump_name', 'bump_description', 'bump_price',
  'email_subject', 'email_body', 'cover_url', 'landing',
  'promo_type', 'promo_value', 'promo_starts_at', 'promo_ends_at', 'notify_admin', 'notify_copy', 'notify_emails',
] as const

const deny = () => NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

function invalidate(slug: string) {
  revalidateTag(PRODUCTS_TAG, { expire: 0 })
  revalidatePath(`/${slug}`)
  revalidatePath(`/${slug}/checkout`)
}

export async function GET() {
  if (!(await isAdminRequest())) return deny()
  const { data, error } = await createAdminClient()
    .from('products').select('*').eq('kind', 'digital').order('created_at')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  if (!(await isAdminRequest())) return deny()
  const body = await req.json()
  if (!body.id) return NextResponse.json({ error: 'id mancante' }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const k of EDITABLE) if (k in body) update[k] = body[k]

  // Notifiche admin: destinatari validi (max 5), booleani veri
  if ('notify_emails' in body) {
    const raw = String(body.notify_emails ?? '').split(/[,;\s]+/).map((x: string) => x.trim()).filter(Boolean)
    if (raw.some((x: string) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(x))) return NextResponse.json({ error: 'Una dintre adresele de email nu este validă.' }, { status: 400 })
    if (raw.length > 5) return NextResponse.json({ error: 'Maxim 5 adrese de email.' }, { status: 400 })
    update.notify_emails = raw.length ? raw.join(', ') : null
  }
  for (const k of ['notify_admin', 'notify_copy'] as const) if (k in body) update[k] = body[k] === true

  // Promoție programată: tip + valoare + (opțional) început/sfârșit
  if ('promo_type' in body) {
    if (!body.promo_type) {
      Object.assign(update, { promo_type: null, promo_value: null, promo_starts_at: null, promo_ends_at: null })
    } else {
      const val = Math.round(Number(body.promo_value))
      if (!['price', 'percent'].includes(body.promo_type)) return NextResponse.json({ error: 'Tip de promoție invalid.' }, { status: 400 })
      if (!Number.isFinite(val) || val < 1) return NextResponse.json({ error: 'Valoarea promoției trebuie să fie cel puțin 1.' }, { status: 400 })
      if (body.promo_type === 'percent' && val > 99) return NextResponse.json({ error: 'Reducerea poate fi cel mult 99%.' }, { status: 400 })
      const ok = (v: unknown) => v == null || v === '' || !Number.isNaN(Date.parse(String(v)))
      if (!ok(body.promo_starts_at) || !ok(body.promo_ends_at)) return NextResponse.json({ error: 'Dată invalidă.' }, { status: 400 })
      if (body.promo_starts_at && body.promo_ends_at && Date.parse(body.promo_ends_at) <= Date.parse(body.promo_starts_at)) return NextResponse.json({ error: 'Sfârșitul promoției trebuie să fie după început.' }, { status: 400 })
      update.promo_value = val
      update.promo_starts_at = body.promo_starts_at || null
      update.promo_ends_at = body.promo_ends_at || null
    }
  }

  const { data, error } = await createAdminClient()
    .from('products').update(update).eq('id', body.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  invalidate(data.slug)
  return NextResponse.json(data)
}

// Upload del file venduto (PDF/ZIP/…) nel bucket privato, in due passi:
// 1) action 'sign'    → link di upload firmato (il browser carica direttamente su Supabase: niente limite 4,5MB di Vercel)
// 2) action 'confirm' → salva il percorso sul prodotto
export async function POST(req: Request) {
  if (!(await isAdminRequest())) return deny()
  const body = await req.json()
  const { action, id, target, filename, path } = body

  // Email de test către destinatarii notificărilor (cu setările SALVATE ale produsului)
  if (action === 'test-notify') {
    const { data: product } = await createAdminClient().from('products').select('*').eq('id', id).single()
    if (!product) return NextResponse.json({ error: 'Produs inexistent.' }, { status: 404 })
    const sample = { id: 'test', name: 'Client Test', email: 'client.test@exemplu.ro', phone: '0700 000 000', amount: product.price_amount, currency: product.currency, bump_included: false }
    const to = adminRecipients(product)
    const { error } = await sendAdminSaleEmail(sample, product, true)
    if (error) return NextResponse.json({ error: `Resend: ${error.message}` }, { status: 500 })
    return NextResponse.json({ ok: true, to })
  }

  // Produs nou: pagina lui apare pe /<slug>; pornește cu vânzările oprite până când admin o activează
  if (action === 'create') {
    const slug = String(body.slug ?? '').trim().toLowerCase()
    const name = String(body.name ?? '').trim()
    const price = Number(body.price_amount)
    const err = slugError(slug)
    if (err) return NextResponse.json({ error: err }, { status: 400 })
    if (name.length < 3) return NextResponse.json({ error: 'Scrie numele produsului.' }, { status: 400 })
    if (!Number.isFinite(price) || price < 1) return NextResponse.json({ error: 'Prețul trebuie să fie cel puțin 1.' }, { status: 400 })
    const currency = body.currency === 'eur' ? 'eur' : 'ron'
    const { data, error } = await createAdminClient().from('products').insert({
      slug, name: name.slice(0, 200), kind: 'digital', price_amount: Math.round(price), currency,
      sales_active: false, bump_active: false,
      email_subject: `${name.slice(0, 120)} — accesul tău`,
      email_body: 'Bună, {nume}!\n\nÎți mulțumesc pentru comandă. Găsești materialele mai jos.\n\nCu drag,\nRoxii',
      landing: {},
    }).select('*').single()
    if (error) {
      const dup = error.code === '23505'
      return NextResponse.json({ error: dup ? 'Există deja un produs cu acest slug.' : error.message }, { status: dup ? 409 : 400 })
    }
    invalidate(slug)
    return NextResponse.json(data)
  }

  const column = target === 'bump' ? 'bump_file_path' : 'file_path'
  if (!id) return NextResponse.json({ error: 'Date lipsă' }, { status: 400 })

  const supabase = createAdminClient()
  const { data: product } = await supabase.from('products').select('slug').eq('id', id).single()
  if (!product) return NextResponse.json({ error: 'Produs inexistent' }, { status: 404 })

  if (action === 'sign') {
    const ext = String(filename ?? '').split('.').pop()?.toLowerCase() ?? ''
    if (!['pdf', 'zip', 'epub', 'mp4', 'mov'].includes(ext)) {
      return NextResponse.json({ error: 'Format acceptat: PDF, ZIP, EPUB, MP4, MOV' }, { status: 400 })
    }
    // Nome leggibile per chi scarica: <slug>[-bonus]-<timestamp>.<ext>
    const newPath = `${product.slug}/${product.slug}${column === 'bump_file_path' ? '-bonus' : ''}-${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from(PRODUCT_FILES_BUCKET).createSignedUploadUrl(newPath)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ path: data.path, token: data.token })
  }

  if (action === 'confirm') {
    if (typeof path !== 'string' || !path.startsWith(`${product.slug}/`)) {
      return NextResponse.json({ error: 'Percorso invalid' }, { status: 400 })
    }
    const { data, error } = await supabase.from('products')
      .update({ [column]: path, updated_at: new Date().toISOString() }).eq('id', id).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Acțiune necunoscută' }, { status: 400 })
}
