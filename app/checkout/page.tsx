'use client'

import { useEffect, useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface OrderInfo {
  clientSecret: string
  amount: number
  currency: string
  productName: string
}

export default function CheckoutPage() {
  const [order, setOrder] = useState<OrderInfo | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/stripe/payment-intent', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else setOrder(data)
      })
      .catch(() => setError('Eroare la inițializarea plății.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-[#c97d4e] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-sans text-sm">Se inițializează plata...</p>
      </div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" className="w-8 h-8">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
          </svg>
        </div>
        <h2 className="font-serif font-bold text-xl text-gray-900 mb-2">Eroare</h2>
        <p className="text-gray-600 font-sans text-sm mb-5">{error}</p>
        <Link href="/" className="inline-flex items-center gap-2 text-[#c97d4e] hover:underline font-sans text-sm">
          ← Înapoi la site
        </Link>
      </div>
    </div>
  )

  if (!order) return null

  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#c97d4e',
      colorBackground: '#ffffff',
      colorText: '#1a1a1a',
      colorDanger: '#ef4444',
      fontFamily: 'Inter, system-ui, sans-serif',
      spacingUnit: '4px',
      borderRadius: '12px',
    },
    rules: {
      '.Input': {
        border: '1.5px solid #e5e7eb',
        boxShadow: 'none',
        padding: '12px 16px',
        fontSize: '16px',
      },
      '.Input:focus': {
        border: '1.5px solid #c97d4e',
        boxShadow: '0 0 0 3px rgba(201, 125, 78, 0.15)',
      },
      '.Label': {
        fontWeight: '600',
        fontSize: '14px',
        color: '#374151',
        marginBottom: '6px',
      },
      '.Tab': {
        border: '1.5px solid #e5e7eb',
        borderRadius: '12px',
      },
      '.Tab--selected': {
        border: '1.5px solid #c97d4e',
        backgroundColor: '#fff8f3',
      },
    },
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret: order.clientSecret, appearance, locale: 'ro' }}>
      <CheckoutForm order={order} />
    </Elements>
  )
}

function CheckoutForm({ order }: { order: OrderInfo }) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    if (!name.trim() || !email.trim()) {
      setError('Te rugăm să completezi numele și email-ul.')
      return
    }
    setSubmitting(true)
    setError('')

    // Aggiorna PaymentIntent con email (per il webhook)
    await fetch('/api/stripe/update-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientSecret: order.clientSecret,
        name, email,
      }),
    })

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
        payment_method_data: {
          billing_details: { name, email },
        },
      },
    })

    if (result.error) {
      setError(result.error.message ?? 'Eroare la procesarea plății.')
      setSubmitting(false)
    }
  }

  const price = formatPrice(order.amount, order.currency.toUpperCase())

  return (
    <div className="min-h-screen bg-[#fdf8f3]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-gray-900">Roxana<span className="text-[#c97d4e]">.</span></span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500 font-sans">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" className="w-4 h-4">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Plată securizată SSL
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
        <div className="grid lg:grid-cols-5 gap-6 sm:gap-8">

          {/* Order summary */}
          <div className="lg:col-span-2 order-2 lg:order-1">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm sticky top-6">
              <h2 className="font-serif font-bold text-gray-900 text-lg mb-4">Rezumatul comenzii</h2>

              <div className="flex items-start gap-3 pb-4 border-b border-gray-100 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 font-sans text-sm">{order.productName}</p>
                  <p className="text-gray-500 font-sans text-xs mt-0.5">Sesiune 1:1 · Acces platformă</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {['Sesiune 1:1 (60 min)', 'Strategie personalizată', 'Plan acțiune lunar', 'Suport post-sesiune'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="2.5" className="w-3.5 h-3.5 flex-shrink-0">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-gray-700 font-sans text-xs">{item}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-semibold text-gray-700">Total</span>
                  <span className="font-serif font-bold text-2xl text-gray-900">{price}</span>
                </div>
                <p className="text-xs text-gray-400 font-sans mt-1">O singură plată · Fără abonament</p>
              </div>

              <div className="mt-4 flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
                </svg>
                <p className="text-xs text-gray-500 font-sans">Plata este procesată securizat prin Stripe</p>
              </div>
            </div>
          </div>

          {/* Checkout form */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h1 className="font-serif font-bold text-gray-900 text-xl sm:text-2xl mb-6">
                Finalizează comanda
              </h1>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Dati personali */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">
                      Nume complet <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Prenume Nume"
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/30 focus:border-[#c97d4e] bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="adresa@email.com"
                      required
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/30 focus:border-[#c97d4e] bg-white text-gray-900"
                    />
                    <p className="text-xs text-gray-400 font-sans mt-1">Datele de acces vor fi trimise pe acest email</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3 font-sans">Detalii card</p>
                  <PaymentElement
                    options={{
                      layout: 'tabs',
                      fields: { billingDetails: 'never' },
                    }}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-sans flex items-start gap-2">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                    </svg>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !stripe}
                  className="w-full bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-bold py-4 rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 text-base sm:text-lg"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Se procesează...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                        <rect x="3" y="11" width="18" height="11" rx="2"/>
                        <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
                      </svg>
                      Plătește {price}
                    </>
                  )}
                </button>

                <p className="text-center text-xs text-gray-400 font-sans">
                  Prin finalizarea comenzii accepți{' '}
                  <Link href="/" className="text-[#c97d4e] hover:underline">termenii și condițiile</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
