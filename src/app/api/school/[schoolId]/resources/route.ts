// ─── RESOURCES API ───────────────────────────────────────────────────────────────
// Multi-resource planning (boot + equipment + instructeur)

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolResources, schoolFleet, users } from '@/lib/db/schema'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { and, eq, isNull, sql } from 'drizzle-orm'
import { z } from 'zod'

// Resource seeding - maak resources van bestaande boten
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || membership.role === 'cursist') return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const SeedSchema = z.object({
    seedBoots:      z.boolean().default(true),
    seedInstructeurs: z.boolean().default(true),
  })

  const parsed = SeedSchema.safeParse(await req.json())
  if (!parsed.success) return Response.json({ error: 'Invalid input' }, { status: 400 })

  const { seedBoots, seedInstructeurs } = parsed.data
  const created: string[] = []

  // Seed existing fleet as resources
  if (seedBoots) {
    const fleet = await db
      .select({ id: schoolFleet.id, naam: schoolFleet.naam, bootNummer: schoolFleet.bootNummer, capacity: schoolFleet.capacity })
      .from(schoolFleet)
      .where(and(eq(schoolFleet.schoolId, schoolId), isNull(schoolFleet.deletedAt)))

    for (const boot of fleet) {
      const name = boot.naam || `Boot #${boot.bootNummer}`
      const [resource] = await db
        .insert(schoolResources)
        .values({
          schoolId,
          type: 'boot',
          bootId: boot.id,
          name,
          capacity: boot.capacity || 1,
        })
        .onConflictDoNothing({ target: [schoolResources.bootId] })
        .returning()
      if (resource) created.push(resource.id)
    }
  }

  // Seed instructeurs as resources
  if (seedInstructeurs) {
    const instructeurs = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .innerJoin(
        sql`school_memberships`,
        eq(sql`school_memberships.user_id`, users.id)
      )
      .where(and(
        eq(sql`school_memberships.school_id`, schoolId),
        eq(sql`school_memberships.role`, 'instructeur')
      ))

    for (const inst of instructeurs) {
      const name = inst.name || 'Instructeur'
      const [resource] = await db
        .insert(schoolResources)
        .values({
          schoolId,
          type: 'instructeur',
          userId: inst.id,
          name,
          capacity: 1,
        })
        .onConflictDoNothing({ target: [schoolResources.userId] })
        .returning()
      if (resource) created.push(resource.id)
    }
  }

  return Response.json({ created: created.length, resourceIds: created })
}