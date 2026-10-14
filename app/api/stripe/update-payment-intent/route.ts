import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { metaMetadataFromRequest } from '@/lib/meta/capi'

export async function POST(req: Request) {
  const { clientSecret, name, email, phone, meta } = await req.json()

  const paymentIntentId = clientSecret.split('_secret_')[0]

  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: {
      customer_name: name, customer_email: email, customer_phone: phone ?? '',
      // Dati per Meta Conversions API: vuoti se la cliente non ha accettato i cookie di marketing
      ...metaMetadataFromRequest(req, meta ?? {}),
    },
    receipt_email: email,
  })

  return NextResponse.json({ success: true })
}
