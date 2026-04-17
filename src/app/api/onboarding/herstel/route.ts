import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { NextResponse } from 'next/server'

// GET /api/onboarding/herstel
// Herstelt de vs_onboarded cookie voor gebruikers die al onboarded zijn
// maar de cookie kwijt zijn (nieuw apparaat, gewiste cookies).
// Cookie wordt direct op het redirect-response gezet — cookies().set() +
// NextResponse.redirect() in dezelfde handler stuurt de cookie niet mee.
export async function GET() {
  const session = await auth()
  const base = process.env.AUTH_URL ?? 'https://www.vaarsamen.nl'

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', base))
  }

  const profile = await getProfileByUserId(session.user.id)

  if (profile?.isOnboarded) {
    const response = NextResponse.redirect(new URL('/ontdekken', base))
    response.cookies.set('vs_onboarded', 'true', {
      httpOnly: false,
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 365,
      path:     '/',
    })
    return response
  }

  return NextResponse.redirect(new URL('/onboarding', base))
}
