import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { skillDefinitions, schoolCourses } from '@/lib/db/schema'
import { eq, and, isNull, asc } from 'drizzle-orm'
import type { BoatType } from '@/types'

// GET /api/school/[schoolId]/nwd/vaardigheden?bootType=valk
// Retourneert vaardigheden voor een specifiek boottype (NWD)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const url = new URL(req.url)
  const bootType = url.searchParams.get('bootType') as BoatType | null

  if (!bootType) {
    return Response.json({ error: 'bootType query param vereist' }, { status: 400 })
  }

  // Haal alle NWD-vaardigheden voor dit boottype
  const skills = await db
    .select()
    .from(skillDefinitions)
    .where(and(
      eq(skillDefinitions.bootType, bootType),
      isNull(skillDefinitions.cwoLevel),
    ))
    .orderBy(asc(skillDefinitions.sortOrder))

  return Response.json({ skills })
}