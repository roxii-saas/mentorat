import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendAdminSaleEmail, sendDeliveryEmail } from '@/lib/delivery'
import type { Product } from '@/lib/products'

async function callEdgeFunction(
  email: string, name: string,
  amount?: number, currency?: string, phone?: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    console.error('[Webhook] Mancano env Supabase')
    return
  }
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
      body: JSON.stringify({ email, name, amount, currency, phone }),
    })
    const text = await res.text()
    if (!res.ok) console.error('[Webhook] Edge Function errore:', res.status, text)
    else console.log('[Webhook] Email inviate:', text)
  } catch (e) {
    console.error('[Webhook] Edge Function fetch fallita:', e)
  }
}

async function handleDigitalPurchase(
  pi: Stripe.PaymentIntent, slug: string,
  c: { email: string; fullName: string; phone: string }
) {
  const supabase = createAdminClient()
  const { data: product } = await supabase.from('products').select('*').eq('slug', slug).single<Product>()
  if (!product) {
    console.error('[Webhook] Prodotto non trovato:', slug)
    return
  }

  // Stripe può reinviare lo stesso evento: email solo la prima volta
  const { data: existing } = await supabase
    .from('purchases').select('id').eq('stripe_payment_intent_id', pi.id).maybeSingle()
  if (existing) {
    console.log('[Webhook] Acquisto già registrato:', pi.id)
    return
  }

  const { data: purchase, error } = await supabase.from('purchases').insert({
    name: c.fullName || null,
    email: c.email,
    phone: c.phone || null,
    amount: Math.round(pi.amount / 100),
    currency: pi.currency,
    stripe_payment_intent_id: pi.id,
    product_id: product.id,
    bump_included: pi.metadata?.bump === '1',
  }).select('id, name, email, phone, amount, currency, bump_included').single()

  if (error || !purchase) {
    console.error('[Webhook] Errore salvataggio acquisto digitale:', error)
    return
  }

  // await necessario su Vercel (altrimenti il processo viene chiuso prima dell'invio)
  const results = await Promise.allSettled([
    sendDeliveryEmail(purchase, product),
    sendAdminSaleEmail(purchase, product),
  ])
  results.forEach((r, i) => {
    if (r.status === 'rejected') console.error(`[Webhook] Email ${i ? 'admin' : 'cliente'} fallita:`, r.reason)
    else if (r.value.error) console.error(`[Webhook] Resend ${i ? 'admin' : 'cliente'}:`, r.value.error)
  })
  console.log('[Webhook] Prodotto digitale consegnato:', slug, c.email)
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

    // Prodotto digitale (es. /prompturi): salva + email di consegna
    const productSlug = pi.metadata?.product_slug
    if (productSlug) {
      await handleDigitalPurchase(pi, productSlug, { email, fullName, phone })
      return NextResponse.json({ received: true })
    }

    // Salva acquisto nel database
    try {
      const supabase = createAdminClient()
      const { data: mentorat } = await supabase.from('products').select('id').eq('slug', 'mentorat').single()
      const { error: dbError } = await supabase.from('purchases').upsert({
        name: fullName || null,
        email,
        phone: phone || null,
        amount: Math.round(pi.amount / 100),
        currency: pi.currency,
        stripe_payment_intent_id: pi.id,
        ...(mentorat ? { product_id: mentorat.id } : {}),
      }, { onConflict: 'stripe_payment_intent_id' })
      if (dbError) console.error('[Webhook] Errore salvataggio DB:', dbError)
      else console.log('[Webhook] Acquisto salvato nel DB per:', email)
    } catch (e) {
      console.error('[Webhook] Errore DB:', e)
    }

    // Invia email — await necessario su Vercel (altrimenti il processo viene killato prima)
    await callEdgeFunction(email, fullName || email, pi.amount / 100, pi.currency, phone)
  }

  return NextResponse.json({ received: true })
}
