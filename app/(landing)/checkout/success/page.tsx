import Image from 'next/image'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-black/[.06] px-5 h-16 flex items-center">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Mentorat cu Roxana" width={140} height={46}
              className="h-11 w-auto object-contain" priority/>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center">

          {/* Icon */}
          <div className="relative inline-flex mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center shadow-2xl shadow-[#ED03E9]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-12 h-12">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#ED03E9] rounded-full flex items-center justify-center shadow-lg animate-bounce">
              <span className="text-white text-sm">🎉</span>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif font-bold text-[#0A0A0A] text-3xl sm:text-4xl mb-4 leading-tight">
            Plata a fost<br/>
            <span className="bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] bg-clip-text text-transparent">confirmată!</span>
          </h1>

          <p className="text-[#3D3D3D] font-sans text-base sm:text-lg mb-3 leading-relaxed">
            Contul tău a fost creat automat. Vei primi un email cu datele de acces în câteva minute.
          </p>
          <p className="text-[#737373] font-sans text-sm mb-8">
            Verifică și <strong className="text-[#0A0A0A] font-semibold">folderul Spam</strong> dacă nu găsești emailul în inbox.
          </p>

          {/* Steps */}
          <div className="bg-white border border-black/[.06] rounded-3xl p-6 mb-8 text-left shadow-sm">
            <p className="text-[11px] font-bold text-[#ABABAB] font-sans uppercase tracking-[.12em] mb-4">Ce urmează</p>
            <div className="space-y-4">
              {[
                { n:'1', t:'Verifică emailul', d:'Vei primi datele de acces în câteva minute' },
                { n:'2', t:'Intră în platformă', d:'Folosește datele primite pe email' },
                { n:'3', t:'Programează sesiunea', d:'Alege un slot din calendarul Roxanei' },
              ].map(step => (
                <div key={step.n} className="flex items-start gap-3.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center flex-shrink-0 shadow-md shadow-[#ED03E9]/20">
                    <span className="text-white font-bold font-sans text-xs">{step.n}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#0A0A0A] font-sans text-sm">{step.t}</p>
                    <p className="text-[#737373] font-sans text-xs mt-0.5">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/login"
            className="group relative inline-flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white font-sans font-bold py-4 rounded-2xl shadow-xl shadow-[#ED03E9]/25 hover:shadow-[#ED03E9]/40 hover:shadow-2xl transition-all active:scale-[.99] overflow-hidden text-base">
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
              <path d="M10 11a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 0114 0" strokeLinecap="round"/>
            </svg>
            Intră în platformă
          </Link>

          <p className="mt-4 text-xs text-[#ABABAB] font-sans">
            Ai nevoie de ajutor?{' '}
            <a href="mailto:roxana@roxii-dinca.com" className="text-[#ED03E9] hover:underline">Contactează-ne</a>
          </p>
        </div>
      </div>
    </div>
  )
}
