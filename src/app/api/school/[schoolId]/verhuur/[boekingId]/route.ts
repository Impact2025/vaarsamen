import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatRentals } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'

// ─── PATCH /api/school/[schoolId]/verhuur/[boekingId] ────────────────────────
// Eigenaar/instructeur: status bijwerken (goedkeuren/afwijzen)
// Cursist: eigen boeking annuleren (status → geannuleerd)

const PatchSchema = z.object({
  status:  z.enum(['goedgekeurd', 'afgewezen', 'geannuleerd']),
  reactie: z.string().max(500).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; boekingId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId, boekingId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const [boeking] = await db
    .select()
    .from(boatRentals)
    .where(and(eq(boatRentals.id, boekingId), eq(boatRentals.schoolId, schoolId), isNull(boatRentals.deletedAt)))
    .limit(1)

  if (!boeking) return Response.json({ error: 'Boeking niet gevonden' }, { status: 404 })

  const body = await req.json()
  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Ongeldige invoer' }, { status: 400 })

  const { status, reactie } = parsed.data
  const isStaff = ['eigenaar', 'instructeur'].includes(membership.role)
  const isOwner = boeking.userId === session.user.id

  // Cursist mag alleen eigen boeking annuleren
  if (!isStaff && !(isOwner && status === 'geannuleerd')) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  // Eigenaar/instructeur mag niet annuleren via dit endpoint (dat doet DELETE)
  if (isStaff && status === 'geannuleerd' && !isOwner) {
    return Response.json({ error: 'Gebruik DELETE om een boeking te verwijderen' }, { status: 400 })
  }

  await db
    .update(boatRentals)
    .set({
      status,
      reactie:       reactie ?? boeking.reactie,
      beoordeeldDoor: isStaff ? session.user.id : boeking.beoordeeldDoor,
      updatedAt:     new Date(),
    })
    .where(eq(boatRentals.id, boekingId))

  return Response.json({ ok: true, status })
}

// ─── DELETE /api/school/[schoolId]/verhuur/[boekingId] ───────────────────────
// Eigenaar/instructeur: verwijder boeking (soft-delete)

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; boekingId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId, boekingId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !['eigenaar', 'instructeur'].includes(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  await db
    .update(boatRentals)
    .set({ deletedAt: new Date() })
    .where(and(eq(boatRentals.id, boekingId), eq(boatRentals.schoolId, schoolId)))

  return Response.json({ ok: true })
}
