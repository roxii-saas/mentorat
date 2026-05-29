'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils'

interface Settings {
  price_amount: number
  currency: string
  product_name: string
  sales_active: boolean
}

export default function LandingClient({ initialSettings }: { initialSettings: Settings }) {
  const [settings] = useState(initialSettings)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [buyLoading, setBuyLoading] = useState(false)
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })

    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))

    const onMove = (e: MouseEvent) => {
      if (window.innerWidth < 1024 || !heroRef.current) return
      const x = ((e.clientX / window.innerWidth) - .5) * 16
      const y = ((e.clientY / window.innerHeight) - .5) * 10
      heroRef.current.style.transform = `translate3d(${x}px,${y}px,0)`
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMove)
      io.disconnect()
    }
  }, [])

  const handleBuy = () => {
    if (!settings.sales_active) return
    setBuyLoading(true)
    window.location.href = '/checkout'
  }

  const price = formatPrice(settings.price_amount, settings.currency.toUpperCase())

  return (
    <div className="bg-[#FAFAFA] text-[#0A0A0A] overflow-x-hidden">

      {/* ─────────── HEADER ─────────── */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/90 backdrop-blur-xl border-b border-black/5 shadow-sm' : ''}`}>
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">

          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-[#ED03E9] flex items-center justify-center shadow-lg shadow-[#ED03E9]/30 group-hover:scale-110 transition-transform duration-300">
              <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                <path d="M10 2L3 6l7 4 7-4-7-4zM3 13l7 4 7-4M3 9.5l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="font-serif font-bold text-lg text-[#0A0A0A] tracking-tight">Roxana<span className="text-[#ED03E9]">.</span></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-8">
            {[['#despre','Despre'],['#proces','Proces'],['#rezultate','Rezultate'],['#pret','Preț']].map(([h,l]) => (
              <a key={h} href={h} className="text-[13px] font-sans font-medium text-[#3D3D3D] hover:text-[#ED03E9] transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#ED03E9] after:transition-all hover:after:w-full">{l}</a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <Link href="/login" className="text-[13px] font-sans font-medium text-[#3D3D3D] hover:text-[#0A0A0A] flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-black/5 transition-all">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
                <path d="M10 11a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" strokeLinecap="round"/>
              </svg>
              Contul meu
            </Link>
            <BuyBtn onClick={handleBuy} loading={buyLoading} price={price} active={settings.sales_active} />
          </div>

          <button className="sm:hidden p-2" onClick={() => setMenuOpen(!menuOpen)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2" className="w-5 h-5">
              {menuOpen ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="sm:hidden bg-white border-t border-black/5 px-5 py-4 space-y-1">
            {[['#despre','Despre'],['#proces','Proces'],['#rezultate','Rezultate'],['#pret','Preț']].map(([h,l]) => (
              <a key={h} href={h} onClick={() => setMenuOpen(false)} className="block py-2.5 text-sm font-sans font-medium text-[#3D3D3D] hover:text-[#ED03E9]">{l}</a>
            ))}
            <div className="pt-3 border-t border-black/5 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMenuOpen(false)} className="text-center py-2.5 text-sm font-sans font-medium text-[#3D3D3D] border border-black/10 rounded-xl">Contul meu</Link>
              <BuyBtn onClick={() => { setMenuOpen(false); handleBuy() }} loading={buyLoading} price={price} active={settings.sales_active} />
            </div>
          </div>
        )}
      </header>

      {/* ─────────── HERO ─────────── */}
      <section className="relative min-h-screen flex flex-col lg:flex-row items-center pt-16 pb-12 px-5 max-w-6xl mx-auto gap-12 lg:gap-16">

        {/* Blobs decorativi */}
        <div className="absolute top-24 -left-32 w-[500px] h-[500px] rounded-full bg-[#ED03E9]/8 blur-[120px] animate-blob pointer-events-none" />
        <div className="absolute bottom-0 -right-32 w-[400px] h-[400px] rounded-full bg-[#6B00E8]/8 blur-[100px] animate-blob pointer-events-none" style={{ animationDelay:'5s' }} />

        {/* Testo */}
        <div className="flex-1 text-center lg:text-left z-10">

          <div className="inline-flex items-center gap-2 bg-[#ED03E9]/8 border border-[#ED03E9]/20 text-[#B800BA] text-[11px] font-sans font-bold px-3.5 py-1.5 rounded-full mb-8 tracking-[.12em] uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED03E9] opacity-75"/>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ED03E9]"/>
            </span>
            Mentorat exclusiv · Locuri limitate
          </div>

          <h1 className="text-[clamp(2.6rem,7vw,5.5rem)] font-serif font-bold leading-[1.05] tracking-tight mb-6 text-[#0A0A0A]">
            De la{' '}
            <span className="relative inline-block">
              <span className="text-shimmer">0</span>
            </span>
            {' '}la{' '}
            <span className="relative inline-block">
              <span className="text-shimmer">3.000€</span>
              <svg className="absolute -bottom-2 left-0 w-full overflow-visible" viewBox="0 0 200 10" preserveAspectRatio="none" fill="none">
                <path d="M2 7 Q100 2 198 7" stroke="#ED03E9" strokeWidth="2" strokeLinecap="round" opacity=".5"/>
              </svg>
            </span>
            <br/><span className="text-[#3D3D3D]">pe lună</span>
          </h1>

          <p className="text-lg sm:text-xl text-[#3D3D3D] font-sans leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
            Scapă de frica că <strong className="text-[#0A0A0A]">tu nu poți</strong> — și construiește o afacere online care îți aduce libertate financiară reală.
          </p>

          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-10">
            {['Claritate în online','Strategii personalizate','Cum să atragi clientele','Cum să te promovezi'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-[12px] font-sans text-[#3D3D3D] bg-white border border-black/8 px-3 py-1.5 rounded-full shadow-sm">
                <svg viewBox="0 0 16 16" fill="none" className="w-3 h-3 text-[#ED03E9]">
                  <path d="M13 4L6.5 10.5 3 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t}
              </span>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
            <BuyBtn onClick={handleBuy} loading={buyLoading} price={price} active={settings.sales_active} large />
            <a href="#proces" className="inline-flex items-center justify-center gap-2 text-sm font-sans font-semibold text-[#3D3D3D] px-7 py-4 rounded-2xl border border-black/10 hover:border-black/20 hover:bg-black/3 transition-all">
              Cum funcționează
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M10 4v12M4 10l6 6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-4 mt-9 justify-center lg:justify-start">
            <div className="flex -space-x-2.5">
              {['#ED03E9','#6B00E8','#0A0A0A','#B800BA'].map((c,i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold font-sans shadow-md" style={{ background: c }}>
                  {['M','I','A','C'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[...Array(5)].map((_,i) => (
                  <svg key={i} viewBox="0 0 16 16" fill="#ED03E9" className="w-3.5 h-3.5">
                    <path d="M8 1l1.854 3.756L14 5.528l-3 2.923.708 4.128L8 10.5l-3.708 2.079L5 8.45 2 5.528l4.146-.772L8 1z"/>
                  </svg>
                ))}
              </div>
              <p className="text-xs text-[#737373] font-sans"><strong className="text-[#0A0A0A]">200+</strong> femei transformate</p>
            </div>
          </div>
        </div>

        {/* Foto 3D */}
        <div ref={heroRef} className="flex-shrink-0 relative transition-transform duration-200 ease-out will-change-transform w-full max-w-[340px] lg:max-w-[400px]">
          <div className="absolute -inset-8 rounded-[40px] bg-gradient-to-br from-[#ED03E9]/20 via-[#6B00E8]/10 to-transparent blur-3xl" />

          <div className="relative rounded-[28px] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.18)] border border-white/30">
            <div className="aspect-[3/4] relative">
              <Image src="/roxana.jpg" alt="Roxana Dinca" fill className="object-cover object-top" priority sizes="(max-width:768px)340px,400px"/>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"/>
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3.5 shadow-xl">
                <p className="font-serif font-bold text-[#0A0A0A] text-sm">Roxana Dinca</p>
                <p className="text-[#737373] text-xs font-sans mt-0.5">Mentor & Coach Business Online</p>
                <div className="flex items-center gap-0.5 mt-1.5">
                  {[...Array(5)].map((_,i) => <svg key={i} viewBox="0 0 16 16" fill="#ED03E9" className="w-3 h-3"><path d="M8 1l1.854 3.756L14 5.528l-3 2.923.708 4.128L8 10.5l-3.708 2.079L5 8.45 2 5.528l4.146-.772L8 1z"/></svg>)}
                  <span className="text-[10px] text-[#737373] font-sans ml-1">5.0 · 200+ recenzii</span>
                </div>
              </div>
            </div>
          </div>

          {/* Floating stat cards */}
          <div className="absolute -left-6 top-[22%] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-3 border border-black/5" style={{ animation:'float-card 4s ease-in-out infinite','--r':'−3deg' } as React.CSSProperties}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#ED03E9] to-[#B800BA] flex items-center justify-center shadow-md">
                <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <path d="M3 10l3.5 3.5L17 6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div><p className="text-xs font-bold text-[#0A0A0A] font-sans">+3.000€</p><p className="text-[10px] text-[#737373] font-sans">venit lunar</p></div>
            </div>
          </div>

          <div className="absolute -right-5 top-[50%] bg-white rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.12)] p-3 border border-black/5" style={{ animation:'float-card 5s ease-in-out infinite','--r':'2deg' } as React.CSSProperties}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6B00E8] to-[#4C00A8] flex items-center justify-center shadow-md">
                <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                  <path d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10M10 3V1M17 16V9a1 1 0 00-1-1h-2" strokeLinecap="round"/>
                </svg>
              </div>
              <div><p className="text-xs font-bold text-[#0A0A0A] font-sans">200+</p><p className="text-[10px] text-[#737373] font-sans">cliente</p></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── TRUST BAR ─────────── */}
      <div className="bg-[#0A0A0A] py-5 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee gap-16" style={{ width:'max-content' }}>
          {[...Array(2)].flatMap(() => [
            { icon:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', text:'200+ Cliente Mulțumite' },
            { icon:'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z', text:'Rating 5.0 / 5.0' },
            { icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', text:'Rezultate în 60 de zile' },
            { icon:'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', text:'Plată Securizată Stripe' },
            { icon:'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', text:'3.000€+ Venit Mediu' },
          ]).map((item, i) => (
            <span key={i} className="inline-flex items-center gap-2.5 text-white/50 text-[13px] font-sans font-medium tracking-wide">
              <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0">
                <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* ─────────── PROBLEMA ─────────── */}
      <section className="py-24 px-5 max-w-5xl mx-auto reveal">
        <div className="text-center mb-14">
          <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">Recunoști situația?</span>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-serif font-bold mt-3 mb-4 text-[#0A0A0A] leading-tight">
            Dacă bifezi 2 din 6 —<br/><span className="text-[#ED03E9]">ai nevoie de mentorat acum.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon:'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', text:'Nu știu cum să mă promovez pe social media fără să par disperată' },
            { icon:'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', text:'Am frică că nu sunt suficient de bună pentru a cere bani mai mulți' },
            { icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', text:'Postez constant, încerc tot — dar clientele nu vin' },
            { icon:'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7', text:'Nu am o strategie clară, mă pierd în haos zi de zi' },
            { icon:'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1', text:'Nu știu cum să stabilesc prețuri corecte fără să pierd clienți' },
            { icon:'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z', text:'Văd altele reușind și mă întreb de ce nu reușesc și eu' },
          ].map(item => (
            <div key={item.text} className="group flex items-start gap-3.5 bg-white border border-black/6 rounded-2xl p-4.5 p-[18px] hover:border-[#ED03E9]/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
              <div className="w-10 h-10 rounded-xl bg-[#ED03E9]/8 group-hover:bg-[#ED03E9]/15 flex items-center justify-center flex-shrink-0 transition-colors">
                <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-5 h-5">
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-[#3D3D3D] font-sans text-sm leading-relaxed pt-1">{item.text}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[#737373] font-sans italic mt-10 text-base">
          "Non ești singură. Nu e vina ta. <strong className="text-[#0A0A0A] not-italic">Lipsește doar strategia."</strong>
        </p>
      </section>

      {/* ─────────── SOLUȚIE ─────────── */}
      <section id="despre" className="bg-white py-24 px-5 reveal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">Soluția</span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-serif font-bold mt-3 mb-4 text-[#0A0A0A] leading-tight">
              3 piloni pentru a ajunge la <span className="text-[#ED03E9]">3.000€/lună</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              { num:'01', icon:'M13 10V3L4 14h7v7l9-11h-7z', title:'Cum să te promovezi', desc:'Strategie de conținut autentică. Prezență magnetică online. Vizibilitate care atrage clientele ideale — fără să te epuizezi.', accent:'#ED03E9' },
              { num:'02', icon:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', title:'Cum să atragi clientele', desc:'Sistem complet de atracție și conversie. De la follower necunoscut la clientă plătitoare care te recomandă mai departe.', accent:'#6B00E8' },
              { num:'03', icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6', title:'De la 0 la 3.000€', desc:'Plan pas cu pas. Prețuri premium. Servicii scalabile. Venit consistent de 3.000€+ în maxim 6 luni garantat prin strategie.', accent:'#0A0A0A' },
            ].map(item => (
              <div key={item.title} className="group relative bg-[#FAFAFA] border border-black/6 rounded-3xl p-7 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-400">
                <div className="absolute top-4 right-4 text-[80px] font-serif font-bold leading-none select-none" style={{ color:`${item.accent}08` }}>{item.num}</div>
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 shadow-lg" style={{ background:`linear-gradient(135deg,${item.accent}dd,${item.accent}88)` }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-5 h-5">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-serif font-bold text-xl text-[#0A0A0A] mb-2.5">{item.title}</h3>
                <p className="text-[#737373] text-sm leading-relaxed font-sans">{item.desc}</p>
                <div className="absolute bottom-0 left-0 w-0 h-[2px] group-hover:w-full transition-all duration-500" style={{ background:`linear-gradient(90deg,${item.accent},transparent)` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── TIMELINE PROFESIONALĂ ─────────── */}
      <section id="proces" className="py-24 px-5 max-w-5xl mx-auto reveal">
        <div className="text-center mb-16">
          <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">Procesul</span>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-serif font-bold mt-3 text-[#0A0A0A]">
            De la clic la <span className="text-[#ED03E9]">3.000€/lună</span>
          </h2>
          <p className="text-[#737373] font-sans mt-3 max-w-lg mx-auto">Un drum clar, pas cu pas. Fără surprize, fără jargon. Doar rezultate.</p>
        </div>

        <div className="relative">
          {/* Linie centrală */}
          <div className="absolute left-[28px] lg:left-1/2 top-0 bottom-0 lg:-translate-x-px w-px bg-gradient-to-b from-[#ED03E9] via-[#6B00E8] to-transparent" />

          <div className="space-y-10 lg:space-y-0">
            {[
              { n:'1', t:'Cumperi programul', sub:'Ziua 1 · 60 secunde', d:'Plată securizată. Accesul la platformă apare pe email instant — în mai puțin de 60 de secunde.', accent:'#ED03E9', icon:'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
              { n:'2', t:'Programezi prima sesiune', sub:'Ziua 1 · 5 minute', d:'Intri în platformă și alegi un slot din calendarul Roxanei. Confirmare automată instantanee.', accent:'#6B00E8', icon:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { n:'3', t:'Primești strategia ta', sub:'Sesiunea · 60 minute', d:'Roxana analizează situația ta concretă și îți creează un plan specific, personalizat, aplicabil imediat.', accent:'#ED03E9', icon:'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { n:'4', t:'Implementezi și crești', sub:'3–6 luni', d:'Urmezi pașii cu suport continuu prin platformă. Ajungi la 3.000€+/lună și depășești propriile așteptări.', accent:'#6B00E8', icon:'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            ].map((step, i) => {
              const isRight = i % 2 === 1
              return (
                <div key={i} className={`relative flex items-center gap-0 lg:gap-0 ${isRight ? 'lg:flex-row-reverse' : ''} mb-10 lg:mb-0 lg:pb-14`}>
                  {/* Nod centrale */}
                  <div className="absolute left-[28px] lg:left-1/2 lg:-translate-x-1/2 z-10">
                    <div className="w-14 h-14 rounded-full border-4 border-white shadow-xl flex items-center justify-center animate-glow" style={{ background:`linear-gradient(135deg,${step.accent},${step.accent}88)` }}>
                      <span className="text-white font-serif font-bold text-lg">{step.n}</span>
                    </div>
                  </div>

                  {/* Spazio mobile */}
                  <div className="w-[70px] flex-shrink-0 lg:hidden" />

                  {/* Card */}
                  <div className={`flex-1 ${isRight ? 'lg:pl-0 lg:pr-12' : 'lg:pl-12'} pl-4 lg:w-[calc(50%-40px)]`}>
                    <div className="bg-white border border-black/6 rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <div className={`flex items-center gap-2.5 mb-2 ${isRight ? 'lg:flex-row-reverse' : ''}`}>
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${step.accent}15` }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke={step.accent} strokeWidth="1.8" className="w-4 h-4">
                            <path d={step.icon} strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                        <span className="text-[11px] font-bold font-sans tracking-[.12em] uppercase" style={{ color: step.accent }}>{step.sub}</span>
                      </div>
                      <h3 className="font-serif font-bold text-lg text-[#0A0A0A] mb-1.5">{step.t}</h3>
                      <p className="text-[#737373] text-sm font-sans leading-relaxed">{step.d}</p>
                      <div className="w-0 group-hover:w-full h-[1.5px] mt-4 transition-all duration-500 rounded-full" style={{ background:`linear-gradient(90deg,${step.accent},transparent)` }} />
                    </div>
                  </div>

                  {/* Lato vuoto desktop */}
                  <div className="hidden lg:block flex-1 lg:w-[calc(50%-40px)]" />
                </div>
              )
            })}
          </div>

          {/* Flag finale */}
          <div className="relative flex justify-center mt-4 lg:mt-0">
            <div className="absolute left-[28px] lg:left-1/2 lg:-translate-x-1/2 -top-3 z-10 w-14 h-14 rounded-full bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center shadow-xl border-4 border-white">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-6 h-6">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="ml-20 lg:ml-0 lg:mt-16 inline-flex items-center gap-2.5 bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white font-sans font-bold px-7 py-3 rounded-full shadow-2xl shadow-[#ED03E9]/25">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
                <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Ai ajuns la 3.000€/lună
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── ÎNAINTE / DUPĂ ─────────── */}
      <section className="bg-white py-24 px-5 reveal">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">Transformarea</span>
            <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-serif font-bold mt-3 text-[#0A0A0A]">
              Înainte vs. <span className="text-[#ED03E9]">După</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="bg-[#FAFAFA] border border-black/6 rounded-3xl p-7 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-gray-200 to-gray-100 rounded-t-3xl" />
              <div className="inline-flex items-center gap-1.5 bg-black/5 text-[#737373] text-[11px] font-sans font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M12 4L4 12M4 4l8 8" strokeLinecap="round"/></svg>
                Înainte
              </div>
              <ul className="space-y-3">
                {['Postezi mult, primești 0 clientele','Te subapreciezi, ceri prețuri mici','Lucrezi 12h/zi pentru 500€/lună','Te compari constant cu altele','Nu ai timp pentru tine sau familie','Te simți blocată și demotivată'].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-[#737373] text-sm font-sans">
                    <svg viewBox="0 0 16 16" fill="none" stroke="#E5E5E5" strokeWidth="2.5" className="w-4 h-4 mt-0.5 flex-shrink-0">
                      <path d="M12 4L4 12M4 4l8 8" strokeLinecap="round"/>
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] rounded-3xl p-7 relative overflow-hidden md:scale-[1.03] shadow-2xl shadow-[#ED03E9]/20">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-[60px]" />
              <div className="inline-flex items-center gap-1.5 bg-white/20 text-white text-[11px] font-sans font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider relative">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                După Mentorat
              </div>
              <ul className="space-y-3 relative">
                {['Strategie clară care aduce clientele constant','Prețuri premium pe care le poți susține','Lucrezi 5h/zi și câștigi 3.000€+/lună','Ai propria autoritate și direcție','Timp real pentru tine și familia ta','Te simți puternică, motivată și liberă'].map(t => (
                  <li key={t} className="flex items-start gap-2.5 text-white text-sm font-sans">
                    <svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" className="w-4 h-4 mt-0.5 flex-shrink-0">
                      <path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── TESTIMONIALE ─────────── */}
      <section id="rezultate" className="py-24 px-5 max-w-5xl mx-auto reveal">
        <div className="text-center mb-12">
          <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">Povești reale</span>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-serif font-bold mt-3 text-[#0A0A0A]">Ce spun clientele mele</h2>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n:'MT', name:'Maria T.', loc:'Cluj-Napoca', r:'0 → 3.200€/lună', t:'În 2 luni am ajuns la primii 1.500€. În 4 luni am depășit 3.000€/lună. Nu îmi venea să cred că se poate schimba atât de mult viața mea în atât de puțin timp.' },
            { n:'IP', name:'Ioana P.', loc:'București', r:'+2.500€/lună', t:'Roxana mi-a dat exact ce aveam nevoie: claritate și un plan real. Nu teorie goală — pași concreți pe care i-am implementat imediat cu rezultate vizibile.' },
            { n:'AM', name:'Alina M.', loc:'Timișoara', r:'0 → 4.000€/lună', t:'Scăpasem de orice speranță. Acum am 20 de clientele lunare și o afacere stabilă care crește constant. Cea mai bună investiție pe care am făcut-o.' },
          ].map(t => (
            <div key={t.name} className="bg-white border border-black/6 rounded-3xl p-6 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 flex flex-col">
              <div className="flex items-center gap-0.5 mb-4">
                {[...Array(5)].map((_,i) => <svg key={i} viewBox="0 0 16 16" fill="#ED03E9" className="w-3.5 h-3.5"><path d="M8 1l1.854 3.756L14 5.528l-3 2.923.708 4.128L8 10.5l-3.708 2.079L5 8.45 2 5.528l4.146-.772L8 1z"/></svg>)}
                <span className="ml-auto text-[11px] font-bold font-sans bg-[#ED03E9]/8 text-[#B800BA] px-2.5 py-1 rounded-full">{t.r}</span>
              </div>
              <svg viewBox="0 0 24 24" fill="#ED03E9" className="w-6 h-6 opacity-25 mb-2 flex-shrink-0">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
              </svg>
              <p className="text-[#3D3D3D] text-sm font-sans leading-relaxed flex-1 mb-5">{t.t}</p>
              <div className="flex items-center gap-3 pt-4 border-t border-black/5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center text-white font-bold text-xs shadow-md">{t.n}</div>
                <div>
                  <p className="text-sm font-semibold text-[#0A0A0A] font-sans">{t.name}</p>
                  <p className="text-xs text-[#737373] font-sans">{t.loc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── ROXANA ─────────── */}
      <section className="bg-white py-24 px-5 reveal">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="relative max-w-sm mx-auto md:max-w-none">
            <div className="absolute -inset-6 bg-gradient-to-br from-[#ED03E9]/15 to-[#6B00E8]/10 rounded-[40px] blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-square">
              <Image src="/roxana.jpg" alt="Roxana Dinca" fill className="object-cover object-top" sizes="400px"/>
            </div>
          </div>
          <div>
            <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">Mentorul tău</span>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-serif font-bold mt-3 mb-5 text-[#0A0A0A]">Bună, eu sunt Roxana</h2>
            <p className="text-[#3D3D3D] leading-relaxed mb-4 font-sans">Am trecut și eu prin momentul în care nu știam cum să atrag clientele, cum să mă promovez sau dacă e posibil să câștig bani din online. <strong className="text-[#0A0A0A]">Știu exact cum te simți.</strong></p>
            <p className="text-[#3D3D3D] leading-relaxed mb-7 font-sans">Astăzi am ajutat <strong className="text-[#0A0A0A]">200+ femei</strong> să construiască afaceri profitabile de la zero. Nu îți vând vise — îți ofer <strong className="text-[#0A0A0A]">strategii concrete</strong> care funcționează în România și nu numai.</p>
            <div className="flex flex-wrap gap-2.5">
              {['200+ cliente','3+ ani experiență','Rezultate măsurabile','98% satisfacție'].map(b => (
                <span key={b} className="flex items-center gap-1.5 bg-[#ED03E9]/8 border border-[#ED03E9]/20 text-[#B800BA] font-sans font-semibold text-xs px-3 py-2 rounded-full">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── PREȚ ─────────── */}
      <section id="pret" className="py-24 px-5 max-w-5xl mx-auto reveal">
        <div className="text-center mb-12">
          <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">Investiția</span>
          <h2 className="text-[clamp(2rem,5vw,3.5rem)] font-serif font-bold mt-3 text-[#0A0A0A]">Tot ce primești în program</h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-7 items-stretch">
          <div className="lg:col-span-3 bg-white border border-black/6 rounded-3xl p-6 sm:p-8">
            <h3 className="font-serif font-bold text-lg text-[#0A0A0A] mb-5">Ce include pachetul:</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                'Sesiune 1:1 cu Roxana (60 min)','Analiză completă profil online',
                'Strategie personalizată de promovare','Plan acțiune lunar detaliat',
                'Scripturi pentru atragerea clientelelor','Sistem de prețuri optimizat',
                'Suport prin platformă post-sesiune','Materiale exclusive + bonusuri',
              ].map(item => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center flex-shrink-0">
                    <svg viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" className="w-3 h-3"><path d="M2 6l3 3 5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <span className="text-[#3D3D3D] text-sm font-sans">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 relative">
            <div className="absolute -inset-2 bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] rounded-3xl blur-xl opacity-25" />
            <div className="relative h-full bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] rounded-3xl p-7 text-white text-center shadow-2xl flex flex-col">
              <div className="inline-flex self-center items-center gap-1.5 bg-white/20 text-white text-[11px] font-bold px-3 py-1.5 rounded-full mb-5 uppercase tracking-wider">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M8 1l1.854 3.756L14 5.528l-3 2.923.708 4.128L8 10.5l-3.708 2.079L5 8.45 2 5.528l4.146-.772L8 1z"/></svg>
                Ofertă limitată
              </div>
              <p className="text-white/75 font-sans text-sm mb-1">Plătești doar</p>
              <p className="text-6xl sm:text-7xl font-serif font-bold mb-1">{price}</p>
              <p className="text-white/60 text-sm font-sans mb-2">o singură plată</p>
              <p className="text-white/90 text-xs font-bold bg-white/15 rounded-full py-1.5 px-4 inline-block self-center mb-7">Valoare reală: 1.376€</p>
              <div className="flex-1 flex flex-col justify-end gap-3">
                <BuyBtn onClick={handleBuy} loading={buyLoading} price={price} active={settings.sales_active} white />
                <div className="flex flex-col gap-1.5">
                  {['Plată securizată Stripe','Acces imediat','Garanție satisfacție'].map(t => (
                    <div key={t} className="flex items-center justify-center gap-1.5 text-white/75 text-xs font-sans">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {t}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── FAQ ─────────── */}
      <section className="bg-white py-24 px-5 reveal">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[#ED03E9] font-sans font-bold text-[11px] tracking-[.18em] uppercase">FAQ</span>
            <h2 className="text-[clamp(2rem,5vw,3rem)] font-serif font-bold mt-3 text-[#0A0A0A]">Întrebări frecvente</h2>
          </div>
          <div className="space-y-2">
            {[
              { q:'Pentru cine este acest mentorat?', a:'Pentru femei care vor să-și construiască o afacere online profitabilă. Indiferent că ești la început sau ai deja încercat fără succes, te ajut să creezi un sistem care funcționează.' },
              { q:'Cât timp durează până văd rezultate?', a:'Majoritatea clientelor văd primele rezultate concrete în 30-60 de zile. La 3-6 luni ajung la 3.000€+/lună, cu condiția implementării strategiei.' },
              { q:'Ce se întâmplă imediat după plată?', a:'Primești instantaneu pe email datele de acces la platformă. De acolo programezi prima ta sesiune cu Roxana din calendarul disponibil.' },
              { q:'Cum se desfășoară sesiunea?', a:'Online, prin Google Meet sau Zoom. Roxana analizează situația ta specifică și îți construiește o strategie personalizată, pas cu pas.' },
              { q:'Există garanție de rambursare?', a:'Da. Dacă după prima sesiune nu ești complet mulțumită, returnăm integral suma plătită — fără întrebări.' },
            ].map((f, i) => (
              <details key={i} className="group bg-[#FAFAFA] border border-black/6 rounded-2xl overflow-hidden">
                <summary className="cursor-pointer flex items-center justify-between gap-4 px-5 py-4 list-none font-serif font-semibold text-[#0A0A0A] text-base hover:text-[#ED03E9] transition-colors">
                  {f.q}
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 flex-shrink-0 transition-transform duration-300 group-open:rotate-180">
                    <path d="M5 7.5l5 5 5-5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-[#737373] font-sans text-sm leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── CTA FINALE ─────────── */}
      <section className="relative py-32 px-5 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[#0A0A0A]" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-[#ED03E9]/15 blur-[100px] animate-blob pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#6B00E8]/15 blur-[80px] animate-blob pointer-events-none" style={{ animationDelay:'6s' }} />

        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#ED03E9]/15 border border-[#ED03E9]/25 text-[#FF80FD] text-[11px] font-bold px-4 py-2 rounded-full mb-8 uppercase tracking-[.15em]">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED03E9] opacity-75"/>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#ED03E9]"/>
            </span>
            Locuri limitate · Aplică acum
          </div>
          <h2 className="text-[clamp(2.5rem,7vw,5rem)] font-serif font-bold text-white mb-6 leading-tight">
            Ești gata să<br/><span className="text-shimmer">schimbi totul</span>?
          </h2>
          <p className="text-white/60 text-lg sm:text-xl mb-12 font-sans">Următoarea ta versiune începe astăzi.</p>
          <BuyBtn onClick={handleBuy} loading={buyLoading} price={price} active={settings.sales_active} large white />
          <div className="flex flex-wrap items-center justify-center gap-5 mt-9">
            {['Plată securizată','Acces imediat','Garanție satisfacție'].map(t => (
              <div key={t} className="flex items-center gap-1.5 text-white/40 text-sm font-sans">
                <svg viewBox="0 0 16 16" fill="none" stroke="#ED03E9" strokeWidth="2" className="w-3.5 h-3.5"><path d="M3 8l3.5 3.5L13 5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer className="bg-[#070708] border-t border-white/5 py-14 px-5">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#ED03E9] flex items-center justify-center shadow-lg">
                  <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                    <path d="M10 2L3 6l7 4 7-4-7-4zM3 13l7 4 7-4M3 9.5l7 4 7-4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-serif font-bold text-white">Roxana Dinca</span>
              </div>
              <p className="text-[#636363] text-sm font-sans leading-relaxed">Mentor & Coach de Business Online. Ajut femeile să construiască afaceri profitabile de la zero.</p>
            </div>
            <div>
              <p className="font-sans font-semibold text-white text-sm mb-4">Navigare</p>
              <ul className="space-y-2.5">
                {[['#despre','Despre Roxana'],['#proces','Cum funcționează'],['#rezultate','Rezultate'],['#pret','Preț']].map(([h,l]) => (
                  <li key={h}><a href={h} className="text-sm text-[#636363] hover:text-[#ED03E9] font-sans transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-sans font-semibold text-white text-sm mb-4">Cont</p>
              <ul className="space-y-2.5">
                <li>
                  <a href="mailto:roxana@roxii-dinca.com" className="flex items-center gap-2 text-sm text-[#636363] hover:text-[#ED03E9] font-sans transition-colors">
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L17 8M5 19h10a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Email contact
                  </a>
                </li>
                <li><Link href="/login" className="flex items-center gap-2 text-sm text-[#636363] hover:text-[#ED03E9] font-sans transition-colors"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M3 10a7 7 0 1014 0A7 7 0 003 10zm4 0a3 3 0 116 0 3 3 0 01-6 0z" strokeLinecap="round"/></svg>Intră în cont</Link></li>
                <li><Link href="/dashboard" className="flex items-center gap-2 text-sm text-[#636363] hover:text-[#ED03E9] font-sans transition-colors"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/><rect x="2" y="11" width="7" height="7" rx="1"/></svg>Dashboard clientă</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-7 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-[#3D3D3D] font-sans">© {new Date().getFullYear()} Roxana Dinca · Toate drepturile rezervate</p>
            <div className="flex items-center gap-1.5 text-xs text-[#3D3D3D] font-sans">
              <svg viewBox="0 0 16 16" fill="none" stroke="#ED03E9" strokeWidth="1.8" className="w-3.5 h-3.5"><path d="M8 1.5l1.56 3.16L13 5.25l-2.5 2.44.59 3.44L8 9.5l-3.09 1.63.59-3.44L3 5.25l3.44-.59L8 1.5z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Plată securizată SSL
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile sticky CTA */}
      <div className="sm:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-black/8 px-4 py-3 shadow-2xl">
        <BuyBtn onClick={handleBuy} loading={buyLoading} price={price} active={settings.sales_active} full />
      </div>
      <div className="sm:hidden h-20" aria-hidden />

    </div>
  )
}

function BuyBtn({ onClick, loading, price, active, large, white, full }: {
  onClick: () => void; loading: boolean; price: string; active: boolean
  large?: boolean; white?: boolean; full?: boolean
}) {
  if (!active) return (
    <button disabled className={`inline-flex items-center justify-center gap-2 font-sans font-semibold rounded-2xl bg-black/10 text-[#737373] cursor-not-allowed ${large?'px-10 py-5 text-lg':full?'w-full py-3.5 text-base':'px-7 py-3.5 text-sm'}`}>
      Lista de așteptare
    </button>
  )
  return (
    <button onClick={onClick} disabled={loading}
      className={`group relative inline-flex items-center justify-center gap-2.5 font-sans font-bold rounded-2xl transition-all active:scale-[.98] disabled:opacity-70 overflow-hidden
        ${white ? 'bg-white text-[#ED03E9] hover:bg-gray-50 shadow-xl' : 'bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white shadow-xl shadow-[#ED03E9]/30 hover:shadow-[#ED03E9]/50 hover:shadow-2xl'}
        ${large ? 'px-10 py-5 text-lg' : full ? 'w-full py-3.5 text-base' : 'px-7 py-3.5 text-sm'}`}>
      <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />
      <span className="relative flex items-center gap-2.5">
        {loading ? (
          <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Se procesează...</>
        ) : (
          <>Vreau să mă transform — {price}<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 group-hover:translate-x-0.5 transition-transform"><path d="M4 10h12M10 4l6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/></svg></>
        )}
      </span>
    </button>
  )
}
