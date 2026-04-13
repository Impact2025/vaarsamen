import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { boatIssues } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSchema = z.object({
  status:     z.enum(['gemeld', 'in_behandeling', 'besteld', 'gerepareerd', 'gesloten']).optional(),
  prioriteit: z.enum(['laag', 'normaal', 'hoog', 'urgent']).optional(),
  internNote: z.string().max(2000).optional(),
})

// PATCH /api/school/[schoolId]/meldingen/[id] — status of notitie bijwerken
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ schoolId: string; id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId, id } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const body   = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

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

  if (!melding) return Response.json({ error: 'Melding niet gevonden' }, { status: 404 })
  return Response.json({ melding })
}
