import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { certificates, schoolCourses, schoolLessons, skillAssessments, lessonStudents, skillDefinitions } from '@/lib/db/schema'
import { eq, and, isNull, inArray, asc } from 'drizzle-orm'
import { put } from '@vercel/blob'
import { z } from 'zod'

// GET /api/certificaat?mijn=cursusId - mijn certificaten
// GET /api/certificaat/[certId] - download link ophalen
export async function GET(
  req: Request,
  { params }: { params: Promise<{ certId?: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { certId } = await params
  const url = new URL(req.url)
  const cursusId = url.searchParams.get('cursusId')

  if (certId) {
    // Download endpoint - redirect naar blob
    const [cert] = await db
      .select()
      .from(certificates)
      .where(eq(certificates.id, certId))
      .limit(1)

    if (!cert) return Response.json({ error: 'Certificaat niet gevonden' }, { status: 404 })
    // TODO: check ownership

    return Response.json({ downloadUrl: cert.downloadUrl })
  }

  if (cursusId) {
    // Certificaten voor een cursus
    const certs = await db
      .select()
      .from(certificates)
      .where(eq(certificates.courseId, cursusId))

    return Response.json({ certificaten: certs })
  }

  return Response.json({ error: 'certId of cursusId vereist' }, { status: 400 })
}

// POST /api/certificaat - genereer certificaat
const certSchema = z.object({
  courseId: z.string().uuid(),
  type: z.enum(['cwo', 'nwd', 'zeezegels']),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const body = await req.json()
  const parsed = certSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { courseId, type } = parsed.data

  // Haal cursusdata + student data
  const [course] = await db
    .select()
    .from(schoolCourses)
    .where(eq(schoolCourses.id, courseId))
    .limit(1)

  if (!course) return Response.json({ error: 'Cursus niet gevonden' }, { status: 404 })

  // Vaardigheden voor dit niveau/boottype
  const skills = await db
    .select()
    .from(skillDefinitions)
    .where(and(
      eq(skillDefinitions.cwoLevel, course.cwoLevel ?? 'cwo_kielboot2'),
      isNull(skillDefinitions.bootType),
    ))
    .orderBy(asc(skillDefinitions.sortOrder))

  // Genereer SVG certificaat (simplified)
  const svgContent = `
<svg width="800" height="600" viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="600" fill="#071325"/>
  <text x="400" y="100" font-family="Inter" font-size="32" fill="#46f1c5" text-anchor="middle">VaarSamen Certificaat</text>
  <text x="400" y="180" font-family="Inter" font-size="20" fill="#d7e3fc" text-anchor="middle">Niveau: ${course.cwoLevel?.toUpperCase().replace('_', ' ')}</text>
  <text x="400" y="240" font-family="Inter" font-size="16" fill="#d7e3fc" text-anchor="middle">Cursus: ${course.name}</text>
  <rect x="100" y="300" width="600" height="200" fill="none" stroke="#46f1c5" stroke-width="2" rx="10"/>
  <text x="400" y="360" font-family="Inter" font-size="14" fill="#d7e3fc" text-anchor="middle">Vaardigheden beheerst: ${skills.length}</text>
  <text x="400" y="400" font-family="Inter" font-size="12" fill="#aaa" text-anchor="middle">Geüpload op ${new Date().toLocaleDateString()}</text>
  <text x="400" y="500" font-family="Inter" font-size="14" fill="#46f1c5" text-anchor="middle">Digitale handtekening: VaarSamen Watersport Platform</text>
</svg>`

  // Upload naar Vercel Blob
  const blob = await put(`certificaten/${session.user.id}/${courseId}.svg`, svgContent, {
    access: 'public',
    contentType: 'image/svg+xml',
  })

  // Sla metadata op
  const [cert] = await db
    .insert(certificates)
    .values({
      userId: session.user.id,
      schoolId: course.schoolId,
      courseId: courseId,
      type,
      level: course.cwoLevel ?? 'cwo_kielboot2',
      blobKey: blob.pathname, // Vercel Blob gebruikt pathname
      downloadUrl: blob.url,
      payload: {
        student: session.user.name,
        course: course.name,
        skillsCount: skills.length,
        issuedAt: new Date().toISOString(),
      },
    })
    .returning()

  return Response.json({ certificaat: cert, downloadUrl: blob.url })
}