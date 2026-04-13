import { auth } from '@/lib/auth'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { getLesDetail } from '@/lib/db/queries/school'
import { db } from '@/lib/db'
import { sailingSchools } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { streamToController } from '@/lib/ai'

// ─── POST /api/school/[schoolId]/ai/lesvoorbereiding ───────────────────────
// Body: { lesId: string }
// Genereert een instructeur-brief voor de aankomende les op basis van
// de vorderingen van de ingeschreven cursisten.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  try {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !['eigenaar', 'instructeur'].includes(membership.role)) {
    return Response.json({ error: 'Geen toegang' }, { status: 403 })
  }

  const { lesId } = await req.json() as { lesId: string }
  if (!lesId) return Response.json({ error: 'lesId vereist' }, { status: 400 })

  const [school] = await db
    .select()
    .from(sailingSchools)
    .where(and(eq(sailingSchools.id, schoolId), isNull(sailingSchools.deletedAt)))
    .limit(1)
  if (!school) return Response.json({ error: 'School niet gevonden' }, { status: 404 })

  const lesDetail = await getLesDetail(lesId)
  if (!lesDetail) return Response.json({ error: 'Les niet gevonden' }, { status: 404 })
  if (lesDetail.les.schoolId !== schoolId) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { les, skills, students } = lesDetail

  // Bouw context per cursist
  const cursistenContext = students.map(student => {
    const scoreLines = skills
      .map(skill => {
        const score = student.scores[skill.id]
        if (!score) return null
        const letter = score === 'aangeboden' ? 'A' : score === 'matig' ? 'M' : score === 'redelijk' ? 'R' : 'B'
        return `  ${skill.code}: ${letter}`
      })
      .filter(Boolean)
      .join('\n')

    return [
      `Cursist: ${student.naam ?? 'Onbekend'}`,
      `Boot: ${student.bootNummer ?? 'nog niet toegewezen'}`,
      `Solo: ${student.soloGevaren ? 'ja' : 'nee'}`,
      scoreLines ? `Scores tot nu toe:\n${scoreLines}` : 'Nog geen scores geregistreerd',
      student.note ? `Opmerking vorige les: ${student.note}` : null,
    ].filter(Boolean).join('\n')
  }).join('\n\n---\n\n')

  const meta = [
    `Datum: ${les.datum}`,
    les.windRichting ? `Verwachte wind: ${les.windRichting}` : null,
    les.windKracht ? `Windkracht: ${les.windKracht} Bft` : null,
  ].filter(Boolean).join('\n')

  const systemPrompt = `Je bent een ervaren CWO kielboot hoofdinstructeur. Je helpt instructeurs om hun lessen optimaal voor te bereiden op basis van de vorderingen van hun cursisten.

Je geeft praktische, concrete adviezen die direct toepasbaar zijn op het water. Je kent alle KB2 vaardigheidseisen en weet welke oefeningen effectief zijn voor elk niveau.

Scoring: A=Aangeboden, M=Matig, R=Redelijk, B=Beheerst`

  const userPrompt = `Bereid de volgende les voor bij ${school.name}:

${meta}
Aantal cursisten: ${students.length}
CWO niveau: ${les.course.cwoLevel?.replace('cwo_', 'CWO ').replace('kielboot', 'Kielboot ') ?? 'KB2'}

## Cursisten en hun stand van zaken:

${cursistenContext || 'Geen cursisten ingeschreven'}

Geef een complete lesvoorbereiding met:

1. **Lesdoelen** - Wat wil je vandaag bereiken per cursist/groep?
2. **Differentiatie** - Hoe pak je de verschillende niveaus aan?
3. **Oefenprogramma** - Welke specifieke oefeningen, in welke volgorde?
4. **Veiligheidspunten** - Wat moet je extra in de gaten houden?
5. **Succescriteria** - Wanneer is de les geslaagd?
6. **Tijdsindeling** - Indicatieve tijdplanning voor ${students.length > 0 ? students.length : 'de'} cursist${students.length !== 1 ? 'en' : ''}

Wees specifiek en praktisch. Verwijs naar KB2-codes waar relevant.`

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamToController(controller, {
          system:    systemPrompt,
          prompt:    userPrompt,
          maxTokens: 1500,
        })
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
