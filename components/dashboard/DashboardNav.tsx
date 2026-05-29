'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, User, Home, LogOut, ExternalLink, Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeProvider'

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
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 sticky top-0 z-40 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-lg flex items-center justify-center shadow group-hover:rotate-12 transition-transform duration-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-serif font-bold text-base text-gray-900 dark:text-white hidden sm:block">
            Mentorat<span className="text-[#c97d4e]">.</span>
          </span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors',
                pathname === href
                  ? 'bg-[#c97d4e]/10 text-[#c97d4e] font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'
              )}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-1">
          <ThemeToggle />
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <ExternalLink className="w-4 h-4" />
            <span className="hidden lg:inline">Site</span>
          </Link>
          <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <button className="p-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="w-6 h-6 text-gray-700 dark:text-gray-300" /> : <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5 px-4 py-3 space-y-1 transition-colors">
          {links.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans',
                pathname === href
                  ? 'bg-[#c97d4e]/10 text-[#c97d4e] font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/10'
              )}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
          <div className="border-t border-gray-100 dark:border-white/10 pt-2 mt-2">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10">
              <ExternalLink className="w-5 h-5" /> Înapoi la site
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
