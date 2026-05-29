import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/resend'
import { generatePassword } from '@/lib/utils'

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

    const email = pi.metadata?.customer_email || pi.receipt_email
    const fullName = pi.metadata?.customer_name || ''

    if (!email) {
      console.error('No email in payment intent:', pi.id)
      return NextResponse.json({ error: 'No email' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Controlla se esiste già un utente con questo email
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      await supabase.from('profiles').update({
        purchased_at: new Date().toISOString(),
        stripe_payment_intent_id: pi.id,
      }).eq('id', existingUser.id)
      return NextResponse.json({ received: true })
    }

    const tempPassword = generatePassword(14)

    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name: fullName, role: 'client' },
    })

    if (error || !newUser.user) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: 'Could not create user' }, { status: 500 })
    }

    await supabase.from('profiles').update({
      full_name: fullName,
      stripe_payment_intent_id: pi.id,
      purchased_at: new Date().toISOString(),
    }).eq('id', newUser.user.id)

    await sendWelcomeEmail({ to: email, name: fullName || email, password: tempPassword })
  }

  return NextResponse.json({ received: true })
}
