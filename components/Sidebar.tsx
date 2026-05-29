'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/ThemeProvider'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: string
  exact?: boolean
}

interface SidebarProps {
  items: NavItem[]
  role: 'admin' | 'client'
  userName?: string
  userEmail?: string
}

export default function Sidebar({ items, role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored === 'true') setCollapsed(true)
  }, [])

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('sidebar-collapsed', String(next))
  }

  const logout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const initials = userName
    ? userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : userEmail?.[0]?.toUpperCase() ?? '?'

  return (
    <>
      {/* ── MOBILE OVERLAY ── */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── MOBILE TRIGGER (top bar) ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-white/5 h-14 flex items-center px-4 justify-between shadow-sm">
        <button onClick={() => setOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-gray-700 dark:text-gray-300">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/>
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-3.5 h-3.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-serif font-bold text-gray-900 dark:text-white text-base">
            {role === 'admin' ? 'Admin' : 'Mentorat'}<span className="text-[#c97d4e]">.</span>
          </span>
        </Link>
        <ThemeToggle />
      </header>

      {/* ── SIDEBAR ── */}
      <aside className={cn(
        'fixed top-0 left-0 bottom-0 z-50 flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-white/5 transition-all duration-300 shadow-lg lg:shadow-none',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'lg:w-[68px]' : 'w-[260px]'
      )}>

        {/* Logo */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
          <Link href={role === 'admin' ? '/admin' : '/dashboard'}
            className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'lg:justify-center')}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-4 h-4">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <span className="font-serif font-bold text-gray-900 dark:text-white text-base block">
                  {role === 'admin' ? 'Admin' : 'Mentorat'}<span className="text-[#c97d4e]">.</span>
                </span>
                {role === 'admin' && (
                  <span className="text-[10px] text-gray-400 font-sans block leading-none">Roxana Mentorat</span>
                )}
              </div>
            )}
          </Link>

          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Close button mobile */}
            <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4 text-gray-500">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
            {/* Collapse button desktop */}
            <button onClick={toggleCollapsed} className="hidden lg:flex p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={cn('w-4 h-4 text-gray-400 transition-transform', collapsed && 'rotate-180')}>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm font-sans font-medium group relative',
                  active
                    ? 'bg-[#c97d4e]/10 text-[#c97d4e]'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white',
                  collapsed && 'lg:justify-center lg:px-2'
                )}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  className={cn('w-5 h-5 flex-shrink-0', active ? 'stroke-[#c97d4e]' : '')}>
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {!collapsed && <span>{item.label}</span>}
                {active && <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#c97d4e] rounded-r-full" />}
                {/* Tooltip when collapsed */}
                {collapsed && (
                  <span className="hidden lg:block absolute left-full ml-3 bg-gray-900 text-white text-xs font-sans px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Divider + utility links */}
        <div className="px-2 py-2 border-t border-gray-100 dark:border-white/5 space-y-0.5">
          {/* Back to site */}
          <Link href="/"
            title={collapsed ? 'Înapoi la site' : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-sans font-medium text-gray-500 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-700 dark:hover:text-gray-300 transition-all group relative',
              collapsed && 'lg:justify-center lg:px-2'
            )}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5 flex-shrink-0">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!collapsed && <span>Înapoi la site</span>}
            {collapsed && (
              <span className="hidden lg:block absolute left-full ml-3 bg-gray-900 text-white text-xs font-sans px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Înapoi la site
              </span>
            )}
          </Link>

          {/* Theme toggle */}
          <div className={cn('flex items-center gap-3 px-3 py-2.5 rounded-xl', collapsed && 'lg:justify-center lg:px-2')}>
            {!collapsed && <span className="text-sm font-sans font-medium text-gray-500 dark:text-gray-500 flex-1">Temă</span>}
            <ThemeToggle />
          </div>
        </div>

        {/* User profile + logout */}
        <div className="px-2 py-3 border-t border-gray-100 dark:border-white/5">
          <div className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl',
            collapsed && 'lg:justify-center lg:px-2'
          )}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-full flex items-center justify-center text-white font-sans font-bold text-xs flex-shrink-0 shadow">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 font-sans truncate">
                  {userName || userEmail}
                </p>
                {userName && (
                  <p className="text-xs text-gray-400 font-sans truncate">{userEmail}</p>
                )}
              </div>
            )}
            <button
              onClick={logout}
              title="Ieșire"
              className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
