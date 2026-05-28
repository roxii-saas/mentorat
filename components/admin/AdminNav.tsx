'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Calendar, Clock, Settings, LayoutDashboard, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
    { href: '/admin/clienti', label: 'Cliente', icon: Users },
    { href: '/admin/calendar', label: 'Calendar', icon: Calendar },
    { href: '/admin/disponibilitate', label: 'Disponibilitate', icon: Clock },
    { href: '/admin/setari', label: 'Setări', icon: Settings },
  ]

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-lg flex items-center justify-center shadow">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="leading-tight">
            <span className="font-serif font-bold text-base sm:text-lg block">Admin</span>
            <span className="text-gray-400 text-[10px] sm:text-xs font-sans hidden sm:block">Roxana Mentorat</span>
          </div>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors',
                (exact ? pathname === href : pathname.startsWith(href))
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-gray-400 hover:bg-white/10 hover:text-white transition-colors ml-2">
            <ExternalLink className="w-4 h-4" />
            Vezi site
          </Link>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile hamburger */}
        <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-gray-900 border-t border-white/10 px-4 py-3 space-y-1">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans transition-colors',
                (exact ? pathname === href : pathname.startsWith(href))
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-gray-300 hover:bg-white/10'
              )}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <div className="border-t border-white/10 pt-2 mt-2">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-gray-300 hover:bg-white/10">
              <ExternalLink className="w-5 h-5" />
              Vezi site-ul public
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-red-400 hover:bg-red-500/10">
              <LogOut className="w-5 h-5" />
              Ieșire
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
