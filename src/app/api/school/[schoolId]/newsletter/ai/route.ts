import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sailingSchools, schoolMemberships } from '@/lib/db/schema'
import { eq, and, isNull, count } from 'drizzle-orm'
import { z } from 'zod'
import { streamToController } from '@/lib/ai'

// POST /api/school/[schoolId]/newsletter/ai
// Body: { context: string } — genereert onderwerp + opening + A/B-variant (streaming).

const schema = z.object({
  context: z.string().min(1).max(2000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

    const { schoolId } = await params
    const membership = await db
      .select({ role: schoolMemberships.role })
      .from(schoolMemberships)
      .where(and(eq(schoolMemberships.schoolId, schoolId), eq(schoolMemberships.userId, session.user.id), isNull(schoolMemberships.deletedAt)))
      .limit(1)
    const isStaff = membership[0] && ['eigenaar', 'instructeur'].includes(membership[0].role)
    if (!isStaff) return Response.json({ error: 'Geen toegang' }, { status: 403 })

    const [school] = await db.select({ name: sailingSchools.name }).from(sailingSchools).where(eq(sailingSchools.id, schoolId)).limit(1)
    if (!school) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    if (!parsed.success) return Response.json({ error: 'Ongeldige invoer' }, { status: 400 })

    const systemPrompt = `Je bent een Nederlandse e-mailcopywriter voor zeilscholen.
Schrijf een wervende nieuwsbrief-opening in de huisstijl van de school.
Geef de output als volgt (gebruik de exacte labels):
ONDERWERP: <onderwerp maximaal 60 tekens>
A/B-ONDERWERP: <alternatief voor A/B-test, maximaal 60 tekens>
BODY:
<opening van de mail, 80-140 woorden, vriendelijk en uitnodigend, in het Nederlands>`

    const userPrompt = `School: ${school.name}
Context / boodschap van de school: ${parsed.data.context}

Schrijf de nieuwsbrief-inhoud hierboven op basis van de context.`

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamToController(controller, { system: systemPrompt, prompt: userPrompt, maxTokens: 700 })
          controller.close()
        } catch (err) {
          controller.error(err)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    return Response.json({ error: (err as Error).message ?? 'Onbekende fout' }, { status: 500 })
  }
}
