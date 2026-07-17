import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { crmNotes, schoolMemberships } from '@/lib/db/schema'
import { getSchoolMembership, getCrmNotes } from '@/lib/db/queries/school'
import { crmNoteSchema } from '@/lib/validations'
import { eq, and, isNull } from 'drizzle-orm'

// GET /api/school/[schoolId]/crm/notes?membershipId=... — contactgeschiedenis van een lid
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const membershipId = searchParams.get('membershipId')
  const userId = searchParams.get('userId')

  let resolvedMembershipId = membershipId
  if (!resolvedMembershipId && userId) {
    const [m] = await db
      .select({ id: schoolMemberships.id })
      .from(schoolMemberships)
      .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, userId), isNull(schoolMemberships.deletedAt)))
      .limit(1)
    resolvedMembershipId = m?.id ?? null
  }

  if (!resolvedMembershipId) return Response.json({ error: 'membershipId of userId vereist' }, { status: 400 })

  const [m] = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(and(eq(schoolMemberships.id, resolvedMembershipId), eq(schoolMemberships.schoolId, schoolId), isNull(schoolMemberships.deletedAt)))
    .limit(1)
  if (!m) return Response.json({ error: 'Lid niet gevonden' }, { status: 404 })

  const notes = await getCrmNotes(resolvedMembershipId)
  return Response.json({ notes })
}

// POST /api/school/[schoolId]/crm/notes — contactnotitie toevoegen
// Body: { membershipId, kanaal, inhoud }
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = crmNoteSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const membershipId = body?.membershipId
  const userId = body?.userId
  let resolvedMembershipId = membershipId
  if (!resolvedMembershipId && userId) {
    const [m] = await db
      .select({ id: schoolMemberships.id })
      .from(schoolMemberships)
      .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, userId), isNull(schoolMemberships.deletedAt)))
      .limit(1)
    resolvedMembershipId = m?.id ?? null
  }
  if (!resolvedMembershipId) return Response.json({ error: 'membershipId of userId vereist' }, { status: 400 })

  const [m] = await db
    .select({ id: schoolMemberships.id })
    .from(schoolMemberships)
    .where(and(eq(schoolMemberships.id, resolvedMembershipId), eq(schoolMemberships.schoolId, schoolId), isNull(schoolMemberships.deletedAt)))
    .limit(1)
  if (!m) return Response.json({ error: 'Lid niet gevonden' }, { status: 404 })

  const [note] = await db.insert(crmNotes).values({
    schoolId,
    membershipId: resolvedMembershipId,
    auteurId: session.user.id,
    kanaal: parsed.data.kanaal,
    inhoud: parsed.data.inhoud,
  }).returning()

  // LaatstContact bijwerken op het lid
  await db.update(schoolMemberships)
    .set({ laatstContact: new Date() })
    .where(eq(schoolMemberships.id, membershipId))

  return Response.json({ note }, { status: 201 })
}
