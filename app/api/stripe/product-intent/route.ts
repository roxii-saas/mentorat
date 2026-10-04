import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Crea il PaymentIntent per un prodotto digitale. Il prezzo arriva SEMPRE dal DB, mai dal client.
export async function POST(req: Request) {
  const { slug, bump, name, email, phone } = await req.json()
  if (!slug || !email || !name) {
    return NextResponse.json({ error: 'Completează numele și emailul.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: product } = await supabase
    .from('products')
    .select('slug, name, kind, price_amount, currency, sales_active, bump_active, bump_price')
    .eq('slug', slug)
    .single()

  if (!product || product.kind !== 'digital') {
    return NextResponse.json({ error: 'Produs inexistent.' }, { status: 404 })
  }
  if (!product.sales_active) {
    return NextResponse.json({ error: 'Vânzările sunt oprite momentan.' }, { status: 403 })
  }

  const withBump = !!bump && product.bump_active && !!product.bump_price
  const total = product.price_amount + (withBump ? product.bump_price! : 0)

  const pi = await stripe.paymentIntents.create({
    amount: total * 100,
    currency: product.currency.toLowerCase(),
    payment_method_types: ['card'],
    receipt_email: email,
    description: product.name + (withBump ? ' + upgrade' : ''),
    metadata: {
      product_slug: product.slug,
      bump: withBump ? '1' : '0',
      customer_name: String(name).slice(0, 200),
      customer_email: String(email).slice(0, 200),
      customer_phone: String(phone ?? '').slice(0, 50),
    },
  })

  return NextResponse.json({ clientSecret: pi.client_secret, amount: total })
}
