import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('platform_settings')
    .select('price_amount, currency, product_name, sales_active')
    .single()

  if (!settings?.sales_active) {
    return NextResponse.json({ error: 'Vânzările sunt dezactivate momentan.' }, { status: 403 })
  }

  const amount = (settings.price_amount ?? 297) * 100 // centesimi
  const currency = (settings.currency ?? 'eur').toLowerCase()

  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    automatic_payment_methods: { enabled: true },
    metadata: {
      product_name: settings.product_name ?? 'Mentorat Premium',
    },
  })

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    amount: settings.price_amount,
    currency: settings.currency,
    productName: settings.product_name,
  })
}
