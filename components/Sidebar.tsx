'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface NavItem { href: string; label: string; icon: string; exact?: boolean }

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
    try { setCollapsed(localStorage.getItem('sb-col') === '1') } catch {}
  }, [])

  const toggleCollapse = () => {
    const next = !collapsed
    setCollapsed(next)
    try { localStorage.setItem('sb-col', next ? '1' : '0') } catch {}
  }

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const initials = useMemo(() => {
    if (userName) return userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    return (userEmail?.[0] ?? '?').toUpperCase()
  }, [userName, userEmail])

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const homeHref = role === 'admin' ? '/admin' : '/dashboard'

  return (
    <>
      {/* Overlay mobile */}
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-sm" onClick={() => setOpen(false)} />}

      {/* Mobile topbar */}
      <header className="db-nav fixed top-0 inset-x-0 z-30 lg:hidden h-14 flex items-center px-4 justify-between">
        <button onClick={() => setOpen(true)} className="p-2 -ml-1 rounded-xl hover:bg-black/5 transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="#3D3D3D" strokeWidth="2" className="w-5 h-5">
            <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round"/>
          </svg>
        </button>
        <Link href={homeHref} className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#ED03E9] rounded-lg flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.2" className="w-3.5 h-3.5">
              <path d="M10 2L3 6l7 4 7-4-7-4zM3 13l7 4 7-4M3 9.5l7 4 7-4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-serif font-bold text-[#0A0A0A] text-base">
            {role === 'admin' ? 'Admin' : 'Mentorat'}<span className="text-[#ED03E9]">.</span>
          </span>
        </Link>
        <div className="w-9 h-9 bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] rounded-full flex items-center justify-center text-white font-bold text-xs shadow-md">
          {initials}
        </div>
      </header>

      {/* Sidebar */}
      <aside className={cn(
        'db-sidebar fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-all duration-300',
        'lg:static lg:translate-x-0 shadow-xl lg:shadow-none',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'lg:w-[64px]' : 'w-[240px]'
      )}>

        {/* Logo row */}
        <div className="flex items-center justify-between h-14 px-3 flex-shrink-0 border-b border-black/5">
          <Link href={homeHref} className={cn('flex items-center gap-2.5 min-w-0', collapsed && 'lg:justify-center')}>
            <div className="w-8 h-8 bg-[#ED03E9] rounded-xl flex items-center justify-center shadow-md shadow-[#ED03E9]/25 flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.2" className="w-4 h-4">
                <path d="M10 2L3 6l7 4 7-4-7-4zM3 13l7 4 7-4M3 9.5l7 4 7-4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {!collapsed && (
              <div className="leading-tight min-w-0">
                <span className="font-serif font-bold text-[#0A0A0A] text-[15px] block">
                  {role === 'admin' ? 'Admin' : 'Mentorat'}<span className="text-[#ED03E9]">.</span>
                </span>
                <span className="text-[10px] text-[#737373] font-sans block truncate">Roxana Dinca</span>
              </div>
            )}
          </Link>
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-black/5">
              <svg viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="2.5" className="w-4 h-4">
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round"/>
              </svg>
            </button>
            <button onClick={toggleCollapse} className="hidden lg:flex p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="#A0A0A0" strokeWidth="2" className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')}>
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {items.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                title={collapsed ? item.label : undefined}
                className={cn('nav-item', active && 'active', collapsed && 'lg:justify-center lg:px-0')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
                  className={cn('w-[18px] h-[18px] flex-shrink-0', active ? 'stroke-[#ED03E9]' : 'stroke-[#737373]')}>
                  <path d={item.icon} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {!collapsed && item.label}
                {collapsed && (
                  <span className="hidden lg:block absolute left-full ml-3 bg-[#0A0A0A] text-white text-xs font-sans px-2.5 py-1.5 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-lg">
                    {item.label}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Divider */}
        <div className="px-2 pb-2 space-y-0.5 border-t border-black/5 pt-2">
          <Link href="/" onClick={() => setOpen(false)}
            className={cn('nav-item', collapsed && 'lg:justify-center lg:px-0')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#737373" strokeWidth="1.8" className="w-[18px] h-[18px] flex-shrink-0">
              <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {!collapsed && <span>Înapoi la site</span>}
          </Link>
        </div>

        {/* User */}
        <div className="px-2 py-2.5 border-t border-black/5">
          <div className={cn('flex items-center gap-2.5 px-2 py-2 rounded-xl', collapsed && 'lg:justify-center')}>
            <div className="w-8 h-8 bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-[#0A0A0A] font-sans truncate">{userName || userEmail}</p>
                {userName && <p className="text-[11px] text-[#737373] font-sans truncate">{userEmail}</p>}
              </div>
            )}
            <button onClick={logout} title="Ieșire"
              className="flex-shrink-0 p-1.5 rounded-lg text-[#737373] hover:text-red-500 hover:bg-red-50 transition-colors">
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
