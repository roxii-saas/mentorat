'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Calendar, User, Home, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/dashboard', label: 'Acasă', icon: Home },
    { href: '/dashboard/prenota', label: 'Programează sesiune', icon: Calendar },
    { href: '/dashboard/profil', label: 'Profilul meu', icon: User },
  ]

  return (
    <nav className="bg-white border-b border-gray-100 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="font-serif font-bold text-lg text-gray-900">
          Mentorat <span className="text-[#c97d4e]">Roxana</span>
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans transition-colors',
                pathname === href
                  ? 'bg-[#c97d4e]/10 text-[#c97d4e] font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:block">{label}</span>
            </Link>
          ))}
          <button
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-sans text-gray-500 hover:bg-gray-100 transition-colors ml-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Ieșire</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
