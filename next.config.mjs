/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy - Allow Reown/WalletConnect, Vercel, and necessary scripts
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.walletconnect.com https://*.walletconnect.org https://verify.walletconnect.com https://relay.walletconnect.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: http:",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://relay.walletconnect.com wss://relay.walletconnect.com https://rpc.walletconnect.com https://pulse.walletconnect.com https://sepolia.base.org https://mainnet.base.org https://base-sepolia.blockpi.network https://base.blockpi.network https://x402.org https://facilitator.x402.rs https://facilitator.x402.coinbase.com https://vercel.live",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          // X-Frame-Options - Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // X-Content-Type-Options - Prevent MIME sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Referrer-Policy - Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // X-XSS-Protection - Legacy XSS filter
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permissions-Policy - Control browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ]
  },
}

export default nextConfig
