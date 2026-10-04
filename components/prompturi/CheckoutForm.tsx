'use client'

import { useState } from 'react'
import Image from 'next/image'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import type { PublicProduct } from '@/lib/products'
import { Icon } from './Icon'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

const fmt = (n: number, c: string) => `${n.toLocaleString('ro-RO')} ${c.toUpperCase()}`

export default function CheckoutForm({ product }: { product: PublicProduct }) {
  const [bump, setBump] = useState(false)
  const hasBump = product.bump_active && !!product.bump_price
  const total = product.price_amount + (bump && hasBump ? product.bump_price! : 0)

  return (
    <div className="min-h-screen bg-ed-canvas">
      <header className="sticky top-0 z-50 bg-ed-canvas/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 max-w-[1080px] mx-auto px-5 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <a href="/prompturi" aria-label="Înapoi" className="w-11 h-11 -ml-2 flex items-center justify-center hover:text-ed-berry transition-colors">
              <Icon name="arrow_back_ios_new" className="text-[20px]" />
            </a>
            <Image src="/logo.png" alt="Roxii Dincă" width={84} height={28} className="h-7 w-auto object-contain" />
            <div className="flex flex-col ml-2">
              <span className="ed-eyebrow !tracking-[0.16em]">Roxii Dincă</span>
              <span className="text-[10px] leading-tight tracking-wider uppercase text-ed-muted/75 font-semibold">Checkout securizat</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-ed-mid px-2.5 py-1 rounded-full">
            <Icon name="lock" className="text-[14px] text-ed-berry" />
            <span className="text-[10px] font-semibold tracking-wider uppercase">SSL 256-bit</span>
          </div>
        </div>
      </header>

      {!product.sales_active ? (
        <div className="max-w-md mx-auto px-5 py-20 text-center">
          <h1 className="font-bodoni text-[28px] leading-9">Momentan indisponibil</h1>
          <p className="text-[15px] text-ed-muted mt-2">Vânzările sunt oprite temporar. Revino în curând!</p>
          <a href="/prompturi" className="inline-block mt-6 text-ed-berry font-semibold underline underline-offset-4">Înapoi la prezentare</a>
        </div>
      ) : (
        <div className="max-w-[1080px] mx-auto px-5 py-6 lg:py-10 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
          {/* Riepilogo (a destra su desktop) */}
          <div className="lg:col-span-5 lg:order-2 lg:sticky lg:top-24 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5 lg:hidden">
              <Title />
            </div>
            <div className="bg-ed-white p-4 rounded-lg ed-shadow border border-ed-line/60 flex flex-col gap-3.5">
              <div className="flex items-start gap-3">
                <div className="relative w-20 h-24 rounded overflow-hidden shrink-0 bg-ed-mid">
                  <Image src="/prompturi/cover.jpg" alt="50+ Prompturi Roxii Dincă" fill sizes="80px" className="object-cover" />
                </div>
                <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5">
                  <div className="flex flex-col gap-1">
                    <span className="ed-eyebrow !text-[10px] text-ed-berry">Ghid premium + bonusuri</span>
                    <h2 className="text-[14px] font-semibold leading-snug line-clamp-2">{product.name}</h2>
                    <div className="flex items-center gap-1 text-ed-muted text-[11px]">
                      <Icon name="auto_awesome" className="text-[13px] text-ed-berry" />
                      <span>Include 3 bonusuri exclusive</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="font-bodoni text-[22px] font-semibold">{fmt(product.price_amount, product.currency)}</span>
                    {!!product.compare_price && product.compare_price > product.price_amount && (
                      <>
                        <span className="text-[13px] text-ed-muted line-through opacity-70">{fmt(product.compare_price, product.currency)}</span>
                        <span className="ed-eyebrow !text-[10px] text-ed-berry bg-ed-rose/50 px-1.5 py-0.5 rounded">
                          -{Math.floor((1 - product.price_amount / product.compare_price) * 100)}%
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 bg-ed-low p-2.5 rounded text-[13px]">
                <div className="flex justify-between items-center">
                  <span className="text-ed-muted">Livrare:</span>
                  <span className="font-semibold text-ed-berry flex items-center gap-1"><Icon name="bolt" className="text-[14px]" />Instant (email)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-ed-muted">Format:</span>
                  <span className="font-medium">PDF digital</span>
                </div>
              </div>
            </div>

            {hasBump && (
              <label className={`block p-4 rounded-lg ed-shadow-md border cursor-pointer select-none transition-colors ${bump ? 'bg-[#ffd9de]/30 border-ed-berry/30' : 'bg-ed-white border-ed-line/60'}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={bump} onChange={e => setBump(e.target.checked)}
                    className="mt-0.5 w-5 h-5 rounded accent-[#b90c55] cursor-pointer shrink-0" />
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="bg-ed-rose text-[#3f0018] ed-eyebrow !text-[10px] px-1.5 py-0.5 rounded">Upgrade recomandat</span>
                      <span className="text-[14px] font-bold text-ed-berry">+{fmt(product.bump_price!, product.currency)}</span>
                    </div>
                    <span className="text-[14px] font-semibold leading-snug">DA, adaugă {product.bump_name}</span>
                    {product.bump_description && <p className="text-[13px] leading-5 text-ed-muted">{product.bump_description}</p>}
                  </div>
                </div>
              </label>
            )}

            <Guarantee className="hidden lg:flex" />
          </div>

          {/* Form */}
          <div className="lg:col-span-7 lg:order-1 mt-4 lg:mt-0">
            <div className="hidden lg:flex flex-col gap-1.5 mb-5"><Title /></div>
            <Elements
              stripe={stripePromise}
              options={{
                mode: 'payment',
                amount: total * 100,
                currency: product.currency.toLowerCase(),
                paymentMethodTypes: ['card'],
                locale: 'ro',
                appearance: {
                  theme: 'stripe',
                  variables: {
                    colorPrimary: '#111113', colorText: '#1b1c1a', colorDanger: '#ba1a1a',
                    colorBackground: '#ffffff', borderRadius: '4px', fontSizeBase: '15px',
                    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
                  },
                  rules: { '.Input': { border: '1px solid #e8e2d9', boxShadow: 'none' }, '.Input:focus': { border: '1px solid #111113', boxShadow: '0 0 0 2px rgba(185,12,85,0.1)' } },
                },
              }}>
              <PayForm slug={product.slug} bump={bump && hasBump} totalLabel={fmt(total, product.currency)} />
            </Elements>
            <Guarantee className="lg:hidden mt-4" />
          </div>
        </div>
      )}
    </div>
  )
}

function Title() {
  return (
    <>
      <div className="inline-flex items-center gap-1 self-start px-2 py-0.5 rounded-full bg-[#ffd9de]">
        <Icon name="verified" className="text-[13px] text-ed-berry" />
        <span className="ed-eyebrow !text-[10px] text-ed-berry">Ediție limitată digitală</span>
      </div>
      <h1 className="font-bodoni text-[26px] leading-[34px] lg:text-[36px] lg:leading-[44px] font-medium">Finalizează comanda</h1>
      <p className="text-[13px] leading-5 text-ed-muted">
        Primești instant colecția de 50+ prompturi AI și începi să creezi ședințe foto virtuale impecabile.
      </p>
    </>
  )
}

function Guarantee({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-ed-white p-4 rounded-lg ed-shadow border border-ed-line/60 flex-col gap-4 ${className.includes('hidden') ? className : `flex ${className}`}`}>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[['verified_user', 'Plată securizată'], ['restore', 'Garanție 14 zile'], ['all_inclusive', 'Acces instant & pe viață']].map(([i, t]) => (
          <div key={t} className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-ed-mid flex items-center justify-center text-ed-berry">
              <Icon name={i} className="text-[18px]" />
            </div>
            <span className="text-[11px] leading-tight font-semibold">{t}</span>
          </div>
        ))}
      </div>
      <div className="p-3.5 bg-ed-low rounded flex items-start gap-3">
        <Icon name="shield" className="text-[24px] text-ed-berry shrink-0 mt-0.5" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[14px] font-bold">Investiție 100% fără risc</span>
          <p className="text-[12px] leading-relaxed text-ed-muted">
            Dacă nu obții imagini spectaculoase folosind prompturile și indicațiile din ghid, scrie-ne în termen de 14 zile și primești toți banii înapoi, fără întrebări.
          </p>
        </div>
      </div>
    </div>
  )
}

const inputCls = 'w-full bg-ed-white border border-ed-line text-ed-ink placeholder:text-ed-soft px-3.5 py-2.5 rounded focus:outline-none focus:border-ed-black focus:ring-2 focus:ring-ed-berry/10 transition-all'

function PayForm({ slug, bump, totalLabel }: { slug: string; bump: boolean; totalLabel: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setBusy(true)
    setError('')

    const { error: submitError } = await elements.submit()
    if (submitError) {
      setError(submitError.message ?? 'Verifică datele cardului.')
      setBusy(false)
      return
    }

    const res = await fetch('/api/stripe/product-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, bump, name, email, phone }),
    })
    const data = await res.json()
    if (!res.ok || !data.clientSecret) {
      setError(data.error ?? 'A apărut o eroare. Încearcă din nou.')
      setBusy(false)
      return
    }

    const { error: payError } = await stripe.confirmPayment({
      elements,
      clientSecret: data.clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/prompturi/multumim`,
        payment_method_data: { billing_details: { name, email, phone } },
      },
    })
    // Arriviamo qui solo in caso di errore (altrimenti redirect)
    setError(payError?.message ?? 'Plata nu a putut fi procesată.')
    setBusy(false)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="bg-ed-white p-4 sm:p-5 rounded-lg ed-shadow border border-ed-line/60 flex flex-col gap-3.5">
        <Step n={1} title="Datele tale de contact" />
        <Field label="Nume și prenume *" icon="person">
          <input className={inputCls} value={name} onChange={e => setName(e.target.value)} required autoComplete="name" placeholder="ex. Roxana Popescu" />
        </Field>
        <Field label="Adresă de email *" icon="mail" badge="Livrare instantanee"
          hint="Vei primi linkul de descărcare pe această adresă în câteva secunde.">
          <input className={inputCls} type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="adresa.ta@exemplu.com" />
        </Field>
        <Field label="Număr de telefon *" icon="call">
          <input className={inputCls} type="tel" value={phone} onChange={e => setPhone(e.target.value)} required autoComplete="tel" placeholder="07xx xxx xxx" />
        </Field>
      </div>

      <div className="bg-ed-white p-4 sm:p-5 rounded-lg ed-shadow border border-ed-line/60 flex flex-col gap-3.5">
        <Step n={2} title="Metodă de plată" />
        <PaymentElement options={{
          layout: 'tabs',
          wallets: { applePay: 'auto', googlePay: 'auto' },
          fields: { billingDetails: { name: 'never', email: 'never', phone: 'never' } },
          terms: { card: 'never' },
        }} />
      </div>

      {error && (
        <div className="bg-[#ffdad6] text-[#93000a] text-[13px] rounded px-4 py-3">{error}</div>
      )}

      <div className="bg-ed-low p-3.5 rounded-lg flex items-center justify-between">
        <div className="flex flex-col">
          <span className="ed-eyebrow !text-[10px] text-ed-muted">Total de plată</span>
          <span className="text-[12px] text-ed-muted">Livrare digitală</span>
        </div>
        <span className="font-bodoni text-[22px] font-bold text-ed-berry">{totalLabel}</span>
      </div>

      <button type="submit" disabled={busy || !stripe}
        className="w-full py-4 bg-ed-berry hover:bg-ed-berry-hover disabled:opacity-60 text-white rounded-lg text-[14px] tracking-wider uppercase font-bold ed-shadow-md active:scale-[0.99] transition-all flex items-center justify-center gap-2">
        <Icon name="lock" className="text-[20px]" />
        {busy ? 'Se procesează…' : `Finalizează comanda – ${totalLabel}`}
      </button>
      <p className="text-[12px] text-center text-ed-muted flex items-center justify-center gap-1.5">
        <Icon name="forward_to_inbox" className="text-[15px] text-ed-berry" />
        Primești accesul pe email imediat după plată.
      </p>
      <p className="text-[11px] text-center text-ed-soft">
        Prin finalizarea comenzii accepți <a href="/termeni-si-conditii" className="underline underline-offset-2">termenii și condițiile</a>.
      </p>
    </form>
  )
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-full bg-ed-black text-white text-[12px] flex items-center justify-center font-bold">{n}</span>
      <h3 className="text-[14px] uppercase tracking-wider font-semibold">{title}</h3>
    </div>
  )
}

function Field({ label, icon, badge, hint, children }: {
  label: string; icon: string; badge?: string; hint?: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <label className="text-[12px] font-semibold text-ed-muted">{label}</label>
        {badge && <span className="ed-eyebrow !text-[9px] text-ed-berry">{badge}</span>}
      </div>
      <div className="relative">
        {children}
        <Icon name={icon} className="absolute right-3 top-1/2 -translate-y-1/2 text-[18px] text-ed-soft pointer-events-none" />
      </div>
      {hint && <span className="text-[11px] text-ed-soft">{hint}</span>}
    </div>
  )
}
