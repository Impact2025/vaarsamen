import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatIssues, boatIssueHistory, schoolFleet, users, schoolMemberships } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, desc, isNull, inArray } from 'drizzle-orm'
import { z } from 'zod'

const meldingSchema = z.object({
  bootId:       z.string().uuid(),
  titel:        z.string().min(3).max(200),
  beschrijving: z.string().max(2000).optional(),
  prioriteit:   z.enum(['laag', 'normaal', 'hoog', 'urgent']).default('normaal'),
  rentalId:     z.string().uuid().optional(),
})

// Rollen die de klussenlijst mogen zien / meldingen mogen doen.
// Staff (eigenaar/instructeur) + klusser (onderhoud) + lid (mag melden).
const KLUSSEN_LEZEN = ['eigenaar', 'instructeur', 'klusser', 'lid'] as const
function magLezen(role: string | undefined): boolean {
  return !!role && (KLUSSEN_LEZEN as readonly string[]).includes(role)
}

// GET /api/school/[schoolId]/meldingen — klussenlijst voor de school
// Toegankelijk voor: staff, klusser, lid én de huurder van een gekoppelde verhuur.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)

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

  // Voor toewijzing: naam van toegewezen klusser ophalen
  const toegewezenIds = rows.map(r => r.issue.assignedTo).filter(Boolean) as string[]
  const toegewezenMap: Record<string, string> = {}
  if (toegewezenIds.length) {
    const usrs = await db.select({ id: users.id, name: users.name, email: users.email })
      .from(users).where(inArray(users.id, toegewezenIds))
    for (const u of usrs) toegewezenMap[u.id] = u.name ?? u.email ?? '?'
  }

  // Huurder (geen leesrol) mag alleen meldingen zien waarvan hij de verhuurder is.
  const magAlles = magLezen(membership?.role)
  const zichtbaar = magAlles
    ? rows
    : rows.filter(r => r.issue.rentalId != null && r.issue.reportedBy === session.user.id)

  // Voor toewijzing: leden die een klus mogen oppakken (klusser, lid/instructeur/eigenaar).
  const klusKandidaten = await db
    .select({ id: schoolMemberships.userId, naam: users.name, role: schoolMemberships.role })
    .from(schoolMemberships)
    .innerJoin(users, eq(schoolMemberships.userId, users.id))
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      isNull(schoolMemberships.deletedAt),
      inArray(schoolMemberships.role, ['klusser', 'lid', 'instructeur', 'eigenaar']),
    ))
    .orderBy(users.name)

  return Response.json({
    magMelden: magAlles || !!membership,
    rollen: membership?.role ?? null,
    magToewijzen: ['eigenaar', 'instructeur', 'klusser'].includes(membership?.role ?? ''),
    klusKandidaten: klusKandidaten.map(k => ({ id: k.id, naam: k.naam ?? '?', role: k.role })),
    meldingen: zichtbaar.map(r => ({
      ...r,
      toegewezenNaam: r.issue.assignedTo ? toegewezenMap[r.issue.assignedTo] ?? null : null,
    })),
  })
}

// POST /api/school/[schoolId]/meldingen — nieuwe melding
// Toegankelijk voor staff én leden (klussen melden). Huurders melden via
// de verhuur-rapportroute (gekoppeld aan hun boeking).
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  // Mag melden: staff, klusser of lid. (Huurder via rapport-route.)
  const magMelden = !!membership && (KLUSSEN_LEZEN as readonly string[]).includes(membership.role)
  if (!magMelden) {
    return Response.json({ error: 'Geen toegang om te melden' }, { status: 403 })
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

  // Historie: aanmaak
  await db.insert(boatIssueHistory).values({
    issueId:  melding.id,
    actorId:  session.user.id,
    actie:    'aangemaakt',
    naarWaarde: parsed.data.titel,
  })

  return Response.json({ melding }, { status: 201 })
}
