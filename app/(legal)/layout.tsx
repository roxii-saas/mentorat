import Image from 'next/image'
import Link from 'next/link'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <header className="bg-white border-b border-black/[.06] px-5 h-16 flex items-center">
        <div className="max-w-3xl mx-auto w-full flex items-center justify-between">
          <Link href="/">
            <Image src="/logo.png" alt="Mentorat cu Roxana" width={130} height={44} className="h-10 w-auto object-contain" priority/>
          </Link>
          <Link href="/" className="text-sm text-[#737373] hover:text-[#ED03E9] font-sans transition-colors flex items-center gap-1.5">
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
              <path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Înapoi
          </Link>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-5 py-12">
        {children}
      </main>
      <footer className="border-t border-black/[.05] py-6 text-center">
        <div className="flex items-center justify-center gap-4 text-xs text-[#ABABAB] font-sans">
          <Link href="/politica-de-confidentialitate" className="hover:text-[#ED03E9] transition-colors">Politica de confidențialitate</Link>
          <span>·</span>
          <Link href="/termeni-si-conditii" className="hover:text-[#ED03E9] transition-colors">Termeni și condiții</Link>
          <span>·</span>
          <Link href="/politica-de-cookie" className="hover:text-[#ED03E9] transition-colors">Politica de cookie</Link>
        </div>
      </footer>
    </div>
  )
}
