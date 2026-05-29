'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ThemeProvider'

const LINKS = [
  { href:'/admin', label:'Overview', exact:true, d:'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { href:'/admin/clienti', label:'Cliente', d:'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { href:'/admin/calendar', label:'Calendar', d:'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { href:'/admin/disponibilitate', label:'Disponibilitate', d:'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { href:'/admin/setari', label:'Setări', d:'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
]

export default function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 sticky top-0 z-40 shadow-sm transition-colors">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#ED03E9] rounded-lg flex items-center justify-center shadow-md shadow-[#ED03E9]/30">
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2" className="w-4 h-4">
              <path d="M10 2L3 6l7 4 7-4-7-4zM3 13l7 4 7-4M3 9.5l7 4 7-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="hidden sm:block leading-tight">
            <span className="font-serif font-bold text-sm text-gray-900 dark:text-white block">Admin</span>
            <span className="text-[10px] text-gray-400 font-sans">Roxana Mentorat</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-0.5">
          {LINKS.map(({ href, label, exact, d }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href}
                className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-sans transition-colors',
                  active ? 'bg-[#ED03E9]/8 text-[#ED03E9] font-semibold' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 hover:text-gray-900 dark:hover:text-white')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0"><path d={d} strokeLinecap="round" strokeLinejoin="round"/></svg>
                {label}
              </Link>
            )
          })}
        </div>

        <div className="hidden lg:flex items-center gap-1">
          <ThemeToggle />
          <Link href="/" className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-sans text-gray-400 hover:bg-gray-100 dark:hover:bg-white/8 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Site
          </Link>
          <button onClick={logout} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        <div className="lg:hidden flex items-center gap-1">
          <ThemeToggle />
          <button className="p-2" onClick={() => setOpen(!open)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-700 dark:text-gray-300">
              {open ? <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/> : <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/>}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-white/5 px-4 py-3 space-y-0.5">
          {LINKS.map(({ href, label, exact, d }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link key={href} href={href} onClick={() => setOpen(false)}
                className={cn('flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans transition-colors',
                  active ? 'bg-[#ED03E9]/8 text-[#ED03E9] font-semibold' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d={d} strokeLinecap="round" strokeLinejoin="round"/></svg>
                {label}
              </Link>
            )
          })}
          <div className="border-t border-gray-100 dark:border-white/8 pt-2 mt-1">
            <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Înapoi la site
            </Link>
            <button onClick={logout} className="w-full flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-sans text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Ieșire
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
