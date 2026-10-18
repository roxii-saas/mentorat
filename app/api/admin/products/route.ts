import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { isAdminRequest } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PRODUCT_FILES_BUCKET, PRODUCTS_TAG } from '@/lib/products'
import { slugError } from '@/lib/product-slug'

const EDITABLE = [
  'name', 'price_amount', 'compare_price', 'currency', 'sales_active',
  'bump_active', 'bump_name', 'bump_description', 'bump_price',
  'email_subject', 'email_body', 'cover_url', 'landing',
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
