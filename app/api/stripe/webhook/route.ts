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
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    if (session.payment_status !== 'paid') return NextResponse.json({ received: true })

    const email = session.customer_details?.email
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const fullName =
      session.custom_fields?.find(f => f.key === 'full_name')?.text?.value ||
      session.customer_details?.name ||
      ''

    const supabase = createAdminClient()

    // Controlla se esiste già un utente con questo email
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === email)

    if (existingUser) {
      // Aggiorna solo il purchased_at se già esiste
      await supabase.from('profiles').update({
        purchased_at: new Date().toISOString(),
        stripe_customer_id: session.customer as string,
        stripe_payment_intent_id: session.payment_intent as string,
      }).eq('id', existingUser.id)
      return NextResponse.json({ received: true })
    }

    // Crea nuovo utente
    const tempPassword = generatePassword(14)

    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'client',
      },
    })

    if (error || !newUser.user) {
      console.error('Error creating user:', error)
      return NextResponse.json({ error: 'Could not create user' }, { status: 500 })
    }

    // Aggiorna profilo con dati Stripe
    await supabase.from('profiles').update({
      full_name: fullName,
      stripe_customer_id: session.customer as string,
      stripe_payment_intent_id: session.payment_intent as string,
      purchased_at: new Date().toISOString(),
    }).eq('id', newUser.user.id)

    // Manda email di benvenuto con Resend
    await sendWelcomeEmail({ to: email, name: fullName || email, password: tempPassword })
  }

  return NextResponse.json({ received: true })
}
