import type { Metadata, Viewport } from "next"
import { Playfair_Display, Inter } from "next/font/google"
import "./globals.css"

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: true,
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: true,
})

export const metadata: Metadata = {
  title: "Mentorat cu Roxana — De la 0 la 3.000€",
  description: "Strategii personalizate pentru succesul tău online. Cum să atragi clientele, cum să te promovezi și să obții claritate în online.",
  openGraph: {
    title: "Mentorat cu Roxana — De la 0 la 3.000€",
    description: "Strategii personalizate pentru succesul tău online.",
    url: "https://mentorat.roxii-dinca.com",
    siteName: "Mentorat Roxana",
    locale: "ro_RO",
    type: "website",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ED03E9",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ro" className={`${playfair.variable} ${inter.variable} antialiased`}>
      <head>
        {/* Preconnect per risorse esterne critiche */}
        <link rel="preconnect" href="https://sivrczlkoqtyjeiuvvvq.supabase.co"/>
        <link rel="dns-prefetch" href="https://js.stripe.com"/>
        <link rel="dns-prefetch" href="https://api.resend.com"/>
      </head>
      <body className="font-sans">{children}</body>
    </html>
  )
}
