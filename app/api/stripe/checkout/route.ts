import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()

  // Leggi prezzo e nome prodotto dal database
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('price_amount, currency, product_name, product_description, sales_active')
    .single()

  if (!settings?.sales_active) {
    return NextResponse.json({ error: 'Sales are currently disabled' }, { status: 403 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: (settings.currency ?? 'eur').toLowerCase(),
          product_data: {
            name: settings.product_name ?? 'Mentorat Premium cu Roxana',
            description: settings.product_description ?? '',
          },
          unit_amount: (settings.price_amount ?? 297) * 100, // centesimi
        },
        quantity: 1,
      },
    ],
    billing_address_collection: 'required',
    customer_creation: 'always',
    // Raccogliamo il nome e il telefono per creare il profilo
    custom_fields: [
      {
        key: 'full_name',
        label: { type: 'custom', custom: 'Numele tău complet' },
        type: 'text',
      },
    ],
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/#buy`,
    locale: 'ro',
  })

  return NextResponse.json({ url: session.url })
}
