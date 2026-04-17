import { revalidateTag } from 'next/cache'
import { auth } from '@/lib/auth'
import { profileCreateSchema } from '@/lib/validations'
import { getDiscoveryFeed, getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { profiles, boats } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/profiles — Discovery feed (met scoring)
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) {
    return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })
  }

  const { searchParams } = new URL(req.url)

  const result = await getDiscoveryFeed(profile.id, {
    cwoLevels:    searchParams.get('cwoLevel')?.split(',').filter(Boolean),
    sailingAreas: searchParams.get('sailingArea')?.split(',').filter(Boolean)
                  ?? (profile.sailingAreas?.length ? profile.sailingAreas : undefined),
    limit:        Number(searchParams.get('limit') ?? '20'),
    myLat:        profile.lat             ?? null,
    myLng:        profile.lng             ?? null,
    radiusKm:     profile.searchRadiusKm  ?? 50,
    // Strikte datumfilter — alleen als meegegeven in query
    availableDate: searchParams.get('date') ?? undefined,
    // Scoringscontext voor de huidige gebruiker
    myCwoLevel:   profile.cwoLevel    ?? 'geen',
    myRole:       profile.sailingRole ?? 'beide',
    myLookingFor: profile.lookingFor  ?? 'alles',
    myExperience: profile.experience  ?? null,
  })

  return Response.json({ profiles: result })
}

// POST /api/profiles — Profiel aanmaken (na onboarding stap 1)
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Niet ingelogd' }, { status: 401 })
  }

  const existing = await getProfileByUserId(session.user.id)
  if (existing) {
    return Response.json({ error: 'Profiel bestaat al' }, { status: 409 })
  }

  const body   = await req.json()
  const parsed = profileCreateSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const [profile] = await db
    .insert(profiles)
    .values({
      userId:       session.user.id,
      displayName:  parsed.data.displayName,
      photoUrl:     parsed.data.photoUrl     ?? null,
      age:          parsed.data.age,
      bio:          parsed.data.bio,
      city:         parsed.data.city,
      province:     parsed.data.province,
      homePort:     parsed.data.homePort,
      cwoLevel:     parsed.data.cwoLevel,
      sailingRole:  parsed.data.sailingRole,
      lookingFor:   parsed.data.lookingFor,
      experience:   parsed.data.experience,
      sailingAreas: parsed.data.sailingAreas ?? [],
      skillTags:    parsed.data.skillTags    ?? [],
    })
    .returning()

  revalidateTag('profiles')
  return Response.json({ profile }, { status: 201 })
}
