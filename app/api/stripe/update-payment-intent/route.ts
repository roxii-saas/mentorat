import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export async function POST(req: Request) {
  const { clientSecret, name, email } = await req.json()

  // Estrae il PaymentIntent ID dal client_secret
  const paymentIntentId = clientSecret.split('_secret_')[0]

  await stripe.paymentIntents.update(paymentIntentId, {
    metadata: { customer_name: name, customer_email: email },
    receipt_email: email,
  })

  return NextResponse.json({ success: true })
}
