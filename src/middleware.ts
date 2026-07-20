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

  // NextAuth v5 beta valt soms terug op /api/auth/signin i.p.v. pages.signIn → stuur door naar /login
  if (pathname === '/api/auth/signin' && req.method === 'GET') {
    const callbackUrl = req.nextUrl.searchParams.get('callbackUrl') ?? '/'
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', callbackUrl)
    return NextResponse.redirect(loginUrl)
  }

  // Publieke routes: altijd doorlaten
  const isPublicPage = ['/', '/login', '/registreer', '/check-email', '/school/login', '/pro/login', '/admin/login', '/demo'].includes(pathname)
    || pathname.startsWith('/school/join/')
    || pathname.startsWith('/boet')
    || pathname.startsWith('/blog')            // publiek platform-blog (incl. /blog/[slug])
    // Een uitgenodigde is nog niet ingelogd: de pagina regelt zelf de inlogstap.
    || pathname.startsWith('/uitnodiging/')
  const isPublicApi  = PUBLIC_API_ROUTES.some(r => pathname.startsWith(r))
  const isStaticFile = pathname.startsWith('/_next')
    || pathname.startsWith('/favicon')
    || pathname === '/manifest.json'
    || pathname === '/sw.js'
    || pathname === '/theme-init.js'
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
    const loginUrl = new URL('/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Admin routes: redirect naar home als niet admin.
  // UITGEZONDERD /admin/login — dat is juist de (publieke) admin-loginpagina.
  if (
    pathname.startsWith('/admin') &&
    pathname !== '/admin/login' &&
    !req.auth?.user?.isAdmin
  ) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // /pro routes: ingelogd vereist. De precieze staff-role-check gebeurt in de
  // /pro page zelf (Node runtime, DB-toegang); hier blokkeren we enkel anoniem.
  if (pathname.startsWith('/pro') && !isLoggedIn) {
    const loginUrl = new URL('/pro/login', req.nextUrl)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Onboarding check: JWT-token (gezet bij login) + cookie (gezet na afronden onboarding)
  // JWT is de bron bij login; cookie is actueel na onboarding in dezelfde sessie.
  // Gecombineerd zodat nieuwe gebruikers (geen cookie) én cookie-loze terugkomers goed worden afgehandeld.
  const MAIN_APP_PREFIXES = [
    '/ontdekken', '/berichten', '/matches', '/profiel', '/tochten', '/mijn-vorderingen',
  ]
  const isOnboardingRoute = pathname.startsWith('/onboarding')
  const isMainAppRoute    = MAIN_APP_PREFIXES.some(p => pathname.startsWith(p))

  const jwtOnboarded    = (req.auth?.user as { isOnboarded?: boolean })?.isOnboarded === true
  const cookieOnboarded = req.cookies.get('vs_onboarded')?.value === 'true'
  const isOnboarded     = jwtOnboarded || cookieOnboarded

  if (!isOnboarded && isMainAppRoute) {
    return NextResponse.redirect(new URL('/onboarding', req.nextUrl))
  }

  // Geen middleware-redirect van /onboarding → /ontdekken op basis van cookie/JWT:
  // de OnboardingPage server component checkt de DB en handelt beide gevallen correct af.
  // Een stale cookie (isOnboarded=true, maar DB=false) veroorzaakt anders een redirect-loop
  // tussen de middleware en de /ontdekken page.

  return NextResponse.next()
})

export const config = {
  // /admin/login en /pro/login zijn publieke loginpagina's — middleware slaat
  // deze expliciet over zodat de auth-guard er niet op kan botsen.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|admin/login|pro/login).*)'],
}
