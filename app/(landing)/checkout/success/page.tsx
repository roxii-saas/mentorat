import Image from 'next/image'
import Link from 'next/link'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-black/[.06] px-5 h-16 flex items-center">
        <div className="max-w-5xl mx-auto w-full">
          <Link href="/">
            <Image src="/logo.png" alt="Mentorat cu Roxana" width={140} height={46}
              className="h-11 w-auto object-contain" priority/>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-lg w-full text-center">

          {/* Icon */}
          <div className="relative inline-flex mb-8">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center shadow-2xl shadow-[#ED03E9]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-12 h-12">
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg text-lg">
              🎉
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif font-bold text-[#0A0A0A] text-3xl sm:text-4xl mb-4 leading-tight">
            Rezervarea ta este<br/>
            <span className="bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] bg-clip-text text-transparent">
              confirmată!
            </span>
          </h1>

          <p className="text-[#3D3D3D] font-sans text-base sm:text-lg mb-2 leading-relaxed">
            Îți mulțumim că ți-ai rezervat locul în programul de mentorat.
          </p>
          <p className="text-[#737373] font-sans text-sm mb-10 leading-relaxed">
            Ai primit un email de confirmare. Roxana te va contacta în curând pentru a stabili împreună pașii următori.
          </p>

          {/* Info card */}
          <div className="bg-white border border-black/[.06] rounded-3xl p-6 shadow-sm text-left mb-8">
            <p className="text-[11px] font-bold text-[#ABABAB] font-sans uppercase tracking-[.12em] mb-4">Ce urmează</p>
            <div className="space-y-4">
              {[
                { emoji: '📧', title: 'Verifică email-ul', desc: 'Ai primit o confirmare de la Roxana. Verifică și folderul Spam.' },
                { emoji: '📞', title: 'Roxana te contactează', desc: 'Vei fi contactată pentru a programa prima sesiune 1:1.' },
                { emoji: '🚀', title: 'Începi transformarea', desc: 'Strategie personalizată pentru a ajunge la 3.000€/lună.' },
              ].map(step => (
                <div key={step.title} className="flex items-start gap-3.5">
                  <span className="text-xl flex-shrink-0 mt-0.5">{step.emoji}</span>
                  <div>
                    <p className="font-semibold text-[#0A0A0A] font-sans text-sm">{step.title}</p>
                    <p className="text-[#737373] font-sans text-xs mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link href="/"
            className="inline-flex items-center gap-2 text-sm text-[#737373] hover:text-[#ED03E9] font-sans font-medium transition-colors">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Înapoi la pagina principală
          </Link>

        </div>
      </div>
    </div>
  )
}
