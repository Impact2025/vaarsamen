import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatIssues, boatRentals } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

const rapportSchema = z.object({
  staat:        z.enum(['goed', 'matig', 'slecht']),
  problemen:    z.array(z.string()).default([]),
  toelichting:  z.string().max(2000).optional(),
})

// POST /api/school/[schoolId]/verhuur/[boekingId]/rapport
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; boekingId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, boekingId } = await params

  // Haal de boeking op — toegankelijk voor de huurder zelf én staff
  const [boeking] = await db
    .select()
    .from(boatRentals)
    .where(and(
      eq(boatRentals.id,       boekingId),
      eq(boatRentals.schoolId, schoolId),
      isNull(boatRentals.deletedAt),
    ))
    .limit(1)

  if (!boeking) return Response.json({ error: 'Boeking niet gevonden' }, { status: 404 })

  const membership = await getSchoolMembership(schoolId, session.user.id)
  const isHuurder  = boeking.userId === session.user.id
  if (!membership && !isHuurder) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const body   = await req.json()
  const parsed = rapportSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  // Alleen melding aanmaken als er iets te melden is
  if (parsed.data.staat !== 'goed' || parsed.data.problemen.length > 0 || parsed.data.toelichting) {
    const problemenTekst = parsed.data.problemen.length > 0
      ? `Problemen: ${parsed.data.problemen.join(', ')}. `
      : ''
    const beschrijving = `${problemenTekst}${parsed.data.toelichting ?? ''}`.trim()

    const prioriteit = parsed.data.staat === 'slecht' ? 'hoog'
                     : parsed.data.staat === 'matig'  ? 'normaal'
                     : 'laag'

    await db.insert(boatIssues).values({
      schoolId,
      bootId:       boeking.bootId,
      rentalId:     boekingId,
      reportedBy:   session.user.id,
      titel:        `Rapport na verhuur ${boeking.datum} — staat: ${parsed.data.staat}`,
      beschrijving: beschrijving || null,
      prioriteit,
      status:       'gemeld',
    })
  }

  return Response.json({ ok: true })
}
