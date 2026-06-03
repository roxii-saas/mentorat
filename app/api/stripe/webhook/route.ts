import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePassword } from '@/lib/utils'

async function callEdgeFunction(
  email: string, name: string, userId: string, password: string,
  amount?: number, currency?: string, phone?: string
): Promise<void> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('[Webhook] MANCANO variabili env: NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
    return
  }

  const url = `${supabaseUrl}/functions/v1/send-welcome-email`
  console.log('[Webhook] Chiamata Edge Function:', url, '→ email:', email)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ email, name, userId, password, amount, currency, phone }),
    })
    const text = await res.text()
    if (!res.ok) {
      console.error('[Webhook] Edge Function errore:', res.status, text)
    } else {
      console.log('[Webhook] Edge Function ok:', text)
    }
  } catch (e) {
    console.error('[Webhook] Edge Function fetch fallita:', e)
  }
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    console.error('[Webhook] Nessuna stripe-signature')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Webhook] STRIPE_WEBHOOK_SECRET mancante nelle env vars!')
    return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Firma non valida:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log('[Webhook] Evento ricevuto:', event.type)

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    console.log('[Webhook] PaymentIntent:', pi.id, '— amount:', pi.amount, pi.currency)

    let email: string | null = pi.metadata?.customer_email || pi.receipt_email || null
    let fullName: string = pi.metadata?.customer_name || ''
    let phone: string = pi.metadata?.customer_phone || ''

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
      console.error('[Webhook] Nessuna email trovata nel PaymentIntent:', pi.id)
      return NextResponse.json({ received: true, warning: 'no_email' })
    }

    console.log('[Webhook] Email cliente:', email, '| Nome:', fullName)

    const supabase = createAdminClient()
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = users?.find(u => u.email === email)

    if (existingUser) {
      console.log('[Webhook] Utente esistente, aggiorno profilo:', existingUser.id)
      const tempPassword = generatePassword(14)
      await Promise.all([
        supabase.from('profiles').update({
          purchased_at: new Date().toISOString(),
          stripe_payment_intent_id: pi.id,
          ...(phone && { phone }),
        }).eq('id', existingUser.id),
        supabase.auth.admin.updateUserById(existingUser.id, { password: tempPassword }),
      ])
      await callEdgeFunction(email, fullName || email, existingUser.id, tempPassword, pi.amount / 100, pi.currency, phone)
      return NextResponse.json({ received: true })
    }

    console.log('[Webhook] Creo nuovo utente per:', email)
    const tempPassword = generatePassword(14)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'client' },
    })

    if (createError || !newUser.user) {
      console.error('[Webhook] Errore creazione utente:', createError)
      return NextResponse.json({ error: 'Could not create user' }, { status: 500 })
    }

    await supabase.from('profiles').update({
      full_name: fullName,
      stripe_payment_intent_id: pi.id,
      purchased_at: new Date().toISOString(),
      ...(phone && { phone }),
    }).eq('id', newUser.user.id)

    console.log('[Webhook] Utente creato:', newUser.user.id, '— invio email...')
    await callEdgeFunction(email, fullName || email, newUser.user.id, tempPassword, pi.amount / 100, pi.currency, phone)
  }

  return NextResponse.json({ received: true })
}
