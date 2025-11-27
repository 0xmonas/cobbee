/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // ============================================================================
  // CORS Configuration for Development
  // ============================================================================
  // Allow cross-origin requests in development for testing
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    '*.local.dev',
  ],

  // ============================================================================
  // External Script CORS
  // ============================================================================
  // Allow cross-origin script loading (WalletConnect, etc.)
  crossOrigin: 'anonymous',

  // ============================================================================
  // HTTP Headers Configuration
  // ============================================================================
  async headers() {
    // Environment-based configuration
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
    const isDevelopment = process.env.NODE_ENV === 'development'
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'

    return [
      // ==========================================================================
      // API ROUTES: CORS Headers
      // ==========================================================================
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: isDevelopment ? '*' : allowedOrigins[0],
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Payment, X-Requested-With',
          },
          {
            key: 'Access-Control-Max-Age',
            value: '86400', // 24 hours
          },
        ],
      },

      // ==========================================================================
      // ALL ROUTES: Security Headers
      // ==========================================================================
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
              `connect-src 'self' ${supabaseUrl} https://*.walletconnect.com https://*.walletconnect.org wss://*.walletconnect.com wss://*.walletconnect.org https://relay.walletconnect.com wss://relay.walletconnect.com https://rpc.walletconnect.com https://pulse.walletconnect.com https://sepolia.base.org https://mainnet.base.org https://base-sepolia.blockpi.network https://base.blockpi.network https://x402.org https://facilitator.x402.rs https://api.cdp.coinbase.com https://vercel.live`,
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
          // HSTS - Force HTTPS (production only)
          {
            key: 'Strict-Transport-Security',
            value: isDevelopment ? '' : 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ]
  },
}

export default nextConfig
