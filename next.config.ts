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
        'vaarsamen.vercel.app',
        '*.vercel.app',
        'vaarsamen.nl',
        '*.vaarsamen.nl',
      ],
    },
  },
}

export default nextConfig
