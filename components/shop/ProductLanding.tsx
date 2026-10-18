import Image from 'next/image'
import Link from 'next/link'
import { formatMoney, type PublicProduct } from '@/lib/products'
import { Icon } from '@/components/prompturi/Icon'
import MetaEvent from '@/components/meta/MetaEvent'
import CookieSettingsLink from '@/components/meta/CookieSettingsLink'
import { normalizeLanding } from './landing'

// Pagina dedicată a unui produs digital: se construiește din datele produsului (preț, upgrade) și din conținutul editat în admin.
export default function ProductLanding({ product }: { product: PublicProduct }) {
  const L = normalizeLanding(product)
  const price = formatMoney(product.price_amount, product.currency)
  const compare = product.compare_price ?? 0
  const cur = product.currency.toUpperCase()
  const discountPct = compare > product.price_amount ? Math.floor((1 - product.price_amount / compare) * 100) : 0
  const checkout = `/${product.slug}/checkout`
  const soldOut = !product.sales_active

  return (
    <>
      <MetaEvent name="ViewContent" params={{
        content_ids: [product.slug], content_type: 'product', content_name: product.name,
        value: product.price_amount, currency: cur,
      }} />

      <header className="fixed top-0 inset-x-0 z-50 bg-ed-canvas/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 max-w-[1180px] mx-auto px-5 lg:px-8 flex items-center justify-between">
          <a href="#prezentare" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Roxii Dincă" width={96} height={32} className="h-8 w-auto object-contain" priority />
            <span className="ed-eyebrow !tracking-[0.18em] text-ed-ink">Roxii Dincă</span>
          </a>
          {!soldOut && (
            <a href={checkout} className="inline-flex items-center gap-1.5 bg-ed-berry hover:bg-ed-berry-hover text-white h-10 px-5 rounded text-[12px] font-bold uppercase tracking-[0.08em] transition-colors">
              Cumpără • {price}
            </a>
          )}
        </div>
      </header>

      <main className="pt-16 pb-24 md:pb-0">
        <section id="prezentare" className="max-w-[1180px] mx-auto px-5 lg:px-8 pt-8 lg:pt-16 pb-10 lg:pb-16">
          <div className="lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
            <div className={product.cover_url ? 'lg:col-span-6 lg:order-2' : 'lg:col-span-12 max-w-xl mx-auto'}>
              <div className="flex justify-center lg:justify-start">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ed-low ed-shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-ed-berry" />
                  <span className="ed-eyebrow text-ed-berry text-center">{L.eyebrow}</span>
                </div>
              </div>
              <h1 className="font-bodoni text-[32px] leading-[40px] lg:text-[48px] lg:leading-[56px] tracking-[-0.01em] font-medium text-center lg:text-left mt-4">{L.headline}</h1>
              {L.subheadline && (
                <p className="text-[15px] leading-6 lg:text-[18px] lg:leading-8 text-ed-muted mt-3 max-w-md mx-auto lg:mx-0 text-center lg:text-left">{L.subheadline}</p>
              )}

              {product.cover_url && <Cover src={product.cover_url} alt={product.name} badge={L.badge} className="lg:hidden mt-6" />}

              <div className="mt-6 bg-ed-white p-4 sm:p-5 rounded-lg ed-shadow-md">
                <div className="flex items-start justify-between gap-3 pb-1">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-bodoni text-[30px] leading-9 font-semibold text-ed-berry whitespace-nowrap">{price}</span>
                      {compare > 0 && <span className="text-[15px] text-ed-muted line-through opacity-70 whitespace-nowrap">{compare} {cur}</span>}
                    </div>
                    <span className="text-[12px] font-semibold text-ed-muted block mt-0.5">• Plată securizată unică</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="bg-ed-rose text-[#3f0018] px-2.5 py-1 rounded-sm text-right shrink-0">
                      <span className="ed-eyebrow !text-[10px] !tracking-wider whitespace-nowrap">-{discountPct}%</span>
                    </div>
                  )}
                </div>
                <div className="mt-3"><BuyButton href={checkout} soldOut={soldOut} label={`Cumpără acum • ${price}`} /></div>
                <div className="mt-4 grid grid-cols-2 gap-2 bg-ed-low p-2.5 rounded">
                  <Trust icon="verified_user" title="Garanție 14 zile" sub="100% returnare bani" />
                  <Trust icon="mail" title="Acces imediat" sub="Descărcare pe email" />
                </div>
              </div>
            </div>

            {product.cover_url && (
              <div className="hidden lg:block lg:col-span-6 lg:order-1">
                <Cover src={product.cover_url} alt={product.name} badge={L.badge} />
              </div>
            )}
          </div>
        </section>

        {L.benefits.length > 0 && (
          <section id="beneficii" className="max-w-[1180px] mx-auto px-5 lg:px-8 pb-10 lg:pb-16">
            <span className="ed-eyebrow text-ed-berry block">Ce primești</span>
            <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {L.benefits.map((b, i) => (
                <div key={i} className="bg-ed-white p-5 rounded-lg ed-shadow border border-ed-line/60">
                  <div className="w-9 h-9 rounded-full bg-ed-mid flex items-center justify-center text-ed-berry mb-3"><Icon name="check" className="text-[18px]" /></div>
                  <h3 className="text-[15px] font-semibold leading-snug">{b.title}</h3>
                  {b.text && <p className="text-[13px] leading-5 text-ed-muted mt-1.5">{b.text}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {L.inside.length > 0 && (
          <section id="ce-contine" className="max-w-[760px] mx-auto px-5 pb-10 lg:pb-16">
            <h2 className="font-bodoni text-[26px] leading-[34px] lg:text-[34px] lg:leading-[42px] font-medium">Ce conține</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {L.inside.map((t, i) => (
                <li key={i} className="flex items-start gap-3 bg-ed-white rounded-lg p-3.5 ed-shadow border border-ed-line/60 text-[14px] leading-5">
                  <Icon name="check_circle" className="text-ed-berry text-[20px] shrink-0" /><span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {L.faq.length > 0 && (
          <section id="faq" className="border-t border-ed-line">
            <div className="max-w-[760px] mx-auto px-5 pt-10 lg:pt-16 pb-10">
              <h2 className="font-bodoni text-[26px] leading-[34px] lg:text-[34px] lg:leading-[42px] mb-5">Întrebări frecvente</h2>
              <div className="flex flex-col gap-1.5">
                {L.faq.map((f, i) => (
                  <details key={i} className="group rounded-lg bg-ed-white p-4 ed-shadow border border-ed-line/60">
                    <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
                      <span>{f.q}</span>
                      <Icon name="add" className="text-[20px] text-ed-berry transition-transform duration-200 group-open:rotate-45" />
                    </summary>
                    <p className="text-[13px] leading-5 text-ed-muted mt-2">{f.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="max-w-[760px] mx-auto px-5 pb-12 lg:pb-20 pt-6">
          <div className="bg-ed-black text-white rounded-xl p-6 lg:p-10 flex flex-col items-center text-center ed-shadow-lg relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-ed-berry/30 rounded-full blur-3xl pointer-events-none" />
            <h3 className="font-bodoni text-[26px] leading-[34px] lg:text-[34px] lg:leading-[42px] mb-1">{L.cta_title}</h3>
            <p className="text-[15px] leading-6 text-[#c8c6c8] font-light mb-6 max-w-xs">{L.cta_text}</p>
            <BuyButton href={checkout} soldOut={soldOut} label={`Cumpără acum • ${price}`} className="max-w-sm" />
            <div className="flex items-start gap-1.5 mt-4 text-[#c8c6c8] text-[11px] font-semibold max-w-sm text-left">
              <Icon name="verified_user" className="text-[18px] text-ed-rose shrink-0" />{L.guarantee}
            </div>
          </div>
        </section>

        <footer className="border-t border-ed-line">
          <div className="max-w-[1180px] mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-ed-muted">
            <span>© {new Date().getFullYear()} Roxii Dincă</span>
            <div className="flex items-center gap-4">
              <Link href="/termeni-si-conditii" className="hover:text-ed-ink">Termeni și condiții</Link>
              <Link href="/politica-de-confidentialitate" className="hover:text-ed-ink">Confidențialitate</Link>
              <Link href="/politica-de-cookie" className="hover:text-ed-ink">Cookie</Link>
              <CookieSettingsLink className="hover:text-ed-ink" />
            </div>
          </div>
        </footer>
      </main>

      {!soldOut && (
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 px-5 py-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] bg-ed-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-1.5">
            <span className="font-bodoni text-[22px] leading-none font-semibold text-ed-berry">{price}</span>
            {compare > 0 && <span className="text-[11px] font-semibold text-ed-muted line-through opacity-70">{compare} {cur}</span>}
          </div>
          <a href={checkout} className="bg-ed-berry active:bg-ed-berry-hover text-white px-5 h-11 rounded text-[14px] font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ed-shadow">
            Cumpără <Icon name="arrow_forward" className="text-[16px]" />
          </a>
        </div>
      )}
    </>
  )
}

function BuyButton({ href, label, className = '', soldOut }: { href: string; label: string; className?: string; soldOut: boolean }) {
  return soldOut ? (
    <span className={`w-full bg-ed-high text-ed-muted h-12 rounded flex items-center justify-center text-[14px] font-semibold uppercase tracking-[0.08em] ${className}`}>Momentan indisponibil</span>
  ) : (
    <a href={href} className={`w-full bg-ed-berry hover:bg-ed-berry-hover active:scale-[0.99] text-white h-12 rounded flex items-center justify-center gap-2 text-[14px] font-semibold uppercase tracking-[0.08em] transition-all ed-shadow-md ${className}`}>
      <span>{label}</span><Icon name="arrow_forward" className="text-[18px]" />
    </a>
  )
}

function Cover({ src, alt, badge, className = '' }: { src: string; alt: string; badge: string; className?: string }) {
  return (
    <div className={`relative w-full rounded-xl overflow-hidden bg-ed-white p-2.5 ed-shadow-lg ${className}`}>
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-ed-mid">
        <Image src={src} alt={alt} fill priority sizes="(max-width:1024px) 100vw, 560px" className="object-cover" />
        {badge && (
          <div className="absolute top-3 left-3 bg-ed-berry text-white px-3 py-1 rounded-sm ed-shadow-md flex items-center gap-1.5">
            <Icon name="auto_awesome" className="text-[14px]" /><span className="ed-eyebrow !text-[10px]">{badge}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function Trust({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} className="text-ed-berry text-[20px]" />
      <div className="flex flex-col"><span className="text-[11px] font-semibold leading-tight">{title}</span><span className="text-[10px] text-ed-muted leading-tight">{sub}</span></div>
    </div>
  )
}
