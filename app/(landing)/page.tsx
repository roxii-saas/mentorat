'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { CheckCircle, Star, ArrowRight, TrendingUp, Users, Heart, Zap, Shield, Clock } from 'lucide-react'
import { formatPrice } from '@/lib/utils'

interface Settings {
  price_amount: number
  currency: string
  product_name: string
  product_description: string
  sales_active: boolean
}

export default function LandingPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => setSettings({
        price_amount: 297,
        currency: 'eur',
        product_name: 'Mentorat Premium cu Roxana',
        product_description: '',
        sales_active: true,
      }))
  }, [])

  const handleBuy = async () => {
    if (!settings?.sales_active) return
    setLoading(true)
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else setLoading(false)
  }

  const price = settings ? formatPrice(settings.price_amount, settings.currency.toUpperCase()) : '297 €'

  return (
    <main className="bg-[#fdf8f3] text-gray-800 font-serif">

      {/* HERO */}
      <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 py-16 max-w-6xl mx-auto gap-12">
        <div className="flex-1 text-center lg:text-left">
          <span className="inline-block bg-[#c97d4e]/15 text-[#c97d4e] text-sm font-sans font-semibold px-4 py-1.5 rounded-full mb-6 tracking-wide">
            MENTORAT EXCLUSIV · LOCURI LIMITATE
          </span>
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight mb-6 text-gray-900">
            De la <span className="text-[#c97d4e]">0</span> la{' '}
            <span className="text-[#c97d4e]">3.000€</span> pe lună
          </h1>
          <p className="text-xl lg:text-2xl text-gray-600 mb-4 leading-relaxed">
            Scapă de frica că <em>tu nu poți</em> și construiește o afacere online care îți aduce libertate și venit constant.
          </p>
          <p className="text-lg text-gray-500 mb-10 leading-relaxed">
            Claritate în online · Strategii personalizate · Cum să atragi clientele · Cum să te promovezi
          </p>
          <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} />
          <p className="mt-4 text-sm text-gray-400 font-sans">✓ Acces imediat după plată &nbsp;·&nbsp; ✓ Plată securizată</p>
        </div>

        <div className="flex-shrink-0">
          <div className="relative w-72 h-96 lg:w-96 lg:h-[500px] rounded-3xl overflow-hidden shadow-2xl border-4 border-[#c97d4e]/20">
            <Image
              src="/roxana.jpg"
              alt="Roxana Dinca - Mentor"
              fill
              className="object-cover object-top"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
              <p className="text-white font-bold text-lg">Roxana Dinca</p>
              <p className="text-white/80 text-sm">Mentor & Coach de Business Online</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="bg-[#c97d4e] py-12">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { number: '200+', label: 'Cliente transformate' },
            { number: '3.000€', label: 'Venit mediu atins' },
            { number: '98%', label: 'Satisfacție garantată' },
          ].map(stat => (
            <div key={stat.label}>
              <p className="text-3xl lg:text-4xl font-bold text-white">{stat.number}</p>
              <p className="text-white/80 text-sm lg:text-base mt-1 font-sans">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PAIN POINTS */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-4">
          Îți sună familiar?
        </h2>
        <p className="text-center text-gray-500 mb-12 text-lg font-sans">Dacă da, ești exact acolo unde trebuie să fii.</p>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            'Nu știu cum să mă promovez pe social media',
            'Am frică că nu sunt suficient de bună pentru a cere bani',
            'Încerc tot, dar nu vin clientele',
            'Nu am o strategie clară, mă pierd în haos',
            'Nu știu cum să îmi stabilesc prețurile corect',
            'Văd altele reușind și mă întreb de ce nu și eu',
          ].map(pain => (
            <div key={pain} className="flex items-start gap-3 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <span className="text-2xl mt-0.5">😔</span>
              <p className="text-gray-700 font-sans">{pain}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SOLUTION */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <span className="text-[#c97d4e] font-sans font-semibold text-sm tracking-wide uppercase">Soluția</span>
          <h2 className="text-3xl lg:text-4xl font-bold mt-3 mb-6">
            Claritate în online cu <span className="text-[#c97d4e]">strategii personalizate</span> pentru tine
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-14 font-sans">
            Nu mai vinde nimeni strategii generice care nu funcționează. Eu lucrez <strong>cu tine</strong>, pe situația ta concretă, ca să construiești un sistem care aduce clientele și bani în mod constant.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: <Zap className="w-7 h-7" />, title: 'Cum să te promovezi', desc: 'Strategie de conținut personalizată, prezență autentică și vizibilitate care atrage.' },
              { icon: <Users className="w-7 h-7" />, title: 'Cum să atragi clientele', desc: 'Sistem de atracție și conversie — de la follower la clientă plătitoare.' },
              { icon: <TrendingUp className="w-7 h-7" />, title: 'De la 0 la 3.000€', desc: 'Planul pas cu pas pentru a construi un venit consistent în maximum 3-6 luni.' },
            ].map(item => (
              <div key={item.title} className="bg-[#fdf8f3] rounded-2xl p-6 text-left">
                <div className="w-12 h-12 bg-[#c97d4e]/15 rounded-xl flex items-center justify-center text-[#c97d4e] mb-4">
                  {item.icon}
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-14">
          Cum funcționează mentorat-ul?
        </h2>
        <div className="space-y-6">
          {[
            { step: '01', title: 'Cumperi programul', desc: 'Plata se procesează instant și primești imediat accesul în platformă pe email.', icon: <Shield className="w-6 h-6" /> },
            { step: '02', title: 'Programezi prima ta sesiune', desc: 'Intri în platformă și alegi un slot disponibil din calendarul Roxanei.', icon: <Clock className="w-6 h-6" /> },
            { step: '03', title: 'Primești strategia ta personalizată', desc: 'Roxana analizează situația ta și îți creează un plan concret, pe măsura ta.', icon: <Zap className="w-6 h-6" /> },
            { step: '04', title: 'Implementezi și crești', desc: 'Urmezi pașii, primești suport continuu și ajungi la 3.000€ pe lună.', icon: <TrendingUp className="w-6 h-6" /> },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex-shrink-0 w-14 h-14 bg-[#c97d4e] rounded-2xl flex items-center justify-center text-white font-bold text-lg">
                {item.step}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                <p className="text-gray-600 font-sans">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* WHAT'S INCLUDED */}
      <section className="bg-white py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl lg:text-4xl font-bold text-center mb-14">
            Ce primești în program
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              'Sesiune 1:1 cu Roxana (60 minute)',
              'Analiză completă a profilului tău online',
              'Strategie personalizată de promovare',
              'Plan de acțiune lunar detaliat',
              'Scripturi pentru atragerea clientelelor',
              'Sistem de prețuri optimizat',
              'Suport prin platformă după sesiune',
              'Acces la materiale exclusive',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 font-sans">
                <CheckCircle className="w-5 h-5 text-[#c97d4e] flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl lg:text-4xl font-bold text-center mb-14">
          Ce spun clientele mele
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Maria T., Cluj', text: 'În 2 luni am ajuns la primii 1.500€ pe lună. Nu îmi venea să cred că e posibil!', stars: 5 },
            { name: 'Ioana P., București', text: 'Roxana mi-a dat exact ce aveam nevoie: claritate și un plan real. Nu teorie goală.', stars: 5 },
            { name: 'Alina M., Timișoara', text: 'Scăpasem de orice speranță. Acum am 20 de clientele și o afacere stabilă.', stars: 5 },
          ].map(t => (
            <div key={t.name} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#c97d4e] text-[#c97d4e]" />
                ))}
              </div>
              <p className="text-gray-700 italic mb-4 font-sans leading-relaxed">"{t.text}"</p>
              <p className="font-semibold text-sm text-gray-500 font-sans">— {t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT ROXANA */}
      <section className="bg-[#fdf3ea] py-20 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-shrink-0 w-48 h-48 rounded-full overflow-hidden border-4 border-[#c97d4e]/30 shadow-xl">
            <Image src="/roxana.jpg" alt="Roxana Dinca" width={192} height={192} className="object-cover object-top w-full h-full" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">Bună, eu sunt Roxana 👋</h2>
            <p className="text-gray-700 leading-relaxed mb-4 font-sans">
              Am trecut și eu prin momentul în care nu știam cum să atrag clientele, cum să mă promovez sau dacă e posibil să câștig bani din online. Astăzi am ajutat sute de femei să construiască afaceri profitabile de la zero.
            </p>
            <p className="text-gray-700 leading-relaxed font-sans">
              Nu îți vând vise. Îți ofer <strong>strategii concrete</strong>, personalizate, care funcționează în România și nu numai.
            </p>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-24 px-6 text-center bg-gradient-to-br from-[#c97d4e] to-[#a85e35]">
        <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
          Ești gata să schimbi totul?
        </h2>
        <p className="text-white/85 text-xl mb-10 font-sans max-w-2xl mx-auto">
          Locurile sunt limitate. Fiecare client primește atenție individuală — de aceea accept doar câteva persoane pe lună.
        </p>
        <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} large />
        <p className="mt-6 text-white/60 text-sm font-sans">✓ Plată securizată prin Stripe &nbsp;·&nbsp; ✓ Acces imediat</p>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-6 text-center font-sans text-sm">
        <p>© {new Date().getFullYear()} Roxana Dinca · Mentorat Online · Toate drepturile rezervate</p>
        <div className="flex justify-center gap-6 mt-3">
          <a href="/login" className="hover:text-white transition-colors">Intră în cont</a>
          <span>·</span>
          <a href="mailto:roxana@roxii-dinca.com" className="hover:text-white transition-colors">Contact</a>
        </div>
      </footer>

    </main>
  )
}

function BuyButton({ onClick, loading, price, active, large = false }: {
  onClick: () => void
  loading: boolean
  price: string
  active: boolean
  large?: boolean
}) {
  if (!active) {
    return (
      <button disabled className="inline-flex items-center gap-2 bg-gray-400 text-white font-sans font-semibold px-10 py-4 rounded-xl text-lg cursor-not-allowed">
        Lista de așteptare — în curând
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-3 bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed ${large ? 'px-14 py-5 text-xl' : 'px-10 py-4 text-lg'}`}
    >
      {loading ? (
        <>Se procesează...</>
      ) : (
        <>
          Vreau să mă transform acum — {price}
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  )
}
