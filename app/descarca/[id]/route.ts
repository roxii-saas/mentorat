import type { NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { PRODUCT_FILES_BUCKET } from '@/lib/products'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Link permanente inviato via email: l'id dell'acquisto (uuid) fa da token.
// Ogni click genera un link firmato Supabase valido pochi minuti.
export async function GET(req: NextRequest, ctx: RouteContext<'/descarca/[id]'>) {
  const { id } = await ctx.params
  if (!UUID.test(id)) return new Response('Link invalid', { status: 404 })
  const wantsBonus = req.nextUrl.searchParams.get('f') === 'bonus'

  const supabase = createAdminClient()
  const { data: purchase } = await supabase
    .from('purchases')
    .select('bump_included, products(file_path, bump_file_path)')
    .eq('id', id)
    .single()

  const product = purchase?.products as unknown as { file_path: string | null; bump_file_path: string | null } | null
  const path = wantsBonus
    ? (purchase?.bump_included ? product?.bump_file_path : null)
    : product?.file_path
  if (!path) return new Response('Fișierul nu a fost găsit. Scrie-ne și te ajutăm imediat.', { status: 404 })

  const { data, error } = await supabase.storage
    .from(PRODUCT_FILES_BUCKET)
    .createSignedUrl(path, 60 * 10, { download: true })
  if (error || !data) return new Response('Eroare temporară, încearcă din nou.', { status: 500 })

  return Response.redirect(data.signedUrl, 302)
}
