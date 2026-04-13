import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatAvailability, schoolFleet } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, gte, lte, or } from 'drizzle-orm'
import { z } from 'zod'

const schema = z.object({
  bootId:   z.string().uuid(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dateTo:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reden:    z.string().max(300).optional(),
})

// GET /api/school/[schoolId]/vloot/beschikbaarheid?bootId=...
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const url    = new URL(req.url)
  const bootId = url.searchParams.get('bootId')

  const rows = await db
    .select()
    .from(boatAvailability)
    .where(bootId
      ? and(eq(boatAvailability.schoolId, schoolId), eq(boatAvailability.bootId, bootId))
      : eq(boatAvailability.schoolId, schoolId)
    )
    .orderBy(boatAvailability.dateFrom)

  return Response.json({ periodes: rows })
}

// POST /api/school/[schoolId]/vloot/beschikbaarheid — periode niet-beschikbaar toevoegen
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  if (parsed.data.dateFrom > parsed.data.dateTo) {
    return Response.json({ error: 'Einddatum moet na startdatum liggen' }, { status: 400 })
  }

  // Controleer dat de boot bij deze school hoort
  const [boot] = await db.select({ id: schoolFleet.id })
    .from(schoolFleet)
    .where(and(eq(schoolFleet.id, parsed.data.bootId), eq(schoolFleet.schoolId, schoolId)))
    .limit(1)
  if (!boot) return Response.json({ error: 'Boot niet gevonden' }, { status: 404 })

  const [periode] = await db
    .insert(boatAvailability)
    .values({ ...parsed.data, schoolId, createdBy: session.user.id })
    .returning()

  return Response.json({ periode }, { status: 201 })
}

// DELETE /api/school/[schoolId]/vloot/beschikbaarheid?id=...
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const url = new URL(req.url)
  const id  = url.searchParams.get('id')
  if (!id) return Response.json({ error: 'id vereist' }, { status: 400 })

  await db.delete(boatAvailability).where(
    and(eq(boatAvailability.id, id), eq(boatAvailability.schoolId, schoolId))
  )

  return Response.json({ ok: true })
}
