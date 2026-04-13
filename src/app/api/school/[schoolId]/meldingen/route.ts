import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatIssues, schoolFleet, users } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, desc, isNull } from 'drizzle-orm'
import { z } from 'zod'

const meldingSchema = z.object({
  bootId:       z.string().uuid(),
  titel:        z.string().min(3).max(200),
  beschrijving: z.string().max(2000).optional(),
  prioriteit:   z.enum(['laag', 'normaal', 'hoog', 'urgent']).default('normaal'),
  rentalId:     z.string().uuid().optional(),
})

// GET /api/school/[schoolId]/meldingen — alle meldingen voor de school
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const rows = await db
    .select({
      issue:    boatIssues,
      boot:     { id: schoolFleet.id, bootNummer: schoolFleet.bootNummer, naam: schoolFleet.naam },
      melder:   { id: users.id, name: users.name, email: users.email },
    })
    .from(boatIssues)
    .leftJoin(schoolFleet, eq(schoolFleet.id, boatIssues.bootId))
    .leftJoin(users,       eq(users.id,        boatIssues.reportedBy))
    .where(eq(boatIssues.schoolId, schoolId))
    .orderBy(desc(boatIssues.createdAt))

  return Response.json({ meldingen: rows })
}

// POST /api/school/[schoolId]/meldingen — nieuwe melding aanmaken (handmatig door staff)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = meldingSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [melding] = await db
    .insert(boatIssues)
    .values({
      schoolId,
      bootId:       parsed.data.bootId,
      titel:        parsed.data.titel,
      beschrijving: parsed.data.beschrijving,
      prioriteit:   parsed.data.prioriteit,
      rentalId:     parsed.data.rentalId,
      reportedBy:   session.user.id,
      status:       'gemeld',
    })
    .returning()

  return Response.json({ melding }, { status: 201 })
}
