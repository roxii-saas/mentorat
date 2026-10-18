import Image from 'next/image'
import { stripe } from '@/lib/stripe'
import { Icon } from '@/components/prompturi/Icon'
import MetaEvent from '@/components/meta/MetaEvent'
import TrackPurchase from '@/components/track/TrackPurchase'

// Pagina „Mulțumim” comună tuturor produselor digitale (/<slug>/multumim)
export default async function ThankYou({ slug, searchParams }: { slug: string; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { payment_intent } = await searchParams
  let status: string = 'unknown'
  let email = ''
  let purchase: { id: string; value: number; currency: string; slug: string } | null = null
  if (typeof payment_intent === 'string' && payment_intent.startsWith('pi_')) {
    try {
      const pi = await stripe.paymentIntents.retrieve(payment_intent)
      status = pi.status
      email = pi.metadata?.customer_email || pi.receipt_email || ''
      if (pi.status === 'succeeded') {
        purchase = { id: pi.id, value: pi.amount / 100, currency: pi.currency.toUpperCase(), slug: pi.metadata?.product_slug || slug }
      }
    } catch {}
  }
  const ok = status === 'succeeded' || status === 'processing'

  return (
    <main className="min-h-screen flex items-center justify-center px-5 py-16">
      {purchase && <TrackPurchase pi={purchase.id} product={purchase.slug} value={purchase.value} currency={purchase.currency} />}
      {purchase && (
        // eventId = id del PaymentIntent → deduplicato con il Purchase inviato dal server (Conversions API)
        <MetaEvent name="Purchase" eventId={purchase.id} once params={{
          value: purchase.value, currency: purchase.currency, content_ids: [purchase.slug], content_type: 'product', num_items: 1,
        }} />
      )}
      <div className="max-w-md w-full bg-ed-white rounded-xl p-7 ed-shadow-lg border border-ed-line/60 text-center">
        <Image src="/logo.png" alt="Roxii Dincă" width={96} height={32} className="h-8 w-auto mx-auto object-contain" />
        {ok ? (
          <>
            <div className="w-14 h-14 rounded-full bg-[#ffd9de] flex items-center justify-center mx-auto mt-6 text-ed-berry">
              <Icon name="check" className="text-[28px]" />
            </div>
            <span className="ed-eyebrow text-ed-berry block mt-5">Plată confirmată</span>
            <h1 className="font-bodoni text-[30px] leading-[38px] mt-1">Mulțumesc din suflet!</h1>
            <p className="text-[15px] leading-6 text-ed-muted mt-3">
              Comanda ta pleacă acum spre {email ? <strong className="text-ed-ink">{email}</strong> : 'adresa ta de email'}.
              Dacă nu o vezi în câteva minute, verifică și folderul Spam / Promoții.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-bodoni text-[28px] leading-9 mt-6">Plata nu a fost finalizată</h1>
            <p className="text-[15px] leading-6 text-ed-muted mt-3">Nu ți-a fost retrasă nicio sumă. Poți încerca din nou oricând.</p>
            <a href={`/${slug}/checkout`} className="inline-flex items-center justify-center gap-2 mt-6 w-full h-12 rounded bg-ed-berry hover:bg-ed-berry-hover text-white text-[14px] font-semibold uppercase tracking-[0.08em]">
              Încearcă din nou <Icon name="arrow_forward" className="text-[18px]" />
            </a>
          </>
        )}
        <a href={`/${slug}`} className="inline-block mt-6 text-[13px] text-ed-muted underline underline-offset-4 hover:text-ed-ink">Înapoi la prezentare</a>
      </div>
    </main>
  )
}
