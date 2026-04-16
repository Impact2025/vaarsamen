import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Content-Type',  value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          // Clickjacking-bescherming
          { key: 'X-Frame-Options',           value: 'DENY' },
          // Voorkom MIME-sniffing
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          // Beperk referrer-informatie naar andere domeinen
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // Beperk browser-features (geen onnodige toegang)
          { key: 'Permissions-Policy',        value: 'camera=(), microphone=(), geolocation=(self), payment=()' },
          // HSTS: forceer HTTPS voor 2 jaar
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          // Content Security Policy
          // unsafe-inline is tijdelijk vereist voor Framer Motion en inline styles
          // Tighten naar nonces zodra alle inline scripts in kaart zijn gebracht
          {
            key:   'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://public.blob.vercel-storage.com https://lh3.googleusercontent.com https://images.unsplash.com",
              "connect-src 'self' https://*.pusher.com wss://*.pusher.com https://sockjs-eu.pusher.com https://api.resend.com",
              "worker-src 'self' blob:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:  'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname:  'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname:  'images.unsplash.com', // Demo foto's
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:4600',
        'localhost:5500',
        'vaarsamen.vercel.app',
        '*.vercel.app',
        'vaarsamen.nl',
        'www.vaarsamen.nl',
        '*.vaarsamen.nl',
      ],
    },
  },
}

export default nextConfig
