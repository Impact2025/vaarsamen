import { auth } from '@/lib/auth'
import { tochtSchema } from '@/lib/validations'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { tochten } from '@/lib/db/schema'
import { and, eq, gte, isNull, desc } from 'drizzle-orm'

// GET /api/tochten — Lijst van open tochten (optioneel gefilterd op datum/gebied)
export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const vaargebied = searchParams.get('vaargebied')
  const datum      = searchParams.get('datum')
  const vandaag    = new Date().toISOString().slice(0, 10)

  const conditions = [
    isNull(tochten.deletedAt),
    eq(tochten.status, 'open'),
    gte(tochten.datum, vandaag), // alleen toekomstige tochten
  ]

  if (vaargebied) conditions.push(eq(tochten.vaargebied, vaargebied))
  if (datum)      conditions.push(eq(tochten.datum, datum))

  const rows = await db
    .select()
    .from(tochten)
    .where(and(...conditions))
    .orderBy(tochten.datum, desc(tochten.createdAt))
    .limit(50)

  return Response.json({ tochten: rows })
}

// POST /api/tochten — Nieuwe tocht plaatsen
export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const body   = await req.json()
  const parsed = tochtSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [tocht] = await db.insert(tochten).values({
    profileId:      profile.id,
    ...parsed.data,
    bootType:       parsed.data.bootType ?? null,
    vertrekTijd:    parsed.data.vertrekTijd ?? null,
    beschrijving:   parsed.data.beschrijving ?? null,
    locatie:        parsed.data.locatie ?? null,
  }).returning()

  return Response.json({ tocht }, { status: 201 })
}
