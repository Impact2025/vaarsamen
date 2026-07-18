import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolMessages, schoolMemberships, isStaff } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

// ─── GET /api/school/[schoolId]/berichten ────────────────────────────────────
// Staff (eigenaar/instructeur) ziet alle verstuurde berichten van deze school.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const rows = await db
    .select({
      id: schoolMessages.id,
      schoolId: schoolMessages.schoolId,
      membershipId: schoolMessages.membershipId,
      fromRole: schoolMessages.fromRole,
      titel: schoolMessages.titel,
      bericht: schoolMessages.bericht,
      gelezenOp: schoolMessages.gelezenOp,
      createdAt: schoolMessages.createdAt,
    })
    .from(schoolMessages)
    .where(and(eq(schoolMessages.schoolId, schoolId), isNull(schoolMessages.gelezenOp)))
    .orderBy(schoolMessages.createdAt)

  return Response.json({ berichten: rows })
}

// ─── POST /api/school/[schoolId]/berichten ───────────────────────────────────
// Staff stuurt een bericht naar één of meerdere leden van de school.

const CreateSchema = z.object({
  lidIds:   z.array(z.string().uuid()).min(1),
  titel:    z.string().min(1).max(120),
  bericht:  z.string().min(1).max(2000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body = await req.json().catch(() => null)
  const parsed = CreateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Ongeldige invoer' }, { status: 400 })

  const { lidIds, titel, bericht } = parsed.data

  // Controleer dat de doel-leden écht bij deze school horen (geen cross-school leak).
  const leden = await db
    .select({ id: schoolMemberships.id, schoolId: schoolMemberships.schoolId })
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      isNull(schoolMemberships.deletedAt),
    ))

  const geldigIds = new Set(leden.map(l => l.id))
  const doelen = lidIds.filter(id => geldigIds.has(id))
  if (doelen.length === 0) {
    return Response.json({ error: 'Geen geldige leden geselecteerd' }, { status: 400 })
  }

  const nieuw = await db
    .insert(schoolMessages)
    .values(doelen.map(membershipId => ({
      schoolId,
      membershipId,
      fromRole: membership.role,
      titel,
      bericht,
    })))
    .returning()

  return Response.json({ verstuurd: nieuw.length, berichten: nieuw }, { status: 201 })
}
