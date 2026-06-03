'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface OrderInfo {
  clientSecret: string
  amount: number
  currency: string
  productName: string
}

const stripeAppearance = {
  theme: 'flat' as const,
  variables: {
    colorPrimary: '#ED03E9',
    colorBackground: '#ffffff',
    colorText: '#0A0A0A',
    colorDanger: '#ef4444',
    fontFamily: 'Inter, system-ui, sans-serif',
    spacingUnit: '4px',
    borderRadius: '14px',
    colorTextSecondary: '#737373',
    colorTextPlaceholder: '#ABABAB',
    colorIcon: '#737373',
  },
  rules: {
    '.Input': {
      backgroundColor: '#FAFAFA',
      border: '1.5px solid rgba(0,0,0,0.09)',
      boxShadow: 'none',
      padding: '13px 16px',
      fontSize: '15px',
      transition: 'border 0.15s',
    },
    '.Input:focus': {
      border: '1.5px solid #ED03E9',
      boxShadow: '0 0 0 3px rgba(237,3,233,0.10)',
      backgroundColor: '#fff',
    },
    '.Input::placeholder': {
      color: '#ABABAB',
    },
    '.Label': {
      fontWeight: '600',
      fontSize: '11px',
      color: '#737373',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      marginBottom: '8px',
    },
    '.Tab': {
      border: '1.5px solid rgba(0,0,0,0.08)',
      borderRadius: '14px',
      backgroundColor: '#FAFAFA',
      boxShadow: 'none',
      padding: '12px',
    },
    '.Tab--selected': {
      border: '1.5px solid #ED03E9',
      backgroundColor: '#FDF0FD',
      boxShadow: '0 0 0 1px #ED03E9',
    },
    '.Tab:hover': {
      border: '1.5px solid rgba(237,3,233,0.35)',
      backgroundColor: '#FDF8FD',
    },
    '.TabIcon--selected': { color: '#ED03E9' },
    '.TabLabel--selected': { color: '#ED03E9' },
    '.Block': {
      backgroundColor: '#FAFAFA',
      border: '1.5px solid rgba(0,0,0,0.07)',
      borderRadius: '14px',
    },
    '.CheckboxInput': {
      border: '1.5px solid rgba(0,0,0,0.12)',
      borderRadius: '6px',
    },
    '.CheckboxInput--checked': {
      backgroundColor: '#ED03E9',
      border: '1.5px solid #ED03E9',
    },
  },
}

export default function CheckoutPage() {
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stripe/payment-intent', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        console.log('[Checkout] PaymentIntent response:', data)
        if (data.error) setError(data.error)
        else setOrder(data)
      })
      .catch(err => {
        console.error('[Checkout] PaymentIntent fetch error:', err)
        setError('Eroare la inițializarea plății.')
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#ED03E9]/20 border-t-[#ED03E9] animate-spin" />
        <p className="text-[#737373] font-sans text-sm">Se inițializează plata...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="w-7 h-7">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="font-serif font-bold text-2xl text-[#0A0A0A] mb-2">Eroare</h2>
        <p className="text-[#737373] font-sans text-sm mb-6 leading-relaxed">{error}</p>
        <Link href="/" className="inline-flex items-center gap-2 text-[#ED03E9] hover:underline font-sans text-sm font-semibold">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M10 4L4 10l6 6M4 10h12" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Înapoi la site
        </Link>
      </div>
    </div>
  )

  if (!order) return null

  return (
    <Elements
      stripe={stripePromise}
      options={{ clientSecret: order.clientSecret, appearance: stripeAppearance, locale: 'ro' }}
    >
      <CheckoutForm order={order} />
    </Elements>
  )
}

function CheckoutForm({ order }: { order: OrderInfo }) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError('Te rugăm să completezi toate câmpurile obligatorii.')
      return
    }
    setSubmitting(true)
    setError('')

    await fetch('/api/stripe/update-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientSecret: order.clientSecret, name, email, phone }),
    })

    console.log('[Checkout] Calling confirmPayment...')
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: { billing_details: { name, email, phone } },
      },
    })

    if (result.error) {
      console.error('[Checkout] confirmPayment error:', result.error)
      setError(result.error.message ?? 'Eroare la procesarea plății.')
      setSubmitting(false)
    }
  }

  const price = formatPrice(order.amount, order.currency.toUpperCase())

  return (
    <div className="min-h-screen bg-[#FAFAFA]">

      {/* ── Header ── */}
      <header className="bg-white border-b border-black/[.06] px-5 h-16 flex items-center">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center group">
            <Image src="/logo.png" alt="Mentorat cu Roxana" width={140} height={46}
              className="h-11 w-auto object-contain group-hover:scale-105 transition-transform duration-300"
              priority/>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-[#737373] font-sans">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2" className="w-3.5 h-3.5 flex-shrink-0">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Plată securizată SSL
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        <div className="grid lg:grid-cols-5 gap-6 lg:gap-10 items-start">

          {/* ── Form (left on desktop) ── */}
          <div className="lg:col-span-3 order-1 lg:order-1">
            <div className="bg-white rounded-3xl border border-black/[.06] p-6 sm:p-8 shadow-sm">

              <h1 className="font-serif font-bold text-[#0A0A0A] text-2xl sm:text-3xl mb-2">Finalizează comanda</h1>
              <p className="text-[#737373] font-sans text-sm mb-7">Completează datele de mai jos pentru a finaliza plata.</p>

              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Date personale */}
                <div>
                  <p className="text-[11px] font-bold text-[#ABABAB] font-sans uppercase tracking-[.12em] mb-3">Date personale</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#3D3D3D] mb-1.5 font-sans">
                        Nume complet <span className="text-[#ED03E9]">*</span>
                      </label>
                      <input
                        type="text" value={name} onChange={e => setName(e.target.value)}
                        placeholder="Prenume Nume" required
                        className="w-full bg-[#FAFAFA] border border-black/[.09] rounded-xl px-4 py-3 font-sans text-[15px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/12 focus:border-[#ED03E9]/60 placeholder:text-[#ABABAB] transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#3D3D3D] mb-1.5 font-sans">
                        Email <span className="text-[#ED03E9]">*</span>
                      </label>
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="adresa@email.com" required
                        className="w-full bg-[#FAFAFA] border border-black/[.09] rounded-xl px-4 py-3 font-sans text-[15px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/12 focus:border-[#ED03E9]/60 placeholder:text-[#ABABAB] transition-colors"
                      />
                      <p className="text-[11px] text-[#ABABAB] font-sans mt-1">Datele de acces vor fi trimise pe acest email</p>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-[#3D3D3D] mb-1.5 font-sans">
                        Număr de telefon <span className="text-[#ED03E9]">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pointer-events-none">
                          <svg viewBox="0 0 20 20" fill="none" stroke="#ABABAB" strokeWidth="1.8" className="w-4 h-4">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <input
                          type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          placeholder="+40 7XX XXX XXX" required
                          className="w-full bg-[#FAFAFA] border border-black/[.09] rounded-xl pl-10 pr-4 py-3 font-sans text-[15px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/12 focus:border-[#ED03E9]/60 placeholder:text-[#ABABAB] transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-[#ABABAB] font-sans mt-1">Folosit pentru comunicare legată de sesiunea ta</p>
                    </div>
                  </div>
                </div>

                {/* Plată */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-[#ABABAB] font-sans uppercase tracking-[.12em]">Metodă de plată</p>
                    <div className="flex items-center gap-1.5">
                      {/* Card logos */}
                      {['V','M','A'].map((c,i) => (
                        <div key={i} className="w-7 h-5 bg-[#FAFAFA] border border-black/[.08] rounded-md flex items-center justify-center">
                          <span className="text-[9px] font-bold text-[#3D3D3D]">{c}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl overflow-hidden border border-black/[.06] p-4 bg-[#FAFAFA]">
                    <PaymentElement
                      options={{
                        layout: 'tabs',
                        wallets: { applePay: 'auto', googlePay: 'auto' },
                        fields: { billingDetails: { name: 'never', email: 'never', phone: 'never' } },
                        terms: { card: 'never' },
                      }}
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 font-sans flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button type="submit" disabled={submitting || !stripe}
                  className="group relative w-full bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white font-sans font-bold py-4 rounded-2xl transition-all shadow-xl shadow-[#ED03E9]/25 hover:shadow-[#ED03E9]/40 hover:shadow-2xl active:scale-[.99] disabled:opacity-60 flex items-center justify-center gap-2.5 text-base overflow-hidden">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />
                  {submitting ? (
                    <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Se procesează...</>
                  ) : (
                    <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/></svg>Plătește securizat · {price}</>
                  )}
                </button>

                <p className="text-center text-xs text-[#ABABAB] font-sans leading-relaxed">
                  Plata este procesată securizat prin Stripe. Prin finalizarea comenzii accepți{' '}
                  <Link href="/" className="text-[#ED03E9] hover:underline">termenii și condițiile</Link>.
                </p>

              </form>
            </div>
          </div>

          {/* ── Order summary (right on desktop) ── */}
          <div className="lg:col-span-2 order-2 lg:order-2">
            <div className="bg-white rounded-3xl border border-black/[.06] p-6 sm:p-7 shadow-sm lg:sticky lg:top-6">

              {/* Product */}
              <div className="flex items-start gap-4 pb-5 border-b border-black/[.05] mb-5">
                <div className="flex-shrink-0 w-14 h-auto flex items-center justify-center">
                  <Image src="/logo.png" alt="Mentorat cu Roxana" width={56} height={56} className="w-14 h-auto object-contain"/>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-serif font-bold text-[#0A0A0A] text-base leading-snug">{order.productName}</p>
                  <p className="text-[#737373] font-sans text-xs mt-1">Rezervare loc · Mentorat 1:1</p>
                  <div className="flex items-center gap-0.5 mt-1.5">
                    {[...Array(5)].map((_,i) => (
                      <svg key={i} viewBox="0 0 16 16" fill="#ED03E9" className="w-3 h-3">
                        <path d="M8 1l1.854 3.756L14 5.528l-3 2.923.708 4.128L8 10.5l-3.708 2.079L5 8.45 2 5.528l4.146-.772L8 1z"/>
                      </svg>
                    ))}
                    <span className="text-[10px] text-[#737373] font-sans ml-1">5.0 · 200+ recenzii</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2.5 mb-5">
                {[
                  'Sesiune 1:1 cu Roxana (60 min)',
                  'Strategie personalizată de promovare',
                  'Plan acțiune lunar detaliat',
                  'Scripturi pentru atragerea clientelor',
                  'Suport prin platformă post-sesiune',
                  'Acces imediat după plată',
                ].map(item => (
                  <div key={item} className="flex items-start gap-2.5">
                    <div className="w-4.5 h-4.5 w-[18px] h-[18px] rounded-full bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.5" className="w-2.5 h-2.5">
                        <path d="M2 6l2.5 2.5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <span className="text-[#3D3D3D] font-sans text-xs leading-relaxed">{item}</span>
                  </div>
                ))}
              </div>

              {/* Price */}
              <div className="border-t border-black/[.05] pt-5">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-sans font-semibold text-[#737373] text-sm">Taxă de rezervare</span>
                  <span className="font-serif font-bold text-2xl text-[#0A0A0A]">{price}</span>
                </div>
                <p className="text-[11px] text-[#ABABAB] font-sans text-right">Nu este costul integral al programului</p>
              </div>

              {/* Reservation note */}
              <div className="mt-3 bg-[#F3EEFF] border border-[#ED03E9]/15 rounded-xl px-3.5 py-3">
                <p className="text-[11px] text-[#B800BA] font-sans font-semibold leading-relaxed">
                  ℹ️ Prin această plată îți rezervi locul în program. Roxana te va contacta pentru a stabili împreună pașii următori.
                </p>
              </div>

              {/* Guarantee */}
              <div className="mt-4 bg-[#ED03E9]/5 border border-[#ED03E9]/12 rounded-2xl p-3.5">
                <div className="flex items-start gap-2.5">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-4.5 h-4.5 w-[18px] h-[18px] flex-shrink-0 mt-0.5">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <div>
                    <p className="text-xs font-bold text-[#B800BA] font-sans">Garanție 100%</p>
                    <p className="text-[11px] text-[#737373] font-sans mt-0.5 leading-relaxed">Dacă după prima sesiune nu ești mulțumită, returnăm integral suma — fără întrebări.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
