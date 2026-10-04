import type { Metadata, Viewport } from 'next'
import { Bodoni_Moda, Plus_Jakarta_Sans } from 'next/font/google'

const bodoni = Bodoni_Moda({
  variable: '--font-bodoni-moda',
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const jakarta = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta',
  subsets: ['latin', 'latin-ext'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
})

// Solo le icone usate (sottoinsieme → pochi KB). Elenco in ordine alfabetico, come richiede Google Fonts.
const ICONS = [
  'add', 'all_inclusive', 'arrow_back_ios_new', 'arrow_forward', 'auto_awesome', 'auto_fix_high', 'call',
  'award_star', 'blur_on', 'bolt', 'cancel', 'chair', 'check', 'check_circle', 'close',
  'collections_bookmark', 'content_copy', 'format_quote', 'forward_to_inbox', 'help_outline',
  'lock', 'mail', 'menu_book', 'palette', 'person', 'photo_camera', 'psychology', 'restore',
  'schedule', 'shield', 'shopping_bag', 'smart_toy', 'star', 'styler', 'swap_horiz',
  'trending_down', 'tune', 'verified', 'verified_user', 'visibility', 'ad_units',
].sort()

const ICON_CSS = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=${ICONS.join(',')}&display=block`

export const metadata: Metadata = {
  title: '50+ Prompturi AI pentru Poziții & Compoziții de Revistă — Roxii Dincă',
  description: 'Creează imagini foto ultra-realiste pentru beauty & fashion fără costul unui fotograf. 50+ prompturi gata de copiat în ChatGPT, Midjourney sau Gemini.',
  openGraph: {
    title: '50+ Prompturi AI pentru Poziții & Compoziții de Revistă',
    description: 'Biblioteca ta de ședințe foto virtuale pentru beauty & fashion.',
    url: 'https://mentorat.roxii-dinca.com/prompturi',
    siteName: 'Roxii Dincă',
    locale: 'ro_RO',
    type: 'website',
    images: [{ url: '/prompturi/cover.jpg', width: 1400, height: 1400 }],
  },
}

export const viewport: Viewport = { themeColor: '#fbf9f6' }

export default function PrompturiLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${bodoni.variable} ${jakarta.variable} min-h-screen bg-ed-canvas text-ed-ink font-jakarta`}>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={ICON_CSS} precedence="default" />
      {children}
    </div>
  )
}
