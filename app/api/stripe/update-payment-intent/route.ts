import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const { clientSecret, name, email, phone } = await req.json()

  const paymentIntentId = clientSecret.split('_secret_')[0]

  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: { customer_name: name, customer_email: email, customer_phone: phone ?? '' },
    receipt_email: email,
  })

  return NextResponse.json({ success: true })
}
