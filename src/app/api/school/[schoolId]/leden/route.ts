import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolMemberships, users , isStaff } from '@/lib/db/schema'
import { schoolMemberSchema } from '@/lib/validations'
import { getSchoolMembership, getSchoolLeden } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'

// GET /api/school/[schoolId]/leden
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !isStaff(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const leden = await getSchoolLeden(schoolId)
  return Response.json({ leden })
}

// POST /api/school/[schoolId]/leden — lid toevoegen op e-mailadres
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const myMembership = await getSchoolMembership(schoolId, session.user.id)
  if (!myMembership || !isStaff(myMembership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schoolMemberSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  // User opzoeken op email
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.email, parsed.data.email.toLowerCase()))
    .limit(1)

  if (!user) {
    return Response.json({
      error: 'Geen VaarSamen account met dit e-mailadres. Gebruik "Uitnodigen" om deze persoon een aanmeldlink te mailen.',
      code:  'geen_account',
    }, { status: 404 })
  }

  // Controleer of al lid
  const existing = await db
    .select({ id: schoolMemberships.id, deletedAt: schoolMemberships.deletedAt })
    .from(schoolMemberships)
    .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, user.id)))
    .limit(1)

  if (existing.length > 0 && !existing[0].deletedAt) {
    return Response.json({ error: 'Deze gebruiker is al lid van deze school' }, { status: 409 })
  }

  // Reactiveer of maak nieuw
  if (existing.length > 0) {
    await db
      .update(schoolMemberships)
      .set({ role: parsed.data.role, deletedAt: null, joinedAt: new Date() })
      .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, user.id)))
  } else {
    await db.insert(schoolMemberships).values({
      schoolId: schoolId,
      userId:   user.id,
      role:     parsed.data.role,
    })
  }

  return Response.json({
    lid: { userId: user.id, naam: user.name, email: user.email, role: parsed.data.role }
  }, { status: 201 })
}

// DELETE /api/school/[schoolId]/leden?userId=... — lid verwijderen
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const myMembership = await getSchoolMembership(schoolId, session.user.id)
  if (!myMembership || myMembership.role !== 'eigenaar') {
    return Response.json({ error: 'Alleen de eigenaar mag leden verwijderen' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return Response.json({ error: 'userId vereist' }, { status: 400 })
  if (userId === session.user.id) return Response.json({ error: 'Je kunt jezelf niet verwijderen' }, { status: 400 })

  await db
    .update(schoolMemberships)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.userId, userId),
      isNull(schoolMemberships.deletedAt),
    ))

  return Response.json({ ok: true })
}
