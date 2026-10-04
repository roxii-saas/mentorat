'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Icon } from './Icon'

export function CopyPrompt({ text, variant = 'inline' }: { text: string; variant?: 'inline' | 'icon' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {}
  }

  if (variant === 'icon') {
    return (
      <button type="button" onClick={copy} aria-label="Copiază prompt în clipboard"
        className={`absolute top-2.5 right-2.5 w-8 h-8 rounded flex items-center justify-center ed-shadow transition-all active:scale-95 ${copied ? 'bg-ed-berry text-white' : 'bg-ed-white text-ed-ink hover:text-ed-berry'}`}>
        <Icon name={copied ? 'check' : 'content_copy'} className="text-[17px]" />
      </button>
    )
  }
  return (
    <button type="button" onClick={copy}
      className="flex items-center gap-1 text-[12px] font-semibold text-ed-berry hover:text-ed-berry-hover transition-colors">
      <Icon name={copied ? 'check' : 'content_copy'} className="text-[16px]" />
      <span>{copied ? 'Copiat!' : 'Copiază'}</span>
    </button>
  )
}

export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [pos, setPos] = useState(50)
  return (
    <div className="relative w-full aspect-[4/5] rounded-lg overflow-hidden ed-shadow-md select-none bg-ed-highest">
      <Image src={after} alt="După — imagine generată cu ghidul" fill sizes="(max-width:768px) 100vw, 520px" className="object-cover" />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <Image src={before} alt="Înainte — poză făcută cu telefonul" fill sizes="(max-width:768px) 100vw, 520px" className="object-cover" />
        <div className="absolute bottom-4 left-4 bg-ed-black/70 backdrop-blur-md px-2.5 py-1 rounded">
          <span className="ed-eyebrow !text-[10px] text-white">Înainte • Poză telefon</span>
        </div>
      </div>
      <div className="absolute bottom-4 right-4 bg-ed-white/85 backdrop-blur-md px-2.5 py-1 rounded ed-shadow">
        <span className="ed-eyebrow !text-[10px] text-ed-black">După • Cu ghidul</span>
      </div>
      <div className="absolute top-0 bottom-0 w-0.5 bg-ed-white pointer-events-none flex items-center justify-center" style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}>
        <div className="w-8 h-8 rounded-full bg-ed-white ed-shadow-md flex items-center justify-center text-ed-black shrink-0">
          <Icon name="swap_horiz" className="text-[18px]" />
        </div>
      </div>
      <input type="range" min={0} max={100} value={pos} onChange={e => setPos(Number(e.target.value))}
        aria-label="Comparație înainte și după"
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize" />
    </div>
  )
}

const NAV = [
  { id: 'prezentare', label: 'Prezentare', icon: 'auto_awesome' },
  { id: 'ce-contine', label: 'Ce conține', icon: 'menu_book' },
  { id: 'rezultate', label: 'Rezultate', icon: 'award_star' },
  { id: 'faq', label: 'FAQ', icon: 'help_outline' },
]

// Header desktop + tab bar mobile: evidenzia la sezione visibile
export function SectionNav({ priceLabel, checkoutHref }: { priceLabel: string; checkoutHref: string }) {
  const [active, setActive] = useState('prezentare')
  const visible = useRef(new Map<string, number>())

  useEffect(() => {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => visible.current.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0))
      let best = active, max = 0
      visible.current.forEach((r, id) => { if (r > max) { max = r; best = id } })
      if (max > 0) setActive(best)
    }, { threshold: [0, 0.15, 0.4, 0.7], rootMargin: '-64px 0px -30% 0px' })
    NAV.forEach(n => { const el = document.getElementById(n.id); if (el) io.observe(el) })
    return () => io.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 bg-ed-canvas/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-16 max-w-[1180px] mx-auto px-5 lg:px-8 flex items-center justify-between">
          <a href="#prezentare" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Roxii Dincă" width={96} height={32} className="h-8 w-auto object-contain" priority />
            <span className="flex flex-col">
              <span className="ed-eyebrow !tracking-[0.18em] text-ed-ink">Roxii Dincă</span>
              <span className="text-[10px] leading-tight tracking-wider uppercase text-ed-muted/75 font-semibold">
                {NAV.find(n => n.id === active)?.label}
              </span>
            </span>
          </a>
          <nav className="hidden md:flex items-center gap-7">
            {NAV.map(n => (
              <a key={n.id} href={`#${n.id}`}
                className={`text-[13px] font-semibold tracking-wide transition-colors ${active === n.id ? 'text-ed-berry' : 'text-ed-muted hover:text-ed-ink'}`}>
                {n.label}
              </a>
            ))}
          </nav>
          <a href={checkoutHref}
            className="hidden md:inline-flex items-center gap-1.5 bg-ed-berry hover:bg-ed-berry-hover text-white h-10 px-5 rounded text-[12px] font-bold uppercase tracking-[0.08em] transition-colors">
            Cumpără • {priceLabel}
          </a>
          <a href={checkoutHref} aria-label="Cumpără" className="md:hidden relative w-11 h-11 flex items-center justify-center text-ed-ink">
            <Icon name="shopping_bag" className="text-[22px]" />
          </a>
        </div>
      </header>

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-ed-canvas/95 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.03)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16 px-1">
          {NAV.map(n => (
            <a key={n.id} href={`#${n.id}`}
              className={`flex flex-col items-center justify-center min-w-[64px] h-12 transition-colors ${active === n.id ? 'text-ed-berry font-semibold' : 'text-ed-muted'}`}>
              <Icon name={n.icon} className="text-[20px]" fill={active === n.id} />
              <span className="text-[10px] mt-0.5 tracking-wide">{n.label}</span>
            </a>
          ))}
        </div>
      </nav>
    </>
  )
}
