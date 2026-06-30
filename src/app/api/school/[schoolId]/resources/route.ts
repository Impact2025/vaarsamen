// ─── RESOURCES API ───────────────────────────────────────────────────────────────
// Multi-resource planning (boot + equipment + instructeur)

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { schoolResources, schoolFleet } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/school/[schoolId]/resources
// Lijst beschikbare resources (exclusief verloopt)
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params

  const resources = await db
    .select()
    .from(schoolResources)
    .where(eq(schoolResources.schoolId, schoolId))

  return Response.json(resources)
}

// POST /api/school/[schoolId]/resources - seed resources van fleet
export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { schoolId } = await params

  const { seedBoots } = await req.json()
  if (!seedBoots) return Response.json({ error: 'seedBoots required' }, { status: 400 })

  // Get fleet en maak resources
  const fleet = await db
    .select()
    .from(schoolFleet)
    .where(eq(schoolFleet.schoolId, schoolId))

  let created = 0
  for (const boot of fleet) {
    const name = boot.naam || `Boot #${boot.bootNummer}`
    await db
      .insert(schoolResources)
      .values({ schoolId, type: 'boot', bootId: boot.id, name, capacity: boot.capacity || 1 })
      .onConflictDoNothing()
    created++
  }

  return Response.json({ created })
}