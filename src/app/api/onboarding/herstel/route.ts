import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

// GET /api/onboarding/herstel
// Herstelt de vs_onboarded cookie voor gebruikers die al onboarded zijn
// maar de cookie kwijt zijn (nieuw apparaat, gewiste cookies).
// Breekt de redirect-loop tussen /onboarding en /ontdekken.
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', process.env.AUTH_URL ?? 'https://www.vaarsamen.nl'))
  }

  const profile = await getProfileByUserId(session.user.id)
  const base = process.env.AUTH_URL ?? 'https://www.vaarsamen.nl'

  if (profile?.isOnboarded) {
    const cookieStore = await cookies()
    cookieStore.set('vs_onboarded', 'true', {
      httpOnly: false,
      sameSite: 'lax',
      maxAge:   60 * 60 * 24 * 365,
      path:     '/',
    })
    return NextResponse.redirect(new URL('/ontdekken', base))
  }

  return NextResponse.redirect(new URL('/onboarding', base))
}
