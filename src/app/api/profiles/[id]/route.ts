import { auth } from '@/lib/auth'
import { profileUpdateSchema } from '@/lib/validations'
import { getProfileById, getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { profiles, boats } from '@/lib/db/schema'
import { eq, isNull, and } from 'drizzle-orm'

// GET /api/profiles/[id] — Profiel detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const profile = await getProfileById(id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const profileBoats = await db.select().from(boats).where(eq(boats.profileId, id))

  return Response.json({ profile: { ...profile, boats: profileBoats } })
}

// PATCH /api/profiles/[id] — Profiel bijwerken
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const myProfile = await getProfileByUserId(session.user.id)
  if (!myProfile || myProfile.id !== id) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [updated] = await db
    .update(profiles)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(profiles.id, id), isNull(profiles.deletedAt)))
    .returning()

  return Response.json({ profile: updated })
}
