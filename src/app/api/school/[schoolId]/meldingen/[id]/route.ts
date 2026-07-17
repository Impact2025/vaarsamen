import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatIssues, boatIssueHistory, users } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  status:     z.enum(['gemeld', 'in_behandeling', 'besteld', 'gerepareerd', 'gesloten']).optional(),
  prioriteit: z.enum(['laag', 'normaal', 'hoog', 'urgent']).optional(),
  internNote: z.string().max(2000).optional(),
  assignedTo:  z.string().uuid().nullable().optional(), // Fase 2: toewijzing klusser
})

// Wie mag wijzigen? Staff + klusser (klus oppakken). Leden niet.
const MAG_WIJZIGEN = ['eigenaar', 'instructeur', 'klusser'] as const
function magWijzigen(role: string | undefined): boolean {
  return !!role && (MAG_WIJZIGEN as readonly string[]).includes(role)
}

// PATCH /api/school/[schoolId]/meldingen/[id] — status, notitie of toewijzing
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, id } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!magWijzigen(membership?.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  // Huidige staat ophalen voor historie (van -> naar)
  const [huidig] = await db
    .select({ status: boatIssues.status, assignedTo: boatIssues.assignedTo })
    .from(boatIssues)
    .where(and(eq(boatIssues.id, id), eq(boatIssues.schoolId, schoolId)))
    .limit(1)
  if (!huidig) return Response.json({ error: 'Melding niet gevonden' }, { status: 404 })

  const resolvedAt = parsed.data.status === 'gerepareerd' || parsed.data.status === 'gesloten'
    ? new Date()
    : undefined

  const [melding] = await db
    .update(boatIssues)
    .set({
      ...parsed.data,
      updatedBy: session.user.id,
      updatedAt: new Date(),
      ...(resolvedAt ? { resolvedAt } : {}),
    })
    .where(and(eq(boatIssues.id, id), eq(boatIssues.schoolId, schoolId)))
    .returning()

  // ── HISTORIE SCHRIJVEN ───────────────────────────────────────────────
  const historie: any[] = []
  if (parsed.data.status && parsed.data.status !== huidig.status) {
    historie.push({
      issueId: id, actorId: session.user.id, actie: 'status',
      vanWaarde: huidig.status, naarWaarde: parsed.data.status,
    })
  }
  if (parsed.data.assignedTo !== undefined && parsed.data.assignedTo !== huidig.assignedTo) {
    let naar = null as string | null
    if (parsed.data.assignedTo) {
      const [u] = await db.select({ name: users.name }).from(users).where(eq(users.id, parsed.data.assignedTo)).limit(1)
      naar = u?.name ?? parsed.data.assignedTo
    }
    historie.push({
      issueId: id, actorId: session.user.id, actie: 'toegewezen',
      vanWaarde: huidig.assignedTo ?? null, naarWaarde: naar,
    })
  }
  if (parsed.data.internNote !== undefined) {
    historie.push({
      issueId: id, actorId: session.user.id, actie: 'notitie',
      notitie: parsed.data.internNote,
    })
  }
  if (historie.length) await db.insert(boatIssueHistory).values(historie)

  return Response.json({ melding })
}
