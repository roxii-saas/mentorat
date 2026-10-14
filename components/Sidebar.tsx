'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useMemo, useState, useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface NavItem { href: string; label: string; icon: string; exact?: boolean }
interface SidebarProps { items: NavItem[]; role: 'admin' | 'client'; userName?: string; userEmail?: string }

// Stato "meniu restrâns" salvato in localStorage (stato esterno → useSyncExternalStore, nessun mismatch di idratazione)
const COL_KEY = 'sb-col'
const COL_EVENT = 'sb-col-change'
const subscribeCollapsed = (cb: () => void) => {
  window.addEventListener(COL_EVENT, cb)
  window.addEventListener('storage', cb)
  return () => { window.removeEventListener(COL_EVENT, cb); window.removeEventListener('storage', cb) }
}
const readCollapsed = () => { try { return localStorage.getItem(COL_KEY) === '1' } catch { return false } }

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d={d} />
    </svg>
  )
}

export default function Sidebar({ items, role, userName, userEmail }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false)

  const toggle = () => {
    try { localStorage.setItem(COL_KEY, collapsed ? '0' : '1') } catch {}
    window.dispatchEvent(new Event(COL_EVENT))
  }

  const logout = async () => {
    await createClient().auth.signOut()
    router.push('/login')
  }

  const initials = useMemo(() => {
    if (userName) return userName.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    return (userEmail?.[0] ?? '?').toUpperCase()
  }, [userName, userEmail])

  const isActive = (href: string, exact?: boolean) => (exact ? pathname === href : pathname.startsWith(href))
  const home = role === 'admin' ? '/admin' : '/dashboard'
  const subtitle = role === 'admin' ? 'Panou admin' : 'Contul meu'

  return (
    <>
      {open && <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      {/* Bară de sus (mobil) */}
      <header className="g-nav fixed top-0 inset-x-0 z-30 lg:hidden h-[60px] flex items-center justify-between pl-1 pr-2">
        <button type="button" onClick={() => setOpen(true)} aria-label="Deschide meniul"
          className="w-12 h-12 flex items-center justify-center rounded-xl text-[#15151C] hover:bg-[#F6F6FA]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-6 h-6" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Link href={home} className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="" width={32} height={32} className="w-8 h-8 object-contain" />
          <span className="text-base leading-5 font-bold text-[#15151C]">Roxii Dincă</span>
        </Link>
        <div className="w-12 h-12 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full bg-[#F4D3F5] text-[#7A007D] flex items-center justify-center font-bold text-[13px]">{initials}</div>
        </div>
      </header>

      {/* Meniu lateral */}
      <aside className={cn(
        'g-sidebar fixed top-0 left-0 bottom-0 z-50 flex flex-col transition-transform duration-200',
        'lg:static lg:translate-x-0 lg:transition-none',
        open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        collapsed ? 'w-[264px] lg:w-[72px]' : 'w-[264px] lg:w-[248px]'
      )}>

        <div className={cn('flex items-center justify-between gap-2 px-3 pt-5 pb-4 flex-shrink-0', collapsed && 'lg:flex-col lg:px-2')}>
          <Link href={home} className="flex items-center gap-2.5 min-w-0 px-1">
            <Image src="/logo.png" alt="" width={40} height={40} className="w-10 h-10 object-contain flex-shrink-0" />
            <span className={cn('min-w-0', collapsed && 'lg:hidden')}>
              <span className="block text-base leading-5 font-bold text-[#15151C] truncate">Roxii Dincă</span>
              <span className="block text-[13px] leading-[18px] text-[#5A5A6C]">{subtitle}</span>
            </span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} aria-label="Închide meniul"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-[#5A5A6C] hover:bg-[#F6F6FA]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="w-5 h-5" aria-hidden><path d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
          <button type="button" onClick={toggle} aria-label={collapsed ? 'Extinde meniul' : 'Restrânge meniul'}
            className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg text-[#5A5A6C] hover:bg-[#F6F6FA] flex-shrink-0">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={cn('w-4 h-4 transition-transform', collapsed && 'rotate-180')} aria-hidden><path d="M15 18l-6-6 6-6" /></svg>
          </button>
        </div>

        <nav aria-label="Navigare" className="flex-1 overflow-y-auto px-3 space-y-0.5">
          {items.map(item => {
            const active = isActive(item.href, item.exact)
            return (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                aria-current={active ? 'page' : undefined}
                className={cn('nav-item', active && 'active', collapsed && 'lg:justify-center lg:px-0')}>
                <Icon d={item.icon} className="w-5 h-5 flex-shrink-0" />
                <span className={cn(collapsed && 'lg:hidden')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="px-3 pt-2 pb-2">
          <Link href="/" onClick={() => setOpen(false)} title={collapsed ? 'Înapoi la site' : undefined}
            className={cn('nav-item !text-sm !text-[#5A5A6C]', collapsed && 'lg:justify-center lg:px-0')}>
            <Icon d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" className="w-5 h-5 flex-shrink-0" />
            <span className={cn(collapsed && 'lg:hidden')}>Înapoi la site</span>
          </Link>
        </div>

        <div className="border-t border-[#E4E4EC] px-3 py-3">
          <div className={cn('flex items-center gap-2.5 px-1', collapsed && 'lg:flex-col')}>
            <div className="w-9 h-9 rounded-full bg-[#F4D3F5] text-[#7A007D] flex items-center justify-center font-bold text-[13px] flex-shrink-0">{initials}</div>
            <div className={cn('flex-1 min-w-0', collapsed && 'lg:hidden')}>
              <p className="text-sm leading-5 font-semibold text-[#15151C] truncate">{userName || userEmail}</p>
              {userName && <p className="text-xs leading-4 text-[#5A5A6C] truncate">{userEmail}</p>}
            </div>
            <button type="button" onClick={logout} aria-label="Ieșire" title="Ieșire"
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-[#5A5A6C] hover:text-[#B42318] hover:bg-[#FDE8E6] transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]" aria-hidden>
                <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
