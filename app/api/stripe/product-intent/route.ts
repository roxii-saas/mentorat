import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { metaMetadataFromRequest } from '@/lib/meta/capi'
import { quote } from '@/lib/checkout-price'

// Crea il PaymentIntent per un prodotto digitale. Il prezzo arriva SEMPRE dal DB, mai dal client.
export async function POST(req: Request) {
  const { slug, bump, code, name, email, phone, meta } = await req.json()
  if (!slug || !email || !name) {
    return NextResponse.json({ error: 'Completează numele și emailul.' }, { status: 400 })
  }

  const q = await quote(createAdminClient(), String(slug), code, !!bump)
  if (!q.ok) return NextResponse.json({ error: q.error }, { status: q.status })
  const { data: product } = await createAdminClient().from('products').select('slug, name').eq('slug', slug).single()
  if (!product) return NextResponse.json({ error: 'Produs inexistent.' }, { status: 404 })
  const withBump = q.bump > 0
  const total = q.total

  const pi = await stripe.paymentIntents.create({
    amount: total * 100,
    currency: q.currency.toLowerCase(),
    payment_method_types: ['card'],
    receipt_email: email,
    description: product.name + (withBump ? ' + upgrade' : ''),
    metadata: {
      product_slug: product.slug,
      bump: withBump ? '1' : '0',
      ...(q.code ? { discount_code: q.code.code, discount_amount: String(q.discount) } : {}),
      customer_name: String(name).slice(0, 200),
      customer_email: String(email).slice(0, 200),
      customer_phone: String(phone ?? '').slice(0, 50),
      ...metaMetadataFromRequest(req, meta ?? {}),
    },
  })

  return NextResponse.json({ clientSecret: pi.client_secret, amount: total })
}
