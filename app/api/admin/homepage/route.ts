import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED = [
  'comparison_price',
  'cta_text', 'cta_show_price', 'secondary_cta_text', 'cta_badge_text',
  'header_cta_text', 'header_cta_show_price',
  'instagram_url', 'instagram_visible',
  'facebook_url', 'facebook_visible',
  'hero_image_url', 'mentor_image_url',
]

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_settings')
    .select('comparison_price, cta_text, cta_show_price, secondary_cta_text, cta_badge_text, header_cta_text, header_cta_show_price, instagram_url, instagram_visible, facebook_url, facebook_visible, hero_image_url, mentor_image_url')
    .single()
  return NextResponse.json(data ?? {})
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const body = await req.json()
  // Only allow whitelisted fields
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ALLOWED) {
    if (key in body) update[key] = body[key]
  }

  const { data, error } = await supabase
    .from('platform_settings')
    .update(update)
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 403 })
  return NextResponse.json(data)
}
