import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolInvites, schoolMemberships, sailingSchools, isStaff } from '@/lib/db/schema'
import { and, eq, isNull, sql } from 'drizzle-orm'

// ─── GET /api/school/join?token=xxx ───────────────────────────────────────
// Haal info op over een uitnodigingslink (schoolnaam, rol, geldigheid)
// Geen auth vereist — public endpoint voor de join-pagina

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return Response.json({ error: 'token ontbreekt' }, { status: 400 })

  const [invite] = await db
    .select({
      invite: schoolInvites,
      school: sailingSchools,
    })
    .from(schoolInvites)
    .innerJoin(sailingSchools, eq(schoolInvites.schoolId, sailingSchools.id))
    .where(and(
      eq(schoolInvites.token, token),
      isNull(schoolInvites.deletedAt),
      isNull(sailingSchools.deletedAt),
    ))
    .limit(1)

  if (!invite) return Response.json({ error: 'Uitnodiging niet gevonden of verlopen' }, { status: 404 })

  // Controleer vervaldatum
  if (invite.invite.expiresAt && invite.invite.expiresAt < new Date()) {
    return Response.json({ error: 'Deze uitnodigingslink is verlopen' }, { status: 410 })
  }

  // Controleer max uses
  if (
    invite.invite.maxUses !== null &&
    invite.invite.usedCount >= invite.invite.maxUses
  ) {
    return Response.json({ error: 'Deze uitnodigingslink is al vol gebruikt' }, { status: 410 })
  }

  return Response.json({
    school: { id: invite.school.id, name: invite.school.name, city: invite.school.city },
    role:   invite.invite.role,
    label:  invite.invite.label,
  })
}

// ─── POST /api/school/join ────────────────────────────────────────────────
// Ingelogde gebruiker accepteert een uitnodiging
// Body: { token: string }

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { token } = await req.json() as { token: string }
  if (!token) return Response.json({ error: 'token ontbreekt' }, { status: 400 })

  // Haal uitnodiging op met school
  const [invite] = await db
    .select({
      invite: schoolInvites,
      school: sailingSchools,
    })
    .from(schoolInvites)
    .innerJoin(sailingSchools, eq(schoolInvites.schoolId, sailingSchools.id))
    .where(and(
      eq(schoolInvites.token, token),
      isNull(schoolInvites.deletedAt),
      isNull(sailingSchools.deletedAt),
    ))
    .limit(1)

  if (!invite) return Response.json({ error: 'Uitnodiging niet gevonden' }, { status: 404 })

  if (invite.invite.expiresAt && invite.invite.expiresAt < new Date()) {
    return Response.json({ error: 'Deze uitnodigingslink is verlopen' }, { status: 410 })
  }

  if (
    invite.invite.maxUses !== null &&
    invite.invite.usedCount >= invite.invite.maxUses
  ) {
    return Response.json({ error: 'Deze uitnodigingslink is al vol gebruikt' }, { status: 410 })
  }

  const schoolId = invite.school.id
  const role     = invite.invite.role

  // Check of user al lid is (buiten transactie — read-only check)
  const [existing] = await db
    .select()
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.userId, session.user.id),
    ))
    .limit(1)

  if (existing && !existing.deletedAt) {
    return Response.json({ alreadyMember: true, schoolId, role: existing.role })
  }

  // Een gedeelde link kan doorgestuurd of publiek geplakt worden. Wie er via
  // binnenkomt moet daarom eerst goedgekeurd worden voordat hij mag huren.
  // Staff valt daarbuiten: die rol koos de eigenaar zelf bij het maken van de link,
  // en staff wordt sowieso niet door de verhuurpoort tegengehouden.
  const startStatus = isStaff(role) ? 'goedgekeurd' as const : 'wacht_op_goedkeuring' as const

  // Transactie: membership upsert + atomisch usedCount increment (race-condition-safe)
  try {
    await db.transaction(async (tx) => {
      if (existing && existing.deletedAt) {
        await tx
          .update(schoolMemberships)
          .set({ role, deletedAt: null, joinedAt: new Date(), status: startStatus })
          .where(eq(schoolMemberships.id, existing.id))
      } else {
        await tx.insert(schoolMemberships).values({
          schoolId,
          userId: session.user.id,
          role,
          status: startStatus,
        })
      }

      // Atomisch increment: UPDATE ... WHERE (max_uses IS NULL OR used_count < max_uses)
      // Als 0 rijen geüpdatet → limiet bereikt → rollback via throw
      const updated = await tx
        .update(schoolInvites)
        .set({ usedCount: sql`used_count + 1` })
        .where(and(
          eq(schoolInvites.id, invite.invite.id),
          invite.invite.maxUses !== null
            ? sql`used_count < ${invite.invite.maxUses}`
            : sql`true`,
        ))
        .returning({ id: schoolInvites.id })

      if (updated.length === 0) {
        throw new Error('INVITE_FULL')
      }
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'INVITE_FULL') {
      return Response.json({ error: 'Deze uitnodigingslink is al vol gebruikt' }, { status: 410 })
    }
    throw err
  }

  return Response.json({ schoolId, role })
}
