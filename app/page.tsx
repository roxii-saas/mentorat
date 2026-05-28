'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => setSettings({ price_amount: 297, currency: 'eur', product_name: 'Mentorat Premium cu Roxana', product_description: '', sales_active: true }))

    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
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
    <div className="bg-[#fdf8f3] text-gray-800 overflow-x-hidden">

      {/* ── HEADER ── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#c97d4e] rounded-lg flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className={`font-serif font-bold text-lg transition-colors ${scrolled ? 'text-gray-900' : 'text-gray-900'}`}>
              Roxana <span className="text-[#c97d4e]">Dinca</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden md:flex items-center gap-8">
            {[
              { href: '#despre', label: 'Despre' },
              { href: '#cum-functioneaza', label: 'Cum funcționează' },
              { href: '#testimoniale', label: 'Testimoniale' },
              { href: '#pret', label: 'Preț' },
            ].map(link => (
              <a key={link.href} href={link.href}
                className={`text-sm font-sans font-medium transition-colors hover:text-[#c97d4e] ${scrolled ? 'text-gray-600' : 'text-gray-700'}`}>
                {link.label}
              </a>
            ))}
          </nav>

          {/* CTA + Login */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login"
              className={`text-sm font-sans font-medium transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100 ${scrolled ? 'text-gray-600' : 'text-gray-700'}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              Intră în cont
            </Link>
            <button onClick={handleBuy} disabled={loading || !settings?.sales_active}
              className="bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-60">
              {loading ? 'Se procesează...' : `Începe acum — ${price}`}
            </button>
          </div>

          {/* Hamburger mobile */}
          <button className="md:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-gray-700">
              {menuOpen
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3">
            {['#despre', '#cum-functioneaza', '#testimoniale', '#pret'].map((href, i) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)}
                className="block text-gray-700 font-sans font-medium py-2 hover:text-[#c97d4e]">
                {['Despre', 'Cum funcționează', 'Testimoniale', 'Preț'][i]}
              </a>
            ))}
            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
              <Link href="/login" className="text-center text-gray-600 font-sans font-medium py-2 hover:text-[#c97d4e]">
                Intră în cont
              </Link>
              <button onClick={handleBuy} disabled={loading}
                className="bg-[#c97d4e] text-white font-sans font-semibold py-3 rounded-xl">
                {loading ? 'Se procesează...' : `Începe acum — ${price}`}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="min-h-screen flex flex-col lg:flex-row items-center justify-center px-6 pt-24 pb-16 max-w-6xl mx-auto gap-16">
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#c97d4e]/10 border border-[#c97d4e]/20 text-[#c97d4e] text-xs font-sans font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Mentorat Exclusiv · Locuri Limitate
          </div>

          <h1 className="text-5xl lg:text-7xl font-serif font-bold leading-[1.1] mb-6 text-gray-900">
            De la <span className="text-[#c97d4e] relative">
              0
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 60 8" fill="none">
                <path d="M2 6 Q30 2 58 6" stroke="#c97d4e" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
              </svg>
            </span> la{' '}
            <span className="text-[#c97d4e]">3.000€</span><br/>
            <span className="text-gray-700">pe lună</span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-600 mb-6 leading-relaxed font-sans">
            Scapă de frica că <em className="text-gray-800 not-italic font-medium">tu nu poți</em> și construiește o afacere online care îți aduce libertate și venit constant.
          </p>

          <div className="flex flex-wrap gap-3 justify-center lg:justify-start mb-10">
            {['Claritate în online', 'Strategii personalizate', 'Cum să atragi clientele', 'Cum să te promovezi'].map(tag => (
              <span key={tag} className="flex items-center gap-1.5 text-sm font-sans text-gray-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#c97d4e]">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} />
            <a href="#cum-functioneaza"
              className="inline-flex items-center gap-2 text-gray-600 font-sans font-medium px-6 py-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-white transition-all">
              Cum funcționează?
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-6 mt-8 justify-center lg:justify-start">
            <div className="flex -space-x-2">
              {['bg-rose-300', 'bg-amber-300', 'bg-emerald-300', 'bg-sky-300'].map((c, i) => (
                <div key={i} className={`w-8 h-8 ${c} rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white`}>
                  {['M', 'I', 'A', 'C'][i]}
                </div>
              ))}
            </div>
            <p className="text-sm font-sans text-gray-500">
              <span className="font-semibold text-gray-800">200+</span> femei transformate
            </p>
          </div>
        </div>

        {/* Foto */}
        <div className="flex-shrink-0 relative">
          <div className="absolute -inset-4 bg-gradient-to-br from-[#c97d4e]/20 to-[#f5d5b8]/30 rounded-[40px] blur-2xl" />
          <div className="relative w-72 h-96 lg:w-[420px] lg:h-[560px] rounded-[32px] overflow-hidden shadow-2xl">
            <Image src="/roxana.jpg" alt="Roxana Dinca - Mentor" fill className="object-cover object-top" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 right-6">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
                <p className="font-serif font-bold text-gray-900">Roxana Dinca</p>
                <p className="text-gray-500 text-sm font-sans">Mentor & Coach Business Online</p>
                <div className="flex items-center gap-1 mt-2">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="#c97d4e" className="w-3.5 h-3.5">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                  <span className="text-xs text-gray-500 font-sans ml-1">5.0 · 200+ recenzii</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards */}
          <div className="absolute -left-6 top-1/4 bg-white rounded-2xl shadow-xl p-3 border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 font-sans">+3.000€</p>
                <p className="text-xs text-gray-400 font-sans">venit lunar</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-4 top-1/2 bg-white rounded-2xl shadow-xl p-3 border border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#c97d4e]/10 rounded-xl flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="2" className="w-4 h-4">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 font-sans">200+</p>
                <p className="text-xs text-gray-400 font-sans">cliente</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-gray-900 py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-3 gap-6 text-center">
          {[
            { number: '200+', label: 'Cliente transformate', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
            { number: '3.000€', label: 'Venit mediu lunar atins', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' },
            { number: '98%', label: 'Rata de satisfacție', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z' },
          ].map(stat => (
            <div key={stat.label} className="flex flex-col items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="1.5" className="w-6 h-6 mb-1">
                <path d={stat.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p className="text-3xl lg:text-4xl font-serif font-bold text-white">{stat.number}</p>
              <p className="text-gray-400 text-sm font-sans">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PAIN POINTS ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <span className="text-[#c97d4e] font-sans font-semibold text-xs tracking-widest uppercase">Te recunoști?</span>
          <h2 className="text-3xl lg:text-5xl font-serif font-bold mt-3 mb-4">Îți sună familiar?</h2>
          <p className="text-gray-500 font-sans text-lg max-w-xl mx-auto">Dacă bifezi măcar 2 din 6, ești exact unde trebuie să fii.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Nu știu cum să mă promovez pe social media' },
            { icon: 'M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Am frică că nu sunt suficient de bună pentru a cere bani' },
            { icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', text: 'Încerc tot, dar clientele nu vin' },
            { icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', text: 'Nu am o strategie clară, mă pierd în haos' },
            { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Nu știu cum să îmi stabilesc prețurile corect' },
            { icon: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', text: 'Văd altele reușind și mă întreb de ce nu și eu' },
          ].map(item => (
            <div key={item.text} className="flex items-start gap-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:border-[#c97d4e]/20 hover:shadow-md transition-all group">
              <div className="flex-shrink-0 w-10 h-10 bg-red-50 group-hover:bg-[#c97d4e]/10 rounded-xl flex items-center justify-center transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="1.8" className="w-5 h-5">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-gray-700 font-sans text-sm leading-relaxed pt-1">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOLUTION ── */}
      <section className="bg-white py-24 px-6" id="despre">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#c97d4e] font-sans font-semibold text-xs tracking-widest uppercase">Soluția</span>
            <h2 className="text-3xl lg:text-5xl font-serif font-bold mt-3 mb-4">
              Claritate în online cu{' '}
              <span className="text-[#c97d4e]">strategii personalizate</span>
            </h2>
            <p className="text-gray-500 font-sans text-lg max-w-2xl mx-auto">
              Eu lucrez <strong className="text-gray-800">cu tine</strong>, pe situația ta concretă, ca să construiești un sistem care aduce clientele și bani în mod constant.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
                title: 'Cum să te promovezi',
                desc: 'Strategie de conținut personalizată, prezență autentică și vizibilitate care atrage clientele potrivite.',
                color: 'from-yellow-400 to-orange-400',
              },
              {
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                title: 'Cum să atragi clientele',
                desc: 'Sistem de atracție și conversie — de la follower necunoscut la clientă plătitoare și fidelă.',
                color: 'from-rose-400 to-pink-500',
              },
              {
                icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                title: 'De la 0 la 3.000€',
                desc: 'Planul pas cu pas pentru a construi un venit consistent de 3.000€+ pe lună în 3-6 luni.',
                color: 'from-emerald-400 to-teal-500',
              },
            ].map(item => (
              <div key={item.title} className="relative bg-[#fdf8f3] rounded-3xl p-7 overflow-hidden group hover:shadow-lg transition-all">
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${item.color} opacity-10 rounded-bl-[60px] group-hover:opacity-20 transition-opacity`} />
                <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-5 shadow-md`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-6 h-6">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-serif font-bold text-xl mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 max-w-4xl mx-auto" id="cum-functioneaza">
        <div className="text-center mb-14">
          <span className="text-[#c97d4e] font-sans font-semibold text-xs tracking-widest uppercase">Procesul</span>
          <h2 className="text-3xl lg:text-5xl font-serif font-bold mt-3">Cum funcționează?</h2>
        </div>
        <div className="space-y-4">
          {[
            { step: '01', title: 'Cumperi programul', desc: 'Plata se procesează instant prin Stripe. Primești imediat accesul la platformă pe email.', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
            { step: '02', title: 'Programezi prima sesiune', desc: 'Intri în platformă și alegi direct din calendarul Roxanei un slot care ți se potrivește.', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { step: '03', title: 'Primești strategia personalizată', desc: 'Roxana analizează situația ta și îți creează un plan concret, specific, pe măsura ta.', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
            { step: '04', title: 'Implementezi și crești', desc: 'Urmezi pașii, primești suport continuu și ajungi la 3.000€ pe lună.', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-6 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-[#c97d4e]/20 hover:shadow-md transition-all group">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-2xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                <span className="text-white font-serif font-bold text-lg">{item.step}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="1.8" className="w-4 h-4">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <h3 className="font-serif font-bold text-lg text-gray-900">{item.title}</h3>
                </div>
                <p className="text-gray-600 font-sans text-sm">{item.desc}</p>
              </div>
              <div className="hidden md:flex flex-shrink-0 w-8 h-8 bg-[#c97d4e]/10 rounded-full items-center justify-center text-[#c97d4e]">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHAT'S INCLUDED ── */}
      <section className="bg-white py-24 px-6" id="pret">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#c97d4e] font-sans font-semibold text-xs tracking-widest uppercase">Pachetul complet</span>
            <h2 className="text-3xl lg:text-5xl font-serif font-bold mt-3">Ce primești în program</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z', text: 'Sesiune 1:1 cu Roxana (60 minute)' },
                { icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', text: 'Analiză completă a profilului tău online' },
                { icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', text: 'Strategie personalizată de promovare' },
                { icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4', text: 'Plan de acțiune lunar detaliat' },
                { icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', text: 'Scripturi pentru atragerea clientelelor' },
                { icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text: 'Sistem de prețuri optimizat' },
                { icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', text: 'Suport prin platformă după sesiune' },
                { icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', text: 'Acces la materiale exclusive' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-3 group">
                  <div className="flex-shrink-0 w-8 h-8 bg-[#c97d4e]/10 rounded-lg flex items-center justify-center group-hover:bg-[#c97d4e] transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="#c97d4e" strokeWidth="1.8" className="w-4 h-4 group-hover:stroke-white transition-colors">
                      <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="text-gray-700 font-sans text-sm">{item.text}</span>
                </div>
              ))}
            </div>

            {/* Price card */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-3xl blur opacity-20" />
              <div className="relative bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-3xl p-8 text-white text-center shadow-2xl">
                <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-xs font-sans font-semibold px-3 py-1.5 rounded-full mb-6">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  Investiție unică
                </div>
                <p className="text-white/70 font-sans text-sm mb-2">Programul complet</p>
                <p className="text-6xl font-serif font-bold mb-1">{settings?.price_amount ?? 297}€</p>
                <p className="text-white/60 text-sm font-sans mb-8">o singură plată · acces imediat</p>
                <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} white />
                <div className="mt-6 flex flex-col gap-2">
                  {['Plată securizată Stripe', 'Acces imediat după plată', 'Garanție satisfacție'].map(item => (
                    <div key={item} className="flex items-center justify-center gap-2 text-white/80 text-xs font-sans">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto" id="testimoniale">
        <div className="text-center mb-14">
          <span className="text-[#c97d4e] font-sans font-semibold text-xs tracking-widest uppercase">Povești reale</span>
          <h2 className="text-3xl lg:text-5xl font-serif font-bold mt-3">Ce spun clientele mele</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { name: 'Maria T.', location: 'Cluj', text: 'În 2 luni am ajuns la primii 1.500€ pe lună. Nu îmi venea să cred că e posibil! Roxana m-a ajutat să văd clar ce aveam de făcut.', stars: 5, initials: 'MT' },
            { name: 'Ioana P.', location: 'București', text: 'Roxana mi-a dat exact ce aveam nevoie: claritate și un plan real. Nu teorie goală, ci pași concreți pe care i-am implementat imediat.', stars: 5, initials: 'IP' },
            { name: 'Alina M.', location: 'Timișoara', text: 'Scăpasem de orice speranță că pot face bani online. Acum am 20 de clientele și o afacere stabilă care crește lunar.', stars: 5, initials: 'AM' },
          ].map(t => (
            <div key={t.name} className="bg-white rounded-3xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#c97d4e]/20 transition-all flex flex-col">
              <div className="flex items-center gap-0.5 mb-4">
                {[...Array(t.stars)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="#c97d4e" className="w-4 h-4">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-gray-700 font-sans leading-relaxed flex-1 mb-5 text-sm">"{t.text}"</p>
              <div className="flex items-center gap-3 border-t border-gray-50 pt-4">
                <div className="w-9 h-9 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-full flex items-center justify-center text-white font-sans font-bold text-xs">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 font-sans text-sm">{t.name}</p>
                  <p className="text-gray-400 font-sans text-xs">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section className="bg-white py-24 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#c97d4e]/10 to-[#f5d5b8]/20 rounded-[40px] blur-xl" />
            <div className="relative w-full aspect-square max-w-sm mx-auto rounded-[32px] overflow-hidden shadow-2xl">
              <Image src="/roxana.jpg" alt="Roxana Dinca" fill className="object-cover object-top" />
            </div>
          </div>
          <div>
            <span className="text-[#c97d4e] font-sans font-semibold text-xs tracking-widest uppercase">Mentorul tău</span>
            <h2 className="text-3xl lg:text-4xl font-serif font-bold mt-3 mb-6">Bună, eu sunt Roxana</h2>
            <p className="text-gray-600 leading-relaxed mb-4 font-sans">
              Am trecut și eu prin momentul în care nu știam cum să atrag clientele, cum să mă promovez sau dacă e posibil să câștig bani din online. Știu exact cum te simți.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6 font-sans">
              Astăzi am ajutat <strong className="text-gray-800">200+ femei</strong> să construiască afaceri profitabile de la zero. Nu îți vând vise — îți ofer <strong className="text-gray-800">strategii concrete</strong>, personalizate, care funcționează.
            </p>
            <div className="flex flex-wrap gap-3">
              {['200+ cliente', '3 ani experiență', 'Rezultate reale'].map(badge => (
                <span key={badge} className="flex items-center gap-1.5 bg-[#c97d4e]/10 text-[#c97d4e] font-sans font-semibold text-xs px-3 py-1.5 rounded-full">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {badge}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINALE ── */}
      <section className="py-28 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #c97d4e 0%, transparent 50%), radial-gradient(circle at 80% 50%, #a85e35 0%, transparent 50%)' }} />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#c97d4e]/20 border border-[#c97d4e]/30 text-[#e8a076] text-xs font-sans font-semibold px-4 py-2 rounded-full mb-8 tracking-widest uppercase">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Locuri limitate · Aplică acum
          </div>
          <h2 className="text-4xl lg:text-6xl font-serif font-bold text-white mb-6">
            Ești gata să schimbi totul?
          </h2>
          <p className="text-gray-300 text-xl mb-12 font-sans leading-relaxed">
            Fiecare clientă primește atenție individuală.<br/>De aceea accept doar câteva persoane pe lună.
          </p>
          <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} large white />
          <div className="flex items-center justify-center gap-6 mt-8">
            {['Plată securizată', 'Acces imediat', 'Garanție satisfacție'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-gray-400 text-sm font-sans">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#c97d4e]">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-950 text-gray-400 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            {/* Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 bg-[#c97d4e] rounded-lg flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-serif font-bold text-white">Roxana Dinca</span>
              </div>
              <p className="text-sm font-sans leading-relaxed text-gray-500">
                Mentor & Coach de Business Online. Ajut femeile să construiască afaceri profitabile de la zero.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="font-sans font-semibold text-white text-sm mb-4">Navigare</p>
              <ul className="space-y-2.5">
                {[
                  { href: '#despre', label: 'Despre Roxana' },
                  { href: '#cum-functioneaza', label: 'Cum funcționează' },
                  { href: '#testimoniale', label: 'Testimoniale' },
                  { href: '#pret', label: 'Preț & Program' },
                ].map(link => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm font-sans text-gray-500 hover:text-[#c97d4e] transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact + Login */}
            <div>
              <p className="font-sans font-semibold text-white text-sm mb-4">Contact & Cont</p>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:roxana@roxii-dinca.com" className="flex items-center gap-2 text-sm font-sans text-gray-500 hover:text-[#c97d4e] transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    roxana@roxii-dinca.com
                  </a>
                </li>
                <li>
                  <Link href="/login" className="flex items-center gap-2 text-sm font-sans text-gray-500 hover:text-[#c97d4e] transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Intră în cont
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="flex items-center gap-2 text-sm font-sans text-gray-500 hover:text-[#c97d4e] transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                    </svg>
                    Dashboard clientă
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs font-sans text-gray-600">
              © {new Date().getFullYear()} Roxana Dinca · Toate drepturile rezervate
            </p>
            <div className="flex items-center gap-2 text-xs font-sans text-gray-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#c97d4e]">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Plată securizată prin Stripe · Date protejate
            </div>
          </div>
        </div>
      </footer>

    </div>
  )
}

function BuyButton({ onClick, loading, price, active, large = false, white = false }: {
  onClick: () => void
  loading: boolean
  price: string
  active: boolean
  large?: boolean
  white?: boolean
}) {
  if (!active) {
    return (
      <button disabled className={`inline-flex items-center gap-2 font-sans font-semibold rounded-2xl cursor-not-allowed opacity-60 ${white ? 'bg-white/20 text-white border-2 border-white/30' : 'bg-gray-200 text-gray-500'} ${large ? 'px-12 py-5 text-lg' : 'px-8 py-4 text-base'}`}>
        Lista de așteptare — în curând
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-3 font-sans font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed
        ${white
          ? 'bg-white text-[#c97d4e] hover:bg-gray-50'
          : 'bg-[#c97d4e] hover:bg-[#a85e35] text-white'
        }
        ${large ? 'px-12 py-5 text-xl' : 'px-8 py-4 text-base'}`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Se procesează...
        </span>
      ) : (
        <>
          Vreau să mă transform — {price}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </>
      )}
    </button>
  )
}
