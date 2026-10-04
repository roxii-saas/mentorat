import Image from 'next/image'
import { getPublicProduct, formatMoney } from '@/lib/products'
import { Icon } from '@/components/prompturi/Icon'
import { BeforeAfter, CopyPrompt, SectionNav } from '@/components/prompturi/Interactive'
import {
  AI_TOOLS, BONUSES, BUNDLE_VALUE, CASES, COMPARISON, FAQ, METRICS, MODULES, PILLARS, SHOWCASE_PROMPT,
} from '@/components/prompturi/content'

// ISR: rigenera ogni 5 min e subito quando l'admin salva il prodotto
export const revalidate = 300

const CHECKOUT = '/prompturi/checkout'

export default async function PrompturiPage() {
  const product = await getPublicProduct('prompturi')
  const price = formatMoney(product.price_amount, product.currency)
  const compare = product.compare_price ?? 0
  const discountPct = compare > product.price_amount ? Math.floor((1 - product.price_amount / compare) * 100) : 0
  const totalValue = BUNDLE_VALUE + BONUSES.reduce((s, b) => s + b.value, 0)
  const cur = product.currency.toUpperCase()
  const totalModules = MODULES.reduce((s, m) => s + m.count, 0)
  const soldOut = !product.sales_active

  return (
    <>
      <SectionNav priceLabel={price} checkoutHref={CHECKOUT} />

      <main className="pt-16 pb-36 md:pb-0">
        {/* ═══════════════ PREZENTARE ═══════════════ */}
        <section id="prezentare" className="scroll-mt-16 max-w-[1180px] mx-auto px-5 lg:px-8 pt-8 lg:pt-16 pb-10 lg:pb-20">
          <div className="lg:grid lg:grid-cols-12 lg:gap-14 lg:items-center">
            <div className="lg:col-span-6 lg:order-2">
              <div className="flex justify-center lg:justify-start">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-ed-low ed-shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-ed-berry" />
                  <span className="ed-eyebrow text-ed-berry text-center">Ediție exclusivă pentru beauty & lifestyle</span>
                </div>
              </div>
              <h1 className="font-bodoni text-[32px] leading-[40px] lg:text-[54px] lg:leading-[62px] tracking-[-0.01em] lg:tracking-[-0.02em] font-medium text-center lg:text-left mt-4">
                50+ Prompturi AI pentru Poziții & Compoziții <em className="italic">de Revistă</em>
              </h1>
              <p className="text-[15px] leading-6 lg:text-[18px] lg:leading-8 text-ed-muted mt-3 max-w-md mx-auto lg:mx-0 text-center lg:text-left">
                Creează imagini foto ultra-realiste fără costul unui fotograf sau ore pierdute căutând inspirație.
              </p>

              {/* Cover (mobile) */}
              <Cover className="lg:hidden mt-6" />

              {/* Pricing box */}
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
                      <span className="ed-eyebrow !text-[10px] !tracking-wider whitespace-nowrap">-{discountPct}%<span className="hidden sm:inline"> • Economisești {compare - product.price_amount} {cur}</span></span>
                    </div>
                  )}
                </div>
                <div className="mt-3">
                  <BuyButton soldOut={soldOut} label={`Cumpără acum • ${price}`} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-2 bg-ed-low p-2.5 rounded">
                  <Trust icon="verified_user" title="Garanție 14 zile" sub="100% returnare bani" />
                  <Trust icon="mail" title="Acces imediat" sub="Descărcare pe email" />
                </div>
              </div>

              {/* AI compat */}
              <div className="mt-8 text-center lg:text-left">
                <span className="ed-eyebrow text-ed-muted block mb-3">Optimizat & testat pe</span>
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5">
                  {AI_TOOLS.map(t => (
                    <div key={t.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ed-white ed-shadow border border-ed-line">
                      <Icon name={t.icon} className="text-[16px] text-ed-berry" />
                      <span className="text-[12px] font-medium">{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Cover (desktop) */}
            <div className="hidden lg:block lg:col-span-6 lg:order-1">
              <Cover />
            </div>
          </div>

          {/* Creator note */}
          <div className="mt-10 lg:mt-20 grid lg:grid-cols-2 gap-4 lg:gap-6">
            <div className="relative bg-ed-white p-6 rounded-lg ed-shadow-md overflow-hidden">
              <Icon name="format_quote" className="text-[56px] text-ed-berry/15 absolute -right-1 -bottom-2" />
              <div className="flex items-center gap-3 mb-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-ed-mid shrink-0">
                  <Image src="/prompturi/roxii-avatar.jpg" alt="Roxii Dincă" fill sizes="40px" className="object-cover" />
                </div>
                <div>
                  <h2 className="text-[14px] font-semibold leading-tight">Roxii Dincă</h2>
                  <span className="text-[12px] text-ed-berry">Fondatoare & Lash Trainer</span>
                </div>
              </div>
              <blockquote className="text-[15px] leading-6 text-ed-muted italic relative z-10">
                „Una dintre cele mai mari provocări atunci când creezi imagini cu AI este să găsești poziții și compoziții interesante. Tocmai de aceea am creat acest ghid: peste 50 de prompturi concepute pentru a genera poziții dinamice, estetice și naturale pentru brand, portofoliu sau social media.”
              </blockquote>
            </div>

            <div className="bg-ed-white p-5 rounded-lg ed-shadow-md">
              <div className="flex items-center gap-4 mb-3">
                <div className="relative w-16 h-16 rounded-full overflow-hidden bg-ed-mid shrink-0">
                  <Image src="/prompturi/roxii-bio.jpg" alt="Roxii Dincă" fill sizes="64px" className="object-cover" />
                </div>
                <div>
                  <span className="ed-eyebrow !text-[10px] text-ed-berry">Despre autoare</span>
                  <h3 className="font-bodoni text-[22px] leading-[30px]">Roxii Dincă</h3>
                  <p className="text-[13px] text-ed-muted">Lash Master, Trainer & Content Creator</p>
                </div>
              </div>
              <p className="text-[13px] leading-5 text-ed-muted">
                Cu o experiență vastă în industria de beauty și sute de ședințe foto de brand realizate, Roxii combină arta vizuală clasică cu cele mai noi inovații AI pentru a ajuta antreprenoarele să își construiască o imagine memorabilă și profitabilă.
              </p>
            </div>
          </div>

          {/* Pillars */}
          <div className="mt-12 lg:mt-20">
            <span className="ed-eyebrow text-ed-berry block">Ce primești</span>
            <h2 className="font-bodoni text-[26px] leading-[34px] lg:text-[36px] lg:leading-[44px] font-medium mt-1">Tot ce ai nevoie pentru un feed impecabil</h2>
            <div className="mt-5 grid sm:grid-cols-2 gap-3 lg:gap-4">
              {PILLARS.map(p => (
                <div key={p.title} className="p-4 rounded-lg bg-ed-white ed-shadow border border-ed-line/60 flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-ed-mid flex items-center justify-center shrink-0 text-ed-berry">
                    <Icon name={p.icon} className="text-[22px]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[14px] font-semibold">{p.title}</h3>
                    <p className="text-[13px] leading-5 text-ed-muted mt-1">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Showcase prompt */}
          <div className="mt-12 lg:mt-20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Icon name="visibility" className="text-ed-berry text-[18px]" />
                <span className="ed-eyebrow">Exemplu de prompt inclus</span>
              </div>
              <span className="text-[11px] font-semibold text-ed-muted bg-ed-mid px-2 py-0.5 rounded-sm">Prompt #07</span>
            </div>
            <div className="bg-ed-white rounded-lg overflow-hidden ed-shadow-md lg:grid lg:grid-cols-2">
              <div className="relative w-full h-56 lg:h-full lg:min-h-[320px] bg-ed-mid">
                <Image src="/prompturi/prompt-example.jpg" alt="Rezultat obținut cu promptul #07" fill sizes="(max-width:1024px) 100vw, 590px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-white text-[11px] font-semibold tracking-wide">Rezultat obținut în Midjourney folosind promptul alăturat:</span>
                </div>
              </div>
              <div className="p-4 lg:p-8 lg:flex lg:flex-col lg:justify-center">
                <div className="bg-ed-low p-3 pr-12 rounded relative">
                  <p className="text-[13px] leading-[22px] tracking-[0.01em] select-all">{SHOWCASE_PROMPT}</p>
                  <CopyPrompt text={SHOWCASE_PROMPT} variant="icon" />
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-ed-muted text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-ed-berry" />
                  Testat & gata de generare
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ CE CONȚINE ═══════════════ */}
        <section id="ce-contine" className="scroll-mt-16 border-t border-ed-line">
          <div className="max-w-[1180px] mx-auto px-5 lg:px-8 pt-10 lg:pt-20 pb-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-12 lg:items-end">
              <div className="lg:col-span-7">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-ed-berry/10 text-ed-berry">
                  <Icon name="auto_awesome" className="text-[14px]" />
                  <span className="ed-eyebrow">Ghid digital de lux</span>
                </div>
                <h2 className="font-bodoni text-[26px] leading-[34px] lg:text-[44px] lg:leading-[52px] font-medium tracking-tight mt-2">
                  Ce conține colecția ta de 50+ Prompturi de Poziții AI
                </h2>
                <p className="text-[15px] leading-6 lg:text-[17px] lg:leading-7 text-ed-muted mt-2">
                  Biblioteca ta completă de compoziții, unghiuri și ședințe foto virtuale pentru beauty & fashion, gata de copiat în ChatGPT, Midjourney sau Gemini.
                </p>
              </div>
              <div className="lg:col-span-5 mt-5 lg:mt-0 bg-ed-mid rounded-lg p-2 flex items-center justify-between ed-shadow">
                <Counter value="5" label="Module clare" />
                <div className="h-7 w-px bg-ed-line" />
                <Counter value={String(BONUSES.length)} label="Bonusuri VIP" accent />
                <div className="h-7 w-px bg-ed-line" />
                <div className="flex flex-col items-center flex-1 text-center">
                  <Icon name="all_inclusive" className="text-[22px] mt-1" />
                  <span className="text-[11px] font-semibold text-ed-muted leading-tight mt-0.5">Acces pe viață</span>
                </div>
              </div>
            </div>

            <div className="relative mt-6 overflow-hidden rounded-lg bg-ed-high ed-shadow">
              <div className="relative h-44 sm:h-auto sm:aspect-[1400/763] w-full">
                <Image src="/prompturi/banner.jpg" alt="Estetică editorială beauty & fashion" fill sizes="(max-width:1180px) 100vw, 1120px" className="object-cover object-left" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 lg:p-8">
                  <span className="ed-eyebrow text-ed-rose">Creat de Roxii Dincă</span>
                  <p className="font-bodoni text-[22px] leading-[30px] lg:text-[32px] lg:leading-10 text-white">Estetică editorială fără ședințe foto de mii de euro</p>
                </div>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="max-w-[1180px] mx-auto px-5 lg:px-8 pb-10 lg:pb-16">
            <div className="flex items-end justify-between mb-4">
              <div>
                <span className="ed-eyebrow text-ed-berry">Structură pas cu pas</span>
                <h3 className="font-bodoni text-[22px] leading-[30px] lg:text-[28px] lg:leading-9">Cele 5 module de bază</h3>
              </div>
              <span className="text-[12px] font-semibold bg-ed-mid px-2 py-1 rounded text-ed-muted">{totalModules} prompturi</span>
            </div>
            <div className="grid lg:grid-cols-2 gap-3 lg:gap-4">
              {MODULES.map((m, i) => (
                <div key={m.n} className={`bg-ed-white rounded-lg p-4 lg:p-5 ed-shadow border border-ed-line/60 flex flex-col gap-2 ${i === 0 ? 'lg:row-span-2' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={`ed-eyebrow px-2 py-0.5 rounded ${i === 0 ? 'text-ed-berry bg-ed-rose/50' : 'bg-[#e5e1e4]'}`}>{m.n}</span>
                      <span className="text-[12px] font-semibold text-ed-muted">{m.count} PROMPTURI</span>
                    </div>
                    <Icon name={m.icon} className={`text-[20px] ${i === 0 ? 'text-ed-berry' : 'text-ed-muted'}`} />
                  </div>
                  <div>
                    <h4 className="font-bodoni text-[19px] leading-snug">{m.title}</h4>
                    <p className="text-[13px] leading-5 text-ed-muted mt-1">{m.text}</p>
                  </div>
                  {m.prompt && (
                    <div className="mt-1 bg-ed-low rounded p-2.5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="ed-eyebrow !text-[10px] text-ed-muted">Exemplu prompt inclus</span>
                        <CopyPrompt text={m.prompt} />
                      </div>
                      <p className="text-[13px] leading-[22px] italic bg-ed-white/80 p-2.5 rounded">“{m.prompt}”</p>
                    </div>
                  )}
                  {m.checks && (
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      {m.checks.map(c => (
                        <div key={c} className="bg-ed-low p-2 rounded flex items-center gap-2">
                          <Icon name="check_circle" className="text-ed-berry text-[18px]" />
                          <span className="text-[12px]">{c}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Bonuses */}
          <div className="bg-ed-low">
            <div className="max-w-[1180px] mx-auto px-5 lg:px-8 py-10 lg:py-16">
              <div className="flex flex-col gap-1 text-center items-center">
                <span className="ed-eyebrow text-ed-berry">Valoare adăugată</span>
                <h3 className="font-bodoni text-[26px] leading-[34px] lg:text-[36px] lg:leading-[44px] font-medium">{BONUSES.length} Bonusuri exclusive incluse</h3>
                <p className="text-[13px] leading-5 text-ed-muted max-w-sm">
                  Instrumente create special pentru a elimina aspectul fals de AI și a economisi zeci de ore de teste.
                </p>
              </div>
              <div className="mt-6 grid lg:grid-cols-3 gap-3 lg:gap-4">
                {BONUSES.map((b, i) => (
                  <div key={b.title} className="bg-ed-white rounded-lg p-4 lg:p-5 ed-shadow border border-ed-line/60 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="ed-eyebrow text-ed-berry">Bonus #{i + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-ed-muted line-through">{b.value} {cur}</span>
                        <span className="ed-eyebrow px-2 py-0.5 rounded bg-ed-berry text-white">Gratuit</span>
                      </div>
                    </div>
                    <h4 className="font-bodoni text-[18px] leading-snug">{b.title}</h4>
                    <p className="text-[13px] leading-5 text-ed-muted flex-1">{b.text}</p>
                    <div className="flex items-center gap-2 pt-1 text-ed-muted text-[12px] font-semibold">
                      <Icon name="verified" className="text-[16px] text-ed-berry" />
                      <span>{b.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Value stack / offer */}
          <div id="oferta" className="max-w-[640px] mx-auto px-5 py-10 lg:py-16">
            <div className="bg-ed-highest rounded-xl p-5 lg:p-7 ed-shadow-md flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#fe4d86]/20 blur-2xl pointer-events-none" />
              <div className="flex flex-col gap-1">
                <span className="ed-eyebrow text-ed-berry">Ofertă specială de lansare</span>
                <h3 className="font-bodoni text-[28px] leading-9">Pregătește-te să transformi feed-ul afacerii tale</h3>
              </div>
              <div className="flex flex-col gap-1.5 bg-ed-white/70 p-3 rounded-lg text-[13px]">
                <Row label="Pachetul 50+ Prompturi Poziții" value={`${BUNDLE_VALUE} ${cur}`} strong />
                {BONUSES.map((b, i) => (
                  <Row key={b.title} label={`Bonus ${i + 1}: ${b.title}`} value={`${b.value} ${cur}`} accent />
                ))}
                <div className="h-px bg-ed-line my-1" />
                <div className="flex items-center justify-between text-[14px] font-semibold text-ed-muted">
                  <span>Valoare totală cumulată:</span>
                  <span className="line-through">{totalValue} {cur}</span>
                </div>
              </div>
              <div className="flex items-end justify-between gap-3 pt-1">
                <div className="flex flex-col">
                  <span className="text-[12px] text-ed-berry font-bold uppercase tracking-wider">Preț promoțional azi</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-bodoni text-[40px] leading-[48px] font-bold">{product.price_amount}</span>
                    <span className="font-bodoni text-[22px] font-semibold">{cur}</span>
                  </div>
                </div>
                {totalValue > product.price_amount && (
                  <div className="bg-ed-rose text-[#3f0018] ed-eyebrow px-2.5 py-1 rounded-full mb-2">
                    Economisești {totalValue - product.price_amount} {cur}
                  </div>
                )}
              </div>
              <BuyButton soldOut={soldOut} label={`Vreau colecția completă la ${price}`} className="!h-[52px]" />
              <div className="grid grid-cols-2 gap-1.5 pt-1 text-center text-ed-muted text-[11px] font-semibold">
                <div className="flex items-center justify-center gap-1.5"><Icon name="lock" className="text-[16px] text-ed-black" />Plată card securizată</div>
                <div className="flex items-center justify-center gap-1.5"><Icon name="bolt" className="text-[16px] text-ed-berry" />Primești imediat pe email</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════ REZULTATE ═══════════════ */}
        <section id="rezultate" className="scroll-mt-16 border-t border-ed-line">
          <div className="max-w-[1180px] mx-auto px-5 lg:px-8 pt-10 lg:pt-20 pb-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ed-berry/10 mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-ed-berry" />
                <span className="ed-eyebrow text-ed-berry">Rezultate reale & transformare vizuală</span>
              </div>
              <h2 className="font-bodoni text-[32px] leading-10 lg:text-[48px] lg:leading-[56px] tracking-tight">
                De la imagini plictisitoare la ședințe foto <em className="italic">de revistă</em>
              </h2>
              <p className="text-[15px] leading-6 text-ed-muted font-light mt-2">
                Descoperă cum profesionistele din beauty creează imagini de copertă fără costuri exorbitante de studio foto.
              </p>
            </div>

            <div className="mt-8 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-start">
              <div className="lg:col-span-5">
                <div className="grid grid-cols-3 gap-1 bg-ed-low p-1 rounded-lg ed-shadow">
                  {METRICS.map(m => (
                    <div key={m.label} className="flex flex-col items-center justify-center p-2 bg-ed-white rounded text-center">
                      <span className={`font-bodoni text-[26px] leading-9 tracking-tight ${m.accent ? 'text-ed-berry' : ''}`}>{m.value}</span>
                      <span className="text-[11px] text-ed-muted mt-1 leading-tight">{m.label}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Icon name="auto_fix_high" className="text-ed-berry text-[20px]" />
                      <span className="ed-eyebrow">Transformare cadru</span>
                    </div>
                    <span className="text-[12px] font-semibold text-ed-muted">Trage de glisor</span>
                  </div>
                  <BeforeAfter before="/prompturi/before.jpg" after="/prompturi/after.jpg" />
                </div>
              </div>

              <div className="lg:col-span-7 mt-10 lg:mt-0 flex flex-col gap-5">
                <div>
                  <span className="ed-eyebrow text-ed-berry block mb-1">Povești de succes</span>
                  <h3 className="font-bodoni text-[26px] leading-[34px]">Experiențe din comunitate</h3>
                </div>
                {CASES.map(c => (
                  <article key={c.name} className="bg-ed-white p-5 rounded-lg ed-shadow border border-ed-line/60 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-ed-mid">
                          <Image src={c.avatar} alt={c.name} fill sizes="48px" className="object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold">{c.name}</span>
                          <span className="text-[12px] font-semibold text-ed-muted">{c.role}</span>
                        </div>
                      </div>
                      <div className="flex items-center text-ed-berry">
                        {[...Array(5)].map((_, i) => <Icon key={i} name="star" fill className="text-[16px]" />)}
                      </div>
                    </div>
                    <div className={`grid gap-1 rounded overflow-hidden ${c.images.length > 1 ? 'grid-cols-2' : ''}`}>
                      {c.images.map(img => (
                        <div key={img.src} className={`relative bg-ed-mid ${c.images.length > 1 ? 'aspect-square' : 'aspect-[16/10]'}`}>
                          <Image src={img.src} alt={img.tag || c.name} fill sizes="(max-width:1024px) 100vw, 640px" className="object-cover" />
                          {img.tag && <span className="absolute top-2 left-2 bg-ed-white/90 px-1.5 py-0.5 rounded ed-eyebrow !text-[9px]">{img.tag}</span>}
                        </div>
                      ))}
                    </div>
                    <blockquote className="text-[15px] leading-6 italic font-light">„{c.quote}”</blockquote>
                    {c.result && (
                      <div className="flex items-center justify-between bg-ed-low px-4 py-2 rounded">
                        <span className="text-[12px] font-semibold text-ed-muted">{c.result.label}</span>
                        <span className="flex items-center gap-1 text-[14px] font-bold text-ed-berry">
                          {c.result.icon && <Icon name={c.result.icon} className="text-[18px]" />}
                          {c.result.value}
                        </span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Comparison */}
          <div className="max-w-[760px] mx-auto px-5 pb-10 lg:pb-16">
            <div className="text-center mb-4">
              <span className="ed-eyebrow text-ed-berry">Eficiență & calitate</span>
              <h3 className="font-bodoni text-[26px] leading-[34px] mt-1">Diferența vizibilă</h3>
            </div>
            <div className="bg-ed-white rounded-lg ed-shadow border border-ed-line/60 overflow-hidden">
              <div className="grid grid-cols-2 p-2 bg-ed-low text-center">
                <div className="p-1 text-[14px] font-medium text-ed-muted">Fără ghid</div>
                <div className="p-1 text-[14px] font-bold text-ed-berry flex items-center justify-center gap-1">
                  <Icon name="verified" className="text-[16px]" />Cu ghidul de 50+ poziții
                </div>
              </div>
              {COMPARISON.map((r, i) => (
                <div key={i} className={`grid grid-cols-2 p-4 items-center text-center ${i % 2 ? 'bg-ed-low' : ''}`}>
                  <div className="flex flex-col items-center text-ed-muted">
                    {r.without[0] ? <span className="text-[12px] font-semibold text-[#ba1a1a]">{r.without[0]}</span> : <Icon name="cancel" className="text-ed-soft text-[20px] mb-0.5" />}
                    <span className="text-[11px]">{r.without[1]}</span>
                  </div>
                  <div className="flex flex-col items-center">
                    {r.with[0] ? <span className="text-[12px] font-bold text-ed-berry">{r.with[0].replace('{price}', price)}</span> : <Icon name="check_circle" className="text-ed-berry text-[20px] mb-0.5" />}
                    <span className="text-[11px] font-medium">{r.with[1]}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════ FAQ ═══════════════ */}
        <section id="faq" className="scroll-mt-16 border-t border-ed-line">
          <div className="max-w-[760px] mx-auto px-5 pt-10 lg:pt-20 pb-10">
            <h2 className="font-bodoni text-[26px] leading-[34px] lg:text-[36px] lg:leading-[44px] mb-5">Întrebări frecvente</h2>
            <div className="flex flex-col gap-1.5">
              {FAQ.map(f => (
                <details key={f.q} className="group rounded-lg bg-ed-white p-4 ed-shadow border border-ed-line/60">
                  <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-[14px] font-semibold [&::-webkit-details-marker]:hidden">
                    <span>{f.q}</span>
                    <Icon name="add" className="text-[20px] text-ed-berry transition-transform duration-200 group-open:rotate-45" />
                  </summary>
                  <p className="text-[13px] leading-5 text-ed-muted mt-2">{f.a}</p>
                </details>
              ))}
            </div>
          </div>

          {/* Final CTA */}
          <div className="max-w-[760px] mx-auto px-5 pb-12 lg:pb-20">
            <div className="bg-ed-black text-white rounded-xl p-6 lg:p-10 flex flex-col items-center text-center ed-shadow-lg relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-40 h-40 bg-ed-berry/30 rounded-full blur-3xl pointer-events-none" />
              <span className="ed-eyebrow text-ed-rose mb-1">Disponibil imediat</span>
              <h3 className="font-bodoni text-[26px] leading-[34px] lg:text-[36px] lg:leading-[44px] mb-1">Obține aceleași rezultate chiar azi</h3>
              <p className="text-[15px] leading-6 text-[#c8c6c8] font-light mb-6 max-w-xs">
                Transformă-ți profilul de Instagram într-o revistă de modă cu ghidul complet de prompturi vizuale.
              </p>
              <BuyButton soldOut={soldOut} label={`Cumpără acum • ${price}`} className="max-w-sm" />
              <div className="flex items-center gap-1.5 mt-4 text-[#c8c6c8] text-[11px] font-semibold">
                <Icon name="verified_user" className="text-[18px] text-ed-rose" />
                Garanție returnare bani 14 zile fără întrebări
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-ed-line">
          <div className="max-w-[1180px] mx-auto px-5 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-ed-muted">
            <span>© {new Date().getFullYear()} Roxii Dincă</span>
            <div className="flex items-center gap-4">
              <a href="/termeni-si-conditii" className="hover:text-ed-ink">Termeni și condiții</a>
              <a href="/politica-de-confidentialitate" className="hover:text-ed-ink">Confidențialitate</a>
              <a href="/politica-de-cookie" className="hover:text-ed-ink">Cookie</a>
            </div>
          </div>
        </footer>
      </main>

      {/* Sticky purchase bar (mobile) */}
      {!soldOut && (
        <div className="md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] inset-x-0 z-40 px-5 py-2.5 bg-ed-white/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className="font-bodoni text-[22px] leading-none font-semibold text-ed-berry">{price}</span>
              {compare > 0 && <span className="text-[11px] font-semibold text-ed-muted line-through opacity-70">{compare} {cur}</span>}
            </div>
            <span className="ed-eyebrow !text-[9px] text-ed-muted block mt-0.5">50+ Prompturi • Ghid PDF</span>
          </div>
          <a href={CHECKOUT} className="bg-ed-berry active:bg-ed-berry-hover text-white px-5 h-11 rounded text-[14px] font-semibold uppercase tracking-wider flex items-center gap-1.5 shrink-0 ed-shadow">
            Cumpără
            <Icon name="arrow_forward" className="text-[16px]" />
          </a>
        </div>
      )}
    </>
  )
}

function BuyButton({ label, className = '', soldOut }: { label: string; className?: string; soldOut: boolean }) {
  return (
    soldOut ? (
      <span className={`w-full bg-ed-high text-ed-muted h-12 rounded flex items-center justify-center text-[14px] font-semibold uppercase tracking-[0.08em] ${className}`}>
        Momentan indisponibil
      </span>
    ) : (
      <a href={CHECKOUT}
        className={`w-full bg-ed-berry hover:bg-ed-berry-hover active:scale-[0.99] text-white h-12 rounded flex items-center justify-center gap-2 text-[14px] font-semibold uppercase tracking-[0.08em] transition-all ed-shadow-md ${className}`}>
        <span>{label}</span>
        <Icon name="arrow_forward" className="text-[18px]" />
      </a>
    )
  )
}

function Cover({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-full rounded-xl overflow-hidden bg-ed-white p-2.5 ed-shadow-lg ${className}`}>
      <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-ed-mid">
        <Image src="/prompturi/cover.jpg" alt="Coperta ghidului 50+ Prompturi AI — Roxii Dincă" fill priority
          sizes="(max-width:1024px) 100vw, 560px" className="object-cover" />
        <div className="absolute top-3 left-3 bg-ed-berry text-white px-3 py-1 rounded-sm ed-shadow-md flex items-center gap-1.5">
          <Icon name="auto_awesome" className="text-[14px]" />
          <span className="ed-eyebrow !text-[10px]">Best seller</span>
        </div>
        <div className="absolute bottom-3 right-3 bg-ed-white/90 backdrop-blur-md px-2.5 py-1 rounded-sm ed-shadow">
          <span className="text-[12px] font-semibold uppercase tracking-wider">Ghid digital PDF</span>
        </div>
      </div>
    </div>
  )
}

function Trust({ icon, title, sub }: { icon: string; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <Icon name={icon} className="text-ed-berry text-[20px]" />
      <div className="flex flex-col">
        <span className="text-[11px] font-semibold leading-tight">{title}</span>
        <span className="text-[10px] text-ed-muted leading-tight">{sub}</span>
      </div>
    </div>
  )
}

function Counter({ value, label, accent = false }: { value: string; label: string; accent?: boolean }) {
  return (
    <div className="flex flex-col items-center flex-1 px-1 text-center">
      <span className={`font-bodoni text-[22px] leading-[30px] font-semibold ${accent ? 'text-ed-berry' : ''}`}>{value}</span>
      <span className="text-[11px] font-semibold text-ed-muted leading-tight mt-0.5">{label}</span>
    </div>
  )
}

function Row({ label, value, strong = false, accent = false }: { label: string; value: string; strong?: boolean; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={`shrink-0 ${strong ? 'font-semibold' : ''} ${accent ? 'text-ed-berry font-medium' : ''}`}>{value}</span>
    </div>
  )
}
