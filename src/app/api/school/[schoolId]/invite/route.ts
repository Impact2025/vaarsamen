import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolInvites, schoolMemberships } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

// ─── GET /api/school/[schoolId]/invite ────────────────────────────────────
// Haal alle actieve uitnodigingslinks op voor deze school

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params

  const [membership] = await db
    .select()
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.userId, session.user.id),
      isNull(schoolMemberships.deletedAt),
    ))
    .limit(1)

  if (!membership || !['eigenaar', 'instructeur'].includes(membership.role)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const invites = await db
    .select()
    .from(schoolInvites)
    .where(and(
      eq(schoolInvites.schoolId, schoolId),
      isNull(schoolInvites.deletedAt),
    ))
    .orderBy(schoolInvites.createdAt)

  return Response.json({ invites })
}

// ─── POST /api/school/[schoolId]/invite ───────────────────────────────────
// Maak een nieuwe uitnodigingslink aan
// Body: { role: 'cursist' | 'instructeur', label?: string, maxUses?: number, expiresInDays?: number }

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params

  const [membership] = await db
    .select()
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.userId, session.user.id),
      isNull(schoolMemberships.deletedAt),
    ))
    .limit(1)

  if (!membership || membership.role !== 'eigenaar') {
    return Response.json({ error: 'Forbidden — alleen eigenaar kan uitnodigingen aanmaken' }, { status: 403 })
  }

  const body = await req.json() as {
    role?: string
    label?: string
    maxUses?: number
    expiresInDays?: number
  }

  const role = (['cursist', 'instructeur'].includes(body.role ?? '') ? body.role : 'cursist') as 'cursist' | 'instructeur'

  // Genereer een leesbaar token (8 alfanumerieke tekens)
  const token = Array.from(crypto.getRandomValues(new Uint8Array(6)))
    .map(b => '23456789abcdefghjkmnpqrstuvwxyz'[b % 31])
    .join('')

  const expiresAt = body.expiresInDays
    ? new Date(Date.now() + body.expiresInDays * 86_400_000)
    : null

  const [invite] = await db
    .insert(schoolInvites)
    .values({
      schoolId,
      token,
      role,
      label:     body.label?.trim() || null,
      maxUses:   body.maxUses ?? null,
      expiresAt: expiresAt ?? undefined,
      createdBy: session.user.id,
    })
    .returning()

  return Response.json({ invite }, { status: 201 })
}

// ─── DELETE /api/school/[schoolId]/invite?token=xxx ───────────────────────
// Verwijder (deactiveer) een uitnodigingslink

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const { searchParams } = new URL(req.url)
  const token = searchParams.get('token')
  if (!token) return Response.json({ error: 'token vereist' }, { status: 400 })

  const [membership] = await db
    .select()
    .from(schoolMemberships)
    .where(and(
      eq(schoolMemberships.schoolId, schoolId),
      eq(schoolMemberships.userId, session.user.id),
      isNull(schoolMemberships.deletedAt),
    ))
    .limit(1)

  if (!membership || membership.role !== 'eigenaar') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  await db
    .update(schoolInvites)
    .set({ deletedAt: new Date() })
    .where(and(
      eq(schoolInvites.schoolId, schoolId),
      eq(schoolInvites.token, token),
    ))

  return Response.json({ ok: true })
}
