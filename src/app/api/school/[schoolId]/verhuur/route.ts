import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatRentals, schoolFleet, users, isStaff } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, gte, isNull, lte, desc } from 'drizzle-orm'
import { z } from 'zod'

// ─── GET /api/school/[schoolId]/verhuur ──────────────────────────────────────
// Lijst met boekingen voor deze school (eigenaar/instructeur ziet alles, cursist ziet alleen eigen)
// ?van=2026-03-01&tot=2026-03-31

export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const van = searchParams.get('van')
  const tot = searchParams.get('tot')

  const isStaff = ['eigenaar', 'instructeur'].includes(membership.role)

  const rows = await db
    .select({
      boeking:    boatRentals,
      boot:       schoolFleet,
      aanvrager:  { id: users.id, name: users.name, email: users.email },
    })
    .from(boatRentals)
    .innerJoin(schoolFleet, eq(boatRentals.bootId, schoolFleet.id))
    .innerJoin(users,       eq(boatRentals.userId,  users.id))
    .where(and(
      eq(boatRentals.schoolId, schoolId),
      isNull(boatRentals.deletedAt),
      ...(van ? [gte(boatRentals.datum, van)] : []),
      ...(tot ? [lte(boatRentals.datum, tot)] : []),
      ...(isStaff ? [] : [eq(boatRentals.userId, session.user.id)]),
    ))
    .orderBy(desc(boatRentals.datum))

  return Response.json(rows.map(r => ({
    id:         r.boeking.id,
    bootId:     r.boeking.bootId,
    bootNummer: r.boot.bootNummer,
    bootNaam:   r.boot.naam,
    datum:      r.boeking.datum,
    startTijd:  r.boeking.startTijd,
    eindTijd:   r.boeking.eindTijd,
    opmerking:  r.boeking.opmerking,
    reactie:    r.boeking.reactie,
    status:     r.boeking.status,
    aanvrager:  isStaff ? r.aanvrager : undefined,
    isMine:     r.boeking.userId === session.user!.id,
  })))
}

// ─── POST /api/school/[schoolId]/verhuur ─────────────────────────────────────
// Cursist dient aanvraag in

const CreateSchema = z.object({
  bootId:    z.string().min(1),
  datum:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTijd: z.string().regex(/^\d{2}:\d{2}$/),
  eindTijd:  z.string().regex(/^\d{2}:\d{2}$/),
  opmerking: z.string().max(500).optional(),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  // Boot reserveren mag pas als de school de aanmelding heeft goedgekeurd. Staff
  // regelt de goedkeuring zelf en valt daar dus buiten.
  if (!isStaff(membership.role) && membership.status !== 'goedgekeurd') {
    const uitleg: Record<string, string> = {
      onboarding:          'Rond eerst je aanmelding bij deze school af.',
      wacht_op_goedkeuring: 'Je aanmelding wacht nog op goedkeuring door de school.',
      afgewezen:           'Je aanmelding is niet goedgekeurd. Neem contact op met de school.',
    }
    return Response.json({
      error: uitleg[membership.status] ?? 'Je mag nog geen boot reserveren.',
      status: membership.status,
    }, { status: 403 })
  }

  const body = await req.json()
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Ongeldige invoer' }, { status: 400 })

  const { bootId, datum, startTijd, eindTijd, opmerking } = parsed.data

  if (startTijd >= eindTijd) {
    return Response.json({ error: 'Eindtijd moet na starttijd liggen' }, { status: 400 })
  }

  // Controleer of boot bij deze school hoort
  const [boot] = await db
    .select()
    .from(schoolFleet)
    .where(and(eq(schoolFleet.id, bootId), eq(schoolFleet.schoolId, schoolId), isNull(schoolFleet.deletedAt)))
    .limit(1)
  if (!boot) return Response.json({ error: 'Boot niet gevonden' }, { status: 404 })

  // Controleer conflicten (goedgekeurde boekingen op dezelfde boot op dezelfde dag)
  const conflicts = await db
    .select()
    .from(boatRentals)
    .where(and(
      eq(boatRentals.bootId, bootId),
      eq(boatRentals.datum, datum),
      eq(boatRentals.status, 'goedgekeurd'),
      isNull(boatRentals.deletedAt),
    ))
  if (conflicts.length > 0) {
    return Response.json({ error: 'Deze boot is al geboekt op die dag' }, { status: 409 })
  }

  const [nieuw] = await db
    .insert(boatRentals)
    .values({ schoolId, bootId, userId: session.user.id, datum, startTijd, eindTijd, opmerking: opmerking ?? null })
    .onConflictDoNothing()
    .returning()

  if (!nieuw) return Response.json({ error: 'Je hebt al een aanvraag voor deze boot op die dag' }, { status: 409 })

  return Response.json({ id: nieuw.id, status: nieuw.status }, { status: 201 })
}
