import { auth } from '@/lib/auth'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { profiles } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

// POST /api/profiles/complete — Markeer onboarding als voltooid
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  await db
    .update(profiles)
    .set({ isOnboarded: true, updatedAt: new Date() })
    .where(eq(profiles.id, profile.id))

  // Zet cookie zodat middleware weet dat onboarding klaar is
  const cookieStore = await cookies()
  cookieStore.set('vs_onboarded', 'true', {
    httpOnly: false, // Client-side leesbaar voor middleware
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 365, // 1 jaar
    path:     '/',
  })

  return Response.json({ success: true })
}
