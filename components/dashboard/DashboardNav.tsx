'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, User, Home, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Acasă', icon: Home },
    { href: '/dashboard/prenota', label: 'Programează', icon: Calendar },
    { href: '/dashboard/profil', label: 'Profil', icon: User },
  ]

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-lg flex items-center justify-center shadow">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-serif font-bold text-base sm:text-lg text-gray-900">
            Roxana<span className="text-[#c97d4e]">.</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors',
                pathname === href
                  ? 'bg-[#c97d4e]/10 text-[#c97d4e] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-gray-500 hover:bg-gray-100 transition-colors ml-2">
            <ExternalLink className="w-4 h-4" />
            <span className="hidden lg:inline">Vezi site</span>
          </Link>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-red-500 hover:bg-red-50 transition-colors">
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Ieșire</span>
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-6 h-6 text-gray-700" /> : <Menu className="w-6 h-6 text-gray-700" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans transition-colors',
                pathname === href
                  ? 'bg-[#c97d4e]/10 text-[#c97d4e] font-semibold'
                  : 'text-gray-700 hover:bg-gray-50'
              )}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <div className="border-t border-gray-100 pt-2 mt-2">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-gray-700 hover:bg-gray-50">
              <ExternalLink className="w-5 h-5" />
              Vezi site-ul
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-red-600 hover:bg-red-50">
              <LogOut className="w-5 h-5" />
              Ieșire
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
