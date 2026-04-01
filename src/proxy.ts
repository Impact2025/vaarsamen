import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Publieke API routes — geen auth vereist
const PUBLIC_API_ROUTES = [
  '/api/auth',
  '/api/pusher/auth', // Pusher private channel authenticatie
]

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isLoggedIn = !!req.auth

  // Publieke routes: altijd doorlaten
  const isPublicPage = ['/', '/login', '/school/login', '/demo'].includes(pathname)
    || pathname.startsWith('/school/join/')
  const isPublicApi  = PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))
  const isStaticFile = pathname.startsWith('/_next')
    || pathname.startsWith('/favicon')
    || pathname === '/manifest.json'
    || pathname === '/sw.js'
    || pathname.startsWith('/icons/')

  if (isPublicPage || isPublicApi || isStaticFile) {
    return NextResponse.next()
  }

  // API routes: 401 teruggeven als niet ingelogd
  if (pathname.startsWith('/api/')) {
    if (!isLoggedIn) {
      return Response.json({ error: 'Niet ingelogd' }, { status: 401 })
    }
    return NextResponse.next()
  }

  // App routes: redirect naar login als niet ingelogd
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Onboarding check via cookie (gezet door de onboarding API route)
  // Alleen van toepassing op hoofd-app routes die een compleet profiel vereisen
  const MAIN_APP_PREFIXES = [
    '/ontdekken', '/berichten', '/matches', '/profiel', '/tochten', '/mijn-vorderingen',
  ]
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isMainAppRoute    = MAIN_APP_PREFIXES.some(p => pathname.startsWith(p))
  const onboardedCookie   = req.cookies.get('vs_onboarded')?.value

  if (onboardedCookie === 'false' && isMainAppRoute) {
    return NextResponse.redirect(new URL('/onboarding', req.nextUrl))
  }

  if (onboardedCookie === 'true' && isOnboardingRoute) {
    return NextResponse.redirect(new URL('/ontdekken', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
