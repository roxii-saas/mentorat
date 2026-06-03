import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePassword } from '@/lib/utils'

// Fire-and-forget: non blocca il webhook, Stripe riceve 200 immediatamente
function callEdgeFunction(
  email: string, name: string, userId: string, password: string,
  amount?: number, currency?: string, phone?: string
) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-welcome-email`
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ email, name, userId, password, amount, currency, phone }),
  })
    .then(async res => {
      if (!res.ok) console.error('Edge Function error:', res.status, await res.text())
      else console.log('Edge Function ok — email inviata a:', email)
    })
    .catch(e => console.error('Edge Function fetch failed:', e))
}

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent

    // Email / nome / telefono: da metadata → billing_details del payment method
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
        console.error('Could not fetch payment method:', e)
      }
    }

    if (!email) {
      console.error('No email found in payment intent:', pi.id)
      return NextResponse.json({ received: true, warning: 'no email' })
    }

    const supabase = createAdminClient()

    // Utente già esistente → aggiorna profilo e reinvia email
    const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
    const existingUser = users?.find(u => u.email === email)

    if (existingUser) {
      await supabase.from('profiles').update({
        purchased_at: new Date().toISOString(),
        stripe_payment_intent_id: pi.id,
        ...(phone && { phone }),
      }).eq('id', existingUser.id)

      // Genera nuova password temporanea e invia email
      const tempPassword = generatePassword(14)
      await supabase.auth.admin.updateUserById(existingUser.id, { password: tempPassword })
      callEdgeFunction(email, fullName || email, existingUser.id, tempPassword, pi.amount / 100, pi.currency, phone)
      return NextResponse.json({ received: true })
    }

    // Nuovo utente
    const tempPassword = generatePassword(14)
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'client' },
    })

    if (createError || !newUser.user) {
      console.error('Error creating user:', createError)
      return NextResponse.json({ error: 'Could not create user' }, { status: 500 })
    }

    await supabase.from('profiles').update({
      full_name: fullName,
      stripe_payment_intent_id: pi.id,
      purchased_at: new Date().toISOString(),
      ...(phone && { phone }),
    }).eq('id', newUser.user.id)

    // Fire-and-forget: restituiamo 200 a Stripe subito
    callEdgeFunction(email, fullName || email, newUser.user.id, tempPassword, pi.amount / 100, pi.currency, phone)
  }

  return NextResponse.json({ received: true })
}
