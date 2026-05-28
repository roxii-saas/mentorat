import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

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
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#c97d4e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ro" className={`${playfair.variable} ${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
