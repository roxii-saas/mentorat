'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Users, Calendar, Clock, Settings, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()

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
    <nav className="bg-gray-900 text-white px-4 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-serif font-bold text-lg">Admin</span>
          <span className="text-gray-400 text-sm font-sans">· Roxana Mentorat</span>
        </div>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors',
                (exact ? pathname === href : pathname.startsWith(href))
                  ? 'bg-white/15 text-white font-semibold'
                  : 'text-gray-400 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden md:block">{label}</span>
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-gray-400 hover:bg-white/10 hover:text-white transition-colors ml-2"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </nav>
  )
}
