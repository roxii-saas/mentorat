import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

async function callEdgeFunction(
  email: string, name: string,
  amount?: number, currency?: string, phone?: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('[Webhook] MANCANO env: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  const url = `${supabaseUrl}/functions/v1/send-welcome-email`
  console.log('[Webhook] Edge Function →', url, '| email:', email)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ email, name, amount, currency, phone }),
    })
    const text = await res.text()
    if (!res.ok) console.error('[Webhook] Edge Function errore:', res.status, text)
    else console.log('[Webhook] Email inviate con successo:', text)
  } catch (e) {
    console.error('[Webhook] Edge Function fetch fallita:', e)
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET mancante!')
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Firma non valida:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Webhook] Evento:', event.type)

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    console.log('[Webhook] PaymentIntent:', pi.id, pi.amount, pi.currency)

    // Estrai email / nome / telefono
    let email: string | null = pi.metadata?.customer_email || pi.receipt_email || null
    let fullName = pi.metadata?.customer_name || ''
    let phone = pi.metadata?.customer_phone || ''

    if (!email && pi.payment_method) {
      try {
        const pm = await stripe.paymentMethods.retrieve(pi.payment_method as string)
        email = pm.billing_details.email ?? null
        if (!fullName && pm.billing_details.name) fullName = pm.billing_details.name
        if (!phone && pm.billing_details.phone) phone = pm.billing_details.phone
      } catch (e) {
        console.error('[Webhook] Errore fetch PaymentMethod:', e)
      }
    }

    if (!email) {
      console.error('[Webhook] Nessuna email nel PaymentIntent:', pi.id)
      return NextResponse.json({ received: true, warning: 'no_email' })
    }

    console.log('[Webhook] Invio email a:', email, '| nome:', fullName)
    await callEdgeFunction(email, fullName || email, pi.amount / 100, pi.currency, phone)
  }

  return NextResponse.json({ received: true })
}
