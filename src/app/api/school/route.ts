import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sailingSchools, schoolMemberships } from '@/lib/db/schema'
import { schoolCreateSchema } from '@/lib/validations'
import { getMySchools } from '@/lib/db/queries/school'
import { eq } from 'drizzle-orm'

// GET /api/school — mijn scholen ophalen
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const scholen = await getMySchools(session.user.id)
  return Response.json({ scholen })
}

// POST /api/school — nieuwe school aanmaken
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const body   = await req.json()
  const parsed = schoolCreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  // Slug moet uniek zijn
  const [existing] = await db
    .select({ id: sailingSchools.id })
    .from(sailingSchools)
    .where(eq(sailingSchools.slug, parsed.data.slug))
    .limit(1)

  if (existing) {
    return Response.json({ error: 'Deze slug is al in gebruik' }, { status: 409 })
  }

  // School aanmaken + eigenaar membership in één transactie
  const [school] = await db
    .insert(sailingSchools)
    .values({
      name:        parsed.data.name,
      slug:        parsed.data.slug,
      description: parsed.data.description,
      straat:      parsed.data.straat      || null,
      huisnummer:  parsed.data.huisnummer  || null,
      postcode:    parsed.data.postcode    || null,
      city:        parsed.data.city        || null,
      website:     parsed.data.website     || null,
      ownerUserId: session.user.id,
    })
    .returning()

  await db.insert(schoolMemberships).values({
    schoolId: school.id,
    userId:   session.user.id,
    role:     'eigenaar',
  })

  return Response.json({ school }, { status: 201 })
}
