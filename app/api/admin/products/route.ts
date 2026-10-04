import { NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { isAdminRequest } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PRODUCT_FILES_BUCKET, PRODUCTS_TAG } from '@/lib/products'

const EDITABLE = [
  'name', 'price_amount', 'compare_price', 'currency', 'sales_active',
  'bump_active', 'bump_name', 'bump_description', 'bump_price',
  'email_subject', 'email_body',
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
  const { action, id, target, filename, path } = await req.json()
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
