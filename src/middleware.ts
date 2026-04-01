import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Routes waarvoor je ingelogd moet zijn
const PROTECTED_PREFIXES = [
  '/berichten',
  '/matches',
  '/mijn-vorderingen',
  '/ontdekken',
  '/profiel',
  '/tochten',
  '/onboarding',
  '/school',
  '/admin',
]

// Routes die altijd publiek zijn
const PUBLIC_PREFIXES = [
  '/login',
  '/demo',
  '/offline',
  '/api/auth',
  '/_next',
  '/favicon',
  '/icons',
  '/sw.js',
  '/manifest',
]

export default auth((req) => {
  const { nextUrl } = req
  const session     = req.auth
  const path        = nextUrl.pathname

  // Statisch / publiek — altijd doorlaten
  if (PUBLIC_PREFIXES.some(p => path.startsWith(p))) {
    return NextResponse.next()
  }

  // Root landing page is publiek
  if (path === '/') return NextResponse.next()

  const isProtected = PROTECTED_PREFIXES.some(p => path.startsWith(p))

  // Admin: moet ingelogd én admin zijn
  if (path.startsWith('/admin')) {
    if (!session?.user?.isAdmin) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Overige beschermde routes: moet ingelogd zijn
  if (isProtected && !session?.user?.id) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', path)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  // Alle routes behalve Next.js internals en statische bestanden
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.json).*)'],
}
