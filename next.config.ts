import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
  // Necessario per Stripe webhook: raw body
  async headers() {
    return [
      {
        source: '/api/stripe/webhook',
        headers: [{ key: 'Content-Type', value: 'application/json' }],
      },
    ]
  },
};

export default nextConfig;
