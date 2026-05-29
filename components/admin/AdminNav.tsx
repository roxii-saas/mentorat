'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Users, Calendar, Clock, Settings, LayoutDashboard, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeProvider'

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

  const isActive = (href: string, exact?: boolean) => exact ? pathname === href : pathname.startsWith(href)

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-lg flex items-center justify-center shadow group-hover:rotate-12 transition-transform duration-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="leading-tight hidden sm:block">
            <span className="font-serif font-bold text-base text-gray-900 dark:text-white block">Admin</span>
            <span className="text-gray-500 dark:text-gray-400 text-[10px] font-sans">Roxana Mentorat</span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors',
                isActive(href, exact)
                  ? 'bg-[#c97d4e]/10 text-[#c97d4e] font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <ThemeToggle />
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <ExternalLink className="w-4 h-4" />
            Site
          </Link>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile right */}
        <div className="lg:hidden flex items-center gap-1">
          <ThemeToggle />
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5 px-4 py-3 space-y-1 transition-colors">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans transition-colors',
                isActive(href, exact)
                  ? 'bg-[#c97d4e]/10 text-[#c97d4e] font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'
              )}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <div className="border-t border-gray-100 dark:border-white/10 pt-2 mt-2">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10">
              <ExternalLink className="w-5 h-5" /> Vezi site-ul
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
              <LogOut className="w-5 h-5" /> Ieșire
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
