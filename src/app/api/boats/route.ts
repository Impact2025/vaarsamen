import { auth } from '@/lib/auth'
import { boatSchema } from '@/lib/validations'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { boats } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// POST /api/boats — Boot toevoegen aan profiel
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const body   = await req.json()
  const parsed = boatSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [boat] = await db
    .insert(boats)
    .values({ profileId: profile.id, ...parsed.data })
    .returning()

  return Response.json({ boat }, { status: 201 })
}

// GET /api/boats — Eigen boten ophalen
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const profileBoats = await db.select().from(boats).where(eq(boats.profileId, profile.id))
  return Response.json({ boats: profileBoats })
}

// DELETE /api/boats?id=... — Boot verwijderen
export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const boatId = searchParams.get('id')
  if (!boatId) return Response.json({ error: 'Boot ID vereist' }, { status: 400 })

  // Controleer ownership
  const [boat] = await db.select().from(boats).where(eq(boats.id, boatId)).limit(1) as typeof boats.$inferSelect[]
  if (!boat || boat.profileId !== profile.id) {
    return Response.json({ error: 'Boot niet gevonden' }, { status: 404 })
  }

  await db.delete(boats).where(eq(boats.id, boatId))
  return new Response(null, { status: 204 })
}
