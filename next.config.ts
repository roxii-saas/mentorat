import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 giorni
    deviceSizes: [390, 640, 750, 1080, 1200],
    imageSizes: [64, 128, 256, 384],
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  // Compressione response
  compress: true,
  // Ottimizza output
  output: 'standalone',
  // Experimental: faster builds
  experimental: {
    optimizePackageImports: ['@stripe/react-stripe-js', '@stripe/stripe-js', '@supabase/ssr'],
  },
}

export default nextConfig
