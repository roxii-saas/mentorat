'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Settings {
  price_amount: number
  currency: string
  product_name: string
  sales_active: boolean
}

interface Props {
  initialSettings: Settings
}

export default function LandingClient({ initialSettings }: Props) {
  // Inizializzato subito con i dati server — zero flash
  const [settings] = useState<Settings>(initialSettings)
  const [loading] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [spotsLeft] = useState(3)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })

    // Reveal on scroll
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.1 }
    )
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    // Parallax mouse (desktop only)
    const onMouseMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024 || !heroRef.current) return
      const { clientX, clientY } = e
      const x = (clientX / window.innerWidth - 0.5) * 20
      const y = (clientY / window.innerHeight - 0.5) * 20
      heroRef.current.style.setProperty('--mx', `${x}px`)
      heroRef.current.style.setProperty('--my', `${y}px`)
    }
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouseMove)
      observer.disconnect()
    }
  }, [])

  const handleBuy = () => {
    if (!settings?.sales_active) return
    window.location.href = '/checkout'
  }

  const price = settings ? formatPrice(settings.price_amount, settings.currency.toUpperCase()) : '297 €'

  return (
    <div className="bg-[#fdf8f3] text-gray-800 overflow-x-hidden">

      {/* ═══════════ HEADER STICKY ═══════════ */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'glass shadow-sm border-b border-gray-100/50' : 'bg-transparent'}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-xl flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-lg text-gray-900 hidden xs:inline">
              Roxana<span className="text-[#c97d4e]">.</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {[
              { href: '#despre', label: 'Despre' },
              { href: '#cum-functioneaza', label: 'Cum funcționează' },
              { href: '#rezultate', label: 'Rezultate' },
              { href: '#pret', label: 'Preț' },
            ].map(link => (
              <a key={link.href} href={link.href} className="text-sm font-sans font-medium text-gray-700 hover:text-[#c97d4e] transition-colors relative group">
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#c97d4e] transition-all group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
            <Link href="/login" className="text-sm font-sans font-medium text-gray-700 hover:text-[#c97d4e] transition-colors flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-gray-100/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <span className="hidden md:inline">Cont</span>
            </Link>
            <button onClick={handleBuy} disabled={loading || !settings?.sales_active}
              className="bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-semibold text-sm px-4 sm:px-5 py-2.5 rounded-xl shadow-md hover:shadow-xl active:scale-95 transition-all disabled:opacity-60 whitespace-nowrap">
              {loading ? '...' : <>Începe — {price}</>}
            </button>
          </div>

          <button className="sm:hidden p-2 -mr-2" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6 text-gray-700">
              {menuOpen
                ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                : <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden glass border-t border-gray-100 px-6 py-4 space-y-1 animate-fade-up">
            {[['#despre', 'Despre'], ['#cum-functioneaza', 'Cum funcționează'], ['#rezultate', 'Rezultate'], ['#pret', 'Preț']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-gray-700 font-sans font-medium py-2.5 hover:text-[#c97d4e]">
                {label}
              </a>
            ))}
            <div className="border-t border-gray-200 pt-3 flex flex-col gap-2 mt-2">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-center text-gray-600 font-sans font-medium py-2.5 border border-gray-200 rounded-xl">
                Intră în cont
              </Link>
              <button onClick={() => { setMenuOpen(false); handleBuy() }} disabled={loading}
                className="bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-semibold py-3 rounded-xl shadow-md">
                {loading ? 'Se procesează...' : `Începe acum — ${price}`}
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ═══════════ HERO 3D ═══════════ */}
      <section ref={heroRef} className="relative min-h-screen flex flex-col lg:flex-row items-center justify-center px-4 sm:px-6 pt-24 pb-16 max-w-6xl mx-auto gap-10 lg:gap-16 perspective-1000">

        {/* Blobs animati background */}
        <div className="absolute top-20 -left-20 w-72 h-72 bg-[#c97d4e]/20 rounded-full blur-3xl animate-blob" aria-hidden />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#f5d5b8]/30 rounded-full blur-3xl animate-blob" style={{ animationDelay: '3s' }} aria-hidden />

        <div className="flex-1 text-center lg:text-left z-10">
          {/* Urgency badge */}
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-100 text-red-700 text-xs font-sans font-bold px-3 sm:px-4 py-2 rounded-full mb-6 sm:mb-8 tracking-wide animate-pulse-glow">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            Doar {spotsLeft} locuri disponibile luna aceasta
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif font-bold leading-[1.05] mb-5 sm:mb-6 text-gray-900">
            De la <span className="relative inline-block">
              <span className="shimmer-text">0</span>
            </span> la{' '}
            <span className="relative inline-block">
              <span className="shimmer-text">3.000€</span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 8" fill="none" preserveAspectRatio="none">
                <path d="M2 6 Q50 1 98 6" stroke="#c97d4e" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
              </svg>
            </span><br/>
            <span className="text-gray-700">pe lună</span>
          </h1>

          <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-5 sm:mb-6 leading-relaxed font-sans max-w-xl mx-auto lg:mx-0">
            Scapă de frica că <em className="text-gray-900 not-italic font-semibold relative">
              tu nu poți
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 60 4" fill="none" preserveAspectRatio="none">
                <path d="M2 2 Q30 4 58 2" stroke="#c97d4e" strokeWidth="2" fill="none"/>
              </svg>
            </em> și construiește o afacere care îți aduce libertate și venit constant.
          </p>

          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-8">
            {['Claritate online', 'Strategii personalizate', 'Atragi clientele', 'Te promovezi'].map(tag => (
              <span key={tag} className="flex items-center gap-1.5 text-xs sm:text-sm font-sans text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-[#c97d4e]">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                {tag}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">
            <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} large />
            <a href="#cum-functioneaza"
              className="inline-flex items-center justify-center gap-2 text-gray-700 font-sans font-semibold px-6 py-4 rounded-2xl border-2 border-gray-200 hover:border-[#c97d4e]/40 hover:bg-white transition-all">
              Vezi cum funcționează
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 animate-bounce">
                <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 mt-8 justify-center lg:justify-start">
            <div className="flex -space-x-3">
              {['bg-rose-300', 'bg-amber-300', 'bg-emerald-300', 'bg-sky-300'].map((c, i) => (
                <div key={i} className={`w-9 h-9 ${c} rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white shadow-md`}>
                  {['M', 'I', 'A', 'C'][i]}
                </div>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="#c97d4e" className="w-3.5 h-3.5">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <p className="text-xs sm:text-sm font-sans text-gray-600">
                <strong className="text-gray-900">200+ femei</strong> au început deja
              </p>
            </div>
          </div>
        </div>

        {/* Photo + Cards 3D */}
        <div className="flex-shrink-0 relative w-full max-w-sm lg:max-w-none lg:w-auto"
             style={{ transform: 'translate3d(var(--mx, 0), var(--my, 0), 0)' }}>
          <div className="relative animate-float-3d preserve-3d">
            <div className="absolute -inset-6 bg-gradient-to-br from-[#c97d4e]/30 to-[#f5d5b8]/40 rounded-[40px] blur-3xl" />
            <div className="relative w-full aspect-[3/4] lg:w-[420px] lg:h-[560px] rounded-[32px] overflow-hidden shadow-2xl border border-white/20">
              <Image src="/roxana.jpg" alt="Roxana Dinca" fill className="object-cover object-top" priority />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="glass rounded-2xl p-3 sm:p-4 shadow-xl">
                  <p className="font-serif font-bold text-gray-900 text-sm sm:text-base">Roxana Dinca</p>
                  <p className="text-gray-600 text-xs font-sans">Mentor & Coach Business Online</p>
                  <div className="flex items-center gap-1 mt-1.5">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" fill="#c97d4e" className="w-3 h-3">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                    <span className="text-[10px] sm:text-xs text-gray-500 font-sans ml-1">5.0 · 200+ recenzii</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating cards 3D */}
          <div className="absolute -left-4 sm:-left-8 top-1/4 bg-white rounded-2xl shadow-2xl p-3 sm:p-4 border border-gray-100 animate-float-card-1 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                  <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-800 font-sans">+3.000€</p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-sans">venit lunar</p>
              </div>
            </div>
          </div>

          <div className="absolute -right-2 sm:-right-6 top-1/2 bg-white rounded-2xl shadow-2xl p-3 sm:p-4 border border-gray-100 animate-float-card-2 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-xl flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-800 font-sans">200+</p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-sans">cliente</p>
              </div>
            </div>
          </div>

          <div className="absolute -left-2 sm:-left-6 bottom-1/4 bg-white rounded-2xl shadow-2xl p-3 sm:p-4 border border-gray-100 animate-float-card-3 z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-gray-800 font-sans">98%</p>
                <p className="text-[10px] sm:text-xs text-gray-500 font-sans">satisfacție</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ MARQUEE LOGOS / TRUST ═══════════ */}
      <section className="bg-gray-900 py-6 overflow-hidden">
        <div className="flex items-center gap-12 sm:gap-16 animate-marquee whitespace-nowrap">
          {[...Array(2)].flatMap(() => [
            '✓ 200+ Cliente Mulțumite',
            '★ 5.0 Rating',
            '€ 3.000+ Venit Mediu',
            '⚡ Rezultate în 60 zile',
            '🔒 Plată Securizată Stripe',
            '📊 98% Rata Satisfacție',
          ]).map((text, i) => (
            <span key={i} className="text-white/60 text-sm font-sans font-medium tracking-wide">
              {text}
            </span>
          ))}
        </div>
      </section>

      {/* ═══════════ AGITAZIONE PROBLEMA ═══════════ */}
      <section className="py-20 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto reveal">
        <div className="text-center mb-12">
          <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Te recunoști?</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 mb-4 text-gray-900">
            Dacă bifezi 2 sau mai multe...<br/><span className="text-[#c97d4e]">ai nevoie de mentorat acum.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {[
            { emoji: '😣', text: 'Nu știu cum să mă promovez pe social media fără să par disperată' },
            { emoji: '😟', text: 'Am frică că nu sunt suficient de bună pentru a cere bani' },
            { emoji: '😩', text: 'Încerc tot, postez constant, dar clientele nu vin' },
            { emoji: '😵‍💫', text: 'Nu am o strategie clară, mă pierd în haos' },
            { emoji: '🤔', text: 'Nu știu cum să îmi stabilesc prețurile corect' },
            { emoji: '😔', text: 'Văd altele reușind și mă întreb de ce nu și eu' },
          ].map(item => (
            <div key={item.text} className="flex items-start gap-3 sm:gap-4 bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 hover:border-red-200 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              <span className="text-2xl sm:text-3xl flex-shrink-0">{item.emoji}</span>
              <p className="text-gray-700 font-sans text-sm leading-relaxed pt-0.5">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-base sm:text-lg font-sans text-gray-600 italic">
            "Nu ești singură. <strong className="text-gray-900 not-italic">Și nu e vina ta.</strong> Lipsește doar o strategie."
          </p>
        </div>
      </section>

      {/* ═══════════ SOLUZIONE (DESPRE) ═══════════ */}
      <section id="despre" className="bg-gradient-to-b from-white to-[#fdf3ea] py-20 sm:py-24 px-4 sm:px-6 reveal">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Soluția</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 mb-5 text-gray-900">
              3 piloni pentru a ajunge la <span className="text-[#c97d4e]">3.000€/lună</span>
            </h2>
            <p className="text-gray-600 font-sans text-base sm:text-lg max-w-2xl mx-auto">
              Strategii concrete, testate cu 200+ femei. Nu teorie. <strong>Rezultate.</strong>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
            {[
              {
                num: '01',
                icon: 'M13 10V3L4 14h7v7l9-11h-7z',
                title: 'Cum să te promovezi',
                desc: 'Strategie de conținut autentică. Prezență magnetică. Vizibilitate care atrage clientele potrivite — fără să te epuizezi.',
                color: 'from-yellow-400 to-orange-500',
                bg: 'from-yellow-50 to-orange-50',
              },
              {
                num: '02',
                icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
                title: 'Cum să atragi clientele',
                desc: 'Sistem complet de atracție și conversie. De la follower necunoscut la clientă plătitoare care te recomandă mai departe.',
                color: 'from-rose-400 to-pink-600',
                bg: 'from-rose-50 to-pink-50',
              },
              {
                num: '03',
                icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                title: 'De la 0 la 3.000€',
                desc: 'Planul pas cu pas. Prețuri optimizate. Servicii premium. Venit consistent de 3.000€+ în maxim 6 luni.',
                color: 'from-emerald-400 to-teal-600',
                bg: 'from-emerald-50 to-teal-50',
              },
            ].map(item => (
              <div key={item.title} className={`tilt-card relative bg-gradient-to-br ${item.bg} rounded-3xl p-6 sm:p-7 overflow-hidden group shadow-md hover:shadow-2xl`}>
                <div className="absolute top-3 right-3 text-6xl font-serif font-bold text-white/40 select-none">
                  {item.num}
                </div>
                <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-7 h-7">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-serif font-bold text-xl sm:text-2xl mb-3 text-gray-900">{item.title}</h3>
                <p className="text-gray-700 text-sm leading-relaxed font-sans">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CUM FUNCȚIONEAZĂ — TIMELINE ═══════════ */}
      <section id="cum-functioneaza" className="py-20 sm:py-24 px-4 sm:px-6 max-w-5xl mx-auto reveal">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Procesul în 4 pași</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 text-gray-900">
            Cum funcționează?
          </h2>
          <p className="text-gray-600 font-sans text-base sm:text-lg mt-3 max-w-xl mx-auto">
            De la prima clicătură la primii 3.000€ — totul într-un flux clar și simplu.
          </p>
        </div>

        {/* TIMELINE */}
        <div className="relative">
          {/* Linea verticale centrale (desktop) / sinistra (mobile) */}
          <div className="absolute left-7 md:left-1/2 md:-translate-x-1/2 top-2 bottom-2 w-1 bg-gradient-to-b from-[#c97d4e] via-[#c97d4e]/50 to-[#c97d4e]/10 rounded-full" />

          <div className="space-y-10 sm:space-y-12">
            {[
              {
                step: '01',
                time: 'Ziua 1 · 60 secunde',
                title: 'Cumperi programul',
                desc: 'Plată securizată prin Stripe. Primești instant pe email datele de acces la platforma de mentorat.',
                icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
                color: 'from-blue-400 to-indigo-500',
              },
              {
                step: '02',
                time: 'Ziua 1 · în 5 minute',
                title: 'Programezi prima sesiune',
                desc: 'Intri în platformă, alegi din calendarul Roxanei un slot care îți convine. Confirmare instantanee.',
                icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
                color: 'from-purple-400 to-pink-500',
              },
              {
                step: '03',
                time: 'Sesiunea ta · 60 minute',
                title: 'Primești strategia personalizată',
                desc: 'Roxana analizează situația ta concretă și îți creează un plan specific, pas cu pas, pe măsura ta.',
                icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
                color: 'from-amber-400 to-orange-500',
              },
              {
                step: '04',
                time: 'În următoarele 3-6 luni',
                title: 'Implementezi și crești',
                desc: 'Urmezi pașii cu suport continuu prin platformă. Ajungi la 3.000€+/lună și depășești-ți obiectivele.',
                icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
                color: 'from-emerald-400 to-teal-500',
              },
            ].map((item, i) => {
              const isRight = i % 2 === 1
              return (
                <div key={i} className={`relative flex items-center gap-4 md:gap-8 ${isRight ? 'md:flex-row-reverse' : ''}`}>

                  {/* Step indicator (number bubble) */}
                  <div className="absolute left-7 md:left-1/2 md:-translate-x-1/2 -translate-y-0 z-10">
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center shadow-xl border-4 border-[#fdf8f3] animate-pulse-glow`}>
                      <span className="text-white font-serif font-bold text-lg">{item.step}</span>
                    </div>
                  </div>

                  {/* Spazio per la linea su mobile */}
                  <div className="w-14 md:w-1/2 flex-shrink-0 md:flex-shrink" />

                  {/* Card content */}
                  <div className={`flex-1 md:w-1/2 ${isRight ? 'md:pr-12' : 'md:pl-12'} pl-2 md:pl-12`}>
                    <div className={`bg-white rounded-2xl p-5 sm:p-6 shadow-md border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group ${isRight ? 'md:text-right' : ''}`}>
                      <div className={`flex items-center gap-2 mb-2 ${isRight ? 'md:flex-row-reverse md:justify-start' : ''}`}>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                            <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-xs font-sans font-bold text-[#c97d4e] uppercase tracking-wider">
                          {item.time}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-gray-900 mb-2">{item.title}</h3>
                      <p className="text-gray-600 font-sans text-sm leading-relaxed">{item.desc}</p>
                    </div>

                    {/* Connecting arrow (only desktop) */}
                    <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 ${isRight ? 'right-1/2 mr-7' : 'left-1/2 ml-7'}`}>
                      <svg viewBox="0 0 24 24" fill="#c97d4e" className={`w-4 h-4 ${isRight ? 'rotate-180' : ''}`}>
                        <path d="M9 5l7 7-7 7"/>
                      </svg>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Final flag */}
          <div className="relative mt-12 flex justify-center">
            <div className="absolute left-7 md:left-1/2 md:-translate-x-1/2 -top-4 z-10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#c97d4e] to-[#a85e35] flex items-center justify-center shadow-xl border-4 border-[#fdf8f3]">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="ml-20 md:ml-0 md:mt-16 inline-flex items-center gap-2 bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-bold px-6 py-3 rounded-full shadow-xl">
              <span>🎉</span>
              Ai ajuns la 3.000€/lună!
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ TRANSFORMARE PRIMA/DUPĂ ═══════════ */}
      <section className="bg-gray-50 py-20 sm:py-24 px-4 sm:px-6 reveal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Transformarea</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 text-gray-900">
              Înainte vs. <span className="text-[#c97d4e]">După</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
            {/* Înainte */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-red-100 shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-50 rounded-bl-full opacity-50" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-red-50 text-red-700 font-sans font-bold text-xs px-3 py-1.5 rounded-full mb-5">
                  <span>❌</span> ÎNAINTE
                </div>
                <ul className="space-y-3">
                  {[
                    'Postezi mult, primești 0 clientele',
                    'Te subapreciezi și ceri prețuri mici',
                    'Lucrezi 12h/zi pentru 500€/lună',
                    'Te compari constant cu altele',
                    'Nu ai timp pentru tine sau familie',
                    'Te simți blocată și demotivată',
                  ].map(text => (
                    <li key={text} className="flex items-start gap-2.5 text-gray-700 font-sans text-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0 mt-0.5">
                        <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
                      </svg>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* După */}
            <div className="bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden transform md:scale-105">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/20 text-white font-sans font-bold text-xs px-3 py-1.5 rounded-full mb-5">
                  <span>✓</span> DUPĂ MENTORAT
                </div>
                <ul className="space-y-3">
                  {[
                    'Strategie clară care aduce clientele constant',
                    'Prețuri premium pe care le poți susține',
                    'Lucrezi 5h/zi și câștigi 3.000€+/lună',
                    'Ai propria autoritate și încredere',
                    'Timp pentru tine, familie și hobby-uri',
                    'Te simți puternică, motivată și liberă',
                  ].map(text => (
                    <li key={text} className="flex items-start gap-2.5 font-sans text-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0 mt-0.5">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {text}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PREȚ / OFERTA ═══════════ */}
      <section id="pret" className="bg-white py-20 sm:py-24 px-4 sm:px-6 reveal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Investiția ta</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 mb-4 text-gray-900">
              Tot ce primești în program
            </h2>
            <p className="text-gray-600 font-sans text-base sm:text-lg max-w-2xl mx-auto">
              Pachet complet · Acces imediat · Garanție de satisfacție
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-stretch">
            {/* Lista beneficii */}
            <div className="lg:col-span-3 bg-[#fdf8f3] rounded-3xl p-6 sm:p-8 border border-gray-100">
              <h3 className="font-serif font-bold text-xl sm:text-2xl mb-6 text-gray-900">Ce include programul:</h3>
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                {[
                  { value: '297€', text: 'Sesiune 1:1 cu Roxana (60 min)' },
                  { value: '147€', text: 'Analiză completă profil online' },
                  { value: '197€', text: 'Strategie personalizată promovare' },
                  { value: '97€', text: 'Plan acțiune lunar detaliat' },
                  { value: '147€', text: 'Scripturi pentru atragere clientele' },
                  { value: '97€', text: 'Sistem prețuri optimizat' },
                  { value: '197€', text: 'Suport prin platformă post-sesiune' },
                  { value: '197€', text: 'Materiale exclusive + bonusuri' },
                ].map(item => (
                  <div key={item.text} className="flex items-start gap-3 bg-white rounded-xl p-3 sm:p-4 border border-gray-100">
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center shadow-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-800 font-sans text-sm font-semibold">{item.text}</p>
                      <p className="text-gray-400 font-sans text-xs line-through">Valoare: {item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
                <span className="font-sans text-sm text-gray-500">Valoare totală:</span>
                <span className="font-serif font-bold text-2xl text-gray-400 line-through">1.376€</span>
              </div>
            </div>

            {/* Price Card */}
            <div className="lg:col-span-2 relative">
              <div className="absolute -inset-2 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-3xl blur-2xl opacity-30 animate-pulse-glow" />
              <div className="relative h-full bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-3xl p-6 sm:p-8 text-white text-center shadow-2xl flex flex-col">
                <div className="inline-flex self-center items-center gap-1.5 bg-white/20 backdrop-blur-sm text-white text-xs font-sans font-bold px-3 py-1.5 rounded-full mb-5">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  OFERTĂ LIMITATĂ
                </div>
                <p className="text-white/80 font-sans text-sm mb-1">Plătești doar</p>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <p className="text-5xl sm:text-7xl font-serif font-bold">{price}</p>
                </div>
                <p className="text-white/70 text-sm font-sans mb-2">o singură plată</p>
                <p className="text-white/90 text-xs font-sans font-semibold bg-white/10 rounded-full py-1.5 px-3 inline-block self-center mb-6">
                  Economisești 1.079€
                </p>

                <div className="flex-1 flex flex-col justify-end gap-3">
                  <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} white />
                  <div className="flex flex-col gap-1.5 mt-2">
                    {['Plată securizată Stripe', 'Acces imediat', 'Garanție satisfacție'].map(item => (
                      <div key={item} className="flex items-center justify-center gap-1.5 text-white/85 text-xs font-sans">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
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
        </div>
      </section>

      {/* ═══════════ TESTIMONIALE ═══════════ */}
      <section id="rezultate" className="py-20 sm:py-24 px-4 sm:px-6 max-w-6xl mx-auto reveal">
        <div className="text-center mb-12">
          <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Povești reale</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 text-gray-900">
            Ce spun clientele mele
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5 sm:gap-6">
          {[
            { name: 'Maria T.', location: 'Cluj-Napoca', text: 'În 2 luni am ajuns la primii 1.500€. În 4 luni am depășit 3.000€/lună. Nu îmi venea să cred că e posibil să se schimbe atât de mult viața mea!', stars: 5, initials: 'MT', result: '0 → 3.200€/lună' },
            { name: 'Ioana P.', location: 'București', text: 'Roxana mi-a dat exact ce aveam nevoie: claritate și un plan real. Nu teorie goală, ci pași concreți pe care i-am implementat imediat. Recomand!', stars: 5, initials: 'IP', result: '+2.500€/lună' },
            { name: 'Alina M.', location: 'Timișoara', text: 'Scăpasem de orice speranță că pot face bani online. Acum am 20 de clientele lunare și o afacere stabilă care crește constant.', stars: 5, initials: 'AM', result: '0 → 4.000€/lună' },
          ].map(t => (
            <div key={t.name} className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-0.5">
                  {[...Array(t.stars)].map((_, i) => (
                    <svg key={i} viewBox="0 0 24 24" fill="#c97d4e" className="w-4 h-4">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                  ))}
                </div>
                <span className="text-xs font-sans font-bold bg-green-50 text-green-700 px-2.5 py-1 rounded-full">
                  {t.result}
                </span>
              </div>
              <svg viewBox="0 0 24 24" fill="#c97d4e" className="w-7 h-7 opacity-30 mb-2">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
              <p className="text-gray-700 font-sans leading-relaxed flex-1 mb-5 text-sm">{t.text}</p>
              <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
                <div className="w-10 h-10 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-full flex items-center justify-center text-white font-sans font-bold text-xs shadow-md">
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 font-sans text-sm">{t.name}</p>
                  <p className="text-gray-500 font-sans text-xs">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ ABOUT ROXANA ═══════════ */}
      <section className="bg-gradient-to-b from-[#fdf3ea] to-white py-20 sm:py-24 px-4 sm:px-6 reveal">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 sm:gap-12 items-center">
          <div className="relative max-w-sm mx-auto md:max-w-none w-full perspective-1000">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#c97d4e]/20 to-[#f5d5b8]/30 rounded-[40px] blur-2xl" />
            <div className="relative w-full aspect-square rounded-[32px] overflow-hidden shadow-2xl animate-float-slow">
              <Image src="/roxana.jpg" alt="Roxana Dinca" fill className="object-cover object-top" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 z-10">
              <p className="text-3xl font-serif font-bold text-[#c97d4e]">3+</p>
              <p className="text-xs text-gray-500 font-sans">ani experiență</p>
            </div>
          </div>

          <div>
            <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Mentorul tău</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 mb-6 text-gray-900">
              Bună, eu sunt Roxana 👋
            </h2>
            <p className="text-gray-600 leading-relaxed mb-4 font-sans">
              Am trecut și eu prin momentul în care nu știam cum să atrag clientele, cum să mă promovez sau dacă e posibil să câștig bani din online. <strong className="text-gray-800">Știu exact cum te simți.</strong>
            </p>
            <p className="text-gray-600 leading-relaxed mb-6 font-sans">
              Astăzi am ajutat <strong className="text-gray-900">200+ femei</strong> să construiască afaceri profitabile de la zero. Nu îți vând vise — îți ofer <strong className="text-gray-900">strategii concrete</strong> care funcționează.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {['200+ cliente', '3+ ani experiență', 'Rezultate reale', '98% satisfacție'].map(badge => (
                <span key={badge} className="flex items-center gap-1.5 bg-white border border-[#c97d4e]/20 text-[#c97d4e] font-sans font-semibold text-xs px-3 py-2 rounded-full shadow-sm">
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

      {/* ═══════════ FAQ ═══════════ */}
      <section className="bg-white py-20 sm:py-24 px-4 sm:px-6 reveal">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#c97d4e] font-sans font-bold text-xs tracking-[0.2em] uppercase">Întrebări frecvente</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold mt-3 text-gray-900">
              Mai ai întrebări?
            </h2>
          </div>

          <div className="space-y-3">
            {[
              { q: 'Pentru cine este acest mentorat?', a: 'Pentru femei care vor să-și construiască o afacere online profitabilă. Indiferent dacă ești la început sau ai deja încercat fără succes, te ajut să creezi un sistem care funcționează.' },
              { q: 'Cât timp îmi va lua să văd rezultate?', a: 'Majoritatea clientelor mele văd primele rezultate concrete în 30-60 de zile. La 3-6 luni ajung de obicei la 3.000€+/lună, dacă implementează strategia.' },
              { q: 'Ce se întâmplă după plată?', a: 'Primești instant pe email datele de acces la platformă. De acolo, programezi prima sesiune cu mine din calendarul disponibil.' },
              { q: 'Cum se desfășoară sesiunea?', a: 'Online, prin Google Meet sau Zoom. Eu analizez situația ta și îți propun o strategie personalizată, pas cu pas.' },
              { q: 'Pot să cer rambursare?', a: 'Da, oferim garanție de satisfacție. Dacă după prima sesiune nu ești mulțumită, primești banii înapoi.' },
            ].map((faq, i) => (
              <details key={i} className="group bg-[#fdf8f3] rounded-2xl border border-gray-100 overflow-hidden">
                <summary className="cursor-pointer flex items-center justify-between gap-4 p-5 sm:p-6 list-none font-serif font-semibold text-gray-900 text-base sm:text-lg hover:text-[#c97d4e] transition-colors">
                  {faq.q}
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5 flex-shrink-0 transition-transform group-open:rotate-180">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </summary>
                <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-gray-600 font-sans text-sm leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA FINALE ═══════════ */}
      <section className="py-24 sm:py-28 px-4 sm:px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #c97d4e 0%, transparent 50%), radial-gradient(circle at 80% 70%, #a85e35 0%, transparent 50%)' }} />
        <div className="absolute top-10 left-10 w-32 h-32 bg-[#c97d4e]/30 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-10 right-10 w-40 h-40 bg-[#f5d5b8]/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-400/30 text-red-200 text-xs font-sans font-bold px-4 py-2 rounded-full mb-8 tracking-widest uppercase animate-pulse-glow">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-300 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-400" />
            </span>
            Doar {spotsLeft} locuri rămase
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white mb-6 leading-tight">
            Ești gata să schimbi <span className="shimmer-text">totul</span>?
          </h2>
          <p className="text-gray-300 text-lg sm:text-xl mb-10 font-sans leading-relaxed">
            Următoarea ta versiune începe astăzi.<br className="hidden sm:block"/>
            Mâine ai putea fi deja cu strategie clară și primele clientele.
          </p>
          <BuyButton onClick={handleBuy} loading={loading} price={price} active={settings?.sales_active ?? true} large white />
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8">
            {['Plată securizată', 'Acces imediat', 'Garanție satisfacție'].map(item => (
              <div key={item} className="flex items-center gap-1.5 text-gray-400 text-xs sm:text-sm font-sans">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-[#c97d4e]">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="bg-gray-950 text-gray-400 py-12 sm:py-14 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-serif font-bold text-white text-lg">Roxana Dinca</span>
              </div>
              <p className="text-sm font-sans leading-relaxed text-gray-500">
                Mentor & Coach de Business Online. Ajut femeile să construiască afaceri profitabile de la zero.
              </p>
            </div>

            <div>
              <p className="font-sans font-semibold text-white text-sm mb-4">Navigare</p>
              <ul className="space-y-2.5">
                {[
                  { href: '#despre', label: 'Despre Roxana' },
                  { href: '#cum-functioneaza', label: 'Cum funcționează' },
                  { href: '#rezultate', label: 'Rezultate' },
                  { href: '#pret', label: 'Preț & Program' },
                ].map(link => (
                  <li key={link.href}>
                    <a href={link.href} className="text-sm font-sans text-gray-500 hover:text-[#c97d4e] transition-colors">{link.label}</a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-sans font-semibold text-white text-sm mb-4">Cont & Contact</p>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:roxana@roxii-dinca.com" className="flex items-center gap-2 text-sm font-sans text-gray-500 hover:text-[#c97d4e] transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                      <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Trimite email
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

          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs font-sans text-gray-600">
              © {new Date().getFullYear()} Roxana Dinca · Toate drepturile rezervate
            </p>
            <div className="flex items-center gap-2 text-xs font-sans text-gray-600">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-[#c97d4e]">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Plată securizată Stripe · Date protejate
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3 shadow-2xl">
        <button onClick={handleBuy} disabled={loading || !settings?.sales_active}
          className="w-full bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
          {loading ? 'Se procesează...' : (
            <>Începe acum — {price}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg></>
          )}
        </button>
      </div>
      <div className="sm:hidden h-20" aria-hidden /> {/* spacer for sticky CTA */}

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
      <button disabled className={`inline-flex items-center gap-2 font-sans font-semibold rounded-2xl cursor-not-allowed opacity-60 ${white ? 'bg-white/20 text-white border-2 border-white/30' : 'bg-gray-200 text-gray-500'} ${large ? 'px-10 py-5 text-base sm:text-lg' : 'px-6 py-4 text-sm sm:text-base'}`}>
        Lista de așteptare — în curând
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`group relative inline-flex items-center justify-center gap-2 sm:gap-3 font-sans font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed overflow-hidden
        ${white
          ? 'bg-white text-[#c97d4e] hover:bg-gray-50'
          : 'bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white hover:from-[#b86d3e] hover:to-[#984e25]'
        }
        ${large ? 'px-8 sm:px-12 py-4 sm:py-5 text-base sm:text-xl' : 'px-6 sm:px-8 py-3.5 sm:py-4 text-sm sm:text-base'}`}
    >
      {/* Shimmer effect on hover */}
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

      <span className="relative flex items-center gap-2 sm:gap-3">
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Se procesează...
          </>
        ) : (
          <>
            Vreau să mă transform — {price}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </>
        )}
      </span>
    </button>
  )
}
