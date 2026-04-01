import { auth } from '@/lib/auth'
import { getSchoolMembership } from '@/lib/db/queries/school'
import { db } from '@/lib/db'
import {
  sailingSchools, schoolCourses, schoolLessons, lessonStudents,
  skillDefinitions, skillAssessments, lessonNotes, users, schoolFleet,
} from '@/lib/db/schema'
import { and, eq, isNull, asc, inArray } from 'drizzle-orm'
import { streamToController } from '@/lib/ai'

// ─── POST /api/school/[schoolId]/ai/analyse ────────────────────────────────
// Body: { studentUserId: string, courseId?: string }
// Returns: streaming text (SSE-compatible)

export async function POST(
  req: Request,
  { params }: { params: Promise<{ schoolId: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { schoolId } = await params
  const membership = await getSchoolMembership(schoolId, session.user.id)
  if (!membership || !['eigenaar', 'instructeur'].includes(membership.role)) {
    return new Response('Forbidden', { status: 403 })
  }

  const body = await req.json() as { studentUserId: string; courseId?: string }
  const { studentUserId, courseId } = body
  if (!studentUserId) return new Response('studentUserId required', { status: 400 })

  // Haal school op
  const [school] = await db
    .select()
    .from(sailingSchools)
    .where(and(eq(sailingSchools.id, schoolId), isNull(sailingSchools.deletedAt)))
    .limit(1)
  if (!school) return new Response('School niet gevonden', { status: 404 })

  // Haal cursist op
  const [cursist] = await db
    .select()
    .from(users)
    .where(eq(users.id, studentUserId))
    .limit(1)
  if (!cursist) return new Response('Cursist niet gevonden', { status: 404 })

  // Haal lessen op waar deze cursist aan meedeed (evt gefilterd op cursus)
  const studentLesRows = await db
    .select({
      lessonStudent: lessonStudents,
      les:           schoolLessons,
      course:        schoolCourses,
      bootNummer:    schoolFleet.bootNummer,
    })
    .from(lessonStudents)
    .innerJoin(schoolLessons, eq(lessonStudents.lessonId, schoolLessons.id))
    .innerJoin(schoolCourses, eq(schoolLessons.courseId, schoolCourses.id))
    .leftJoin(schoolFleet, eq(lessonStudents.bootId, schoolFleet.id))
    .where(and(
      eq(lessonStudents.studentUserId, studentUserId),
      eq(schoolLessons.schoolId, schoolId),
      isNull(schoolLessons.deletedAt),
      ...(courseId ? [eq(schoolLessons.courseId, courseId)] : []),
    ))
    .orderBy(asc(schoolLessons.datum))

  if (studentLesRows.length === 0) {
    return new Response('Geen lessen gevonden voor deze cursist', { status: 404 })
  }

  // CWO niveau uit eerste les
  const cwoLevel = studentLesRows[0].course.cwoLevel ?? 'cwo_kielboot2'

  // Vaardigheden ophalen
  const skills = await db
    .select()
    .from(skillDefinitions)
    .where(eq(skillDefinitions.cwoLevel, cwoLevel))
    .orderBy(asc(skillDefinitions.sortOrder))

  // Alle beoordelingen ophalen
  const lesIds = studentLesRows.map(r => r.les.id)
  const assessments = await db
    .select()
    .from(skillAssessments)
    .where(and(
      inArray(skillAssessments.lessonId, lesIds),
      eq(skillAssessments.studentUserId, studentUserId),
    ))

  const notes = await db
    .select()
    .from(lessonNotes)
    .where(and(
      inArray(lessonNotes.lessonId, lesIds),
      eq(lessonNotes.studentUserId, studentUserId),
    ))

  // Score map: lesId → skillId → score
  const scoreMap: Record<string, Record<string, string>> = {}
  for (const a of assessments) {
    scoreMap[a.lessonId] ??= {}
    scoreMap[a.lessonId][a.skillId] = a.score
  }
  const noteMap: Record<string, string> = {}
  for (const n of notes) noteMap[n.lessonId] = n.note

  // Bouw prompt context
  const lessenTekst = studentLesRows.map((r, i) => {
    const scoreLines = skills
      .map(skill => {
        const score = scoreMap[r.les.id]?.[skill.id]
        if (!score) return null
        const letter = score === 'aangeboden' ? 'A' : score === 'matig' ? 'M' : score === 'redelijk' ? 'R' : 'B'
        return `  ${skill.code} (${skill.naam}): ${letter}`
      })
      .filter(Boolean)
      .join('\n')

    const note = noteMap[r.les.id]
    const meta = [
      r.les.datum,
      r.lessonStudent.soloGevaren ? 'solo' : 'met begeleiding',
      r.les.windRichting ? `wind ${r.les.windRichting}` : null,
      r.les.windKracht ? `${r.les.windKracht} Bft` : null,
      r.bootNummer ? `boot ${r.bootNummer}` : null,
    ].filter(Boolean).join(', ')

    return [
      `\nLes ${i + 1} (${meta}):`,
      scoreLines || '  (geen scores)',
      note ? `  Opmerking: ${note}` : null,
    ].filter(Boolean).join('\n')
  }).join('\n')

  const systemPrompt = `Je bent een ervaren CWO kielboot instructeur die gespecialiseerd is in voortgangsanalyse voor zeilcursisten.
Je analyseert de vorderingenstaten van cursisten en geeft concrete, motiverende feedback in het Nederlands.
Je kent de CWO KB2 vaardigheidseisen en de progressie die je mag verwachten.

Gebruik de volgende scoring:
- A = Aangeboden (heeft het gezien/geprobeerd)
- M = Matig (kan het maar maakt fouten)
- R = Redelijk (kan het met kleine correcties)
- B = Beheerst (voert het zelfstandig correct uit)

De 18 KB2 vaardigheden:
${skills.map(s => `${s.code}: ${s.naam}`).join('\n')}`

  const userPrompt = `Analyseer de voortgang van cursist: ${cursist.name ?? cursist.email ?? 'onbekend'}

School: ${school.name}
CWO niveau: ${cwoLevel.replace('cwo_', 'CWO ').replace('kielboot', 'Kielboot ')}

${lessenTekst}

Geef een uitgebreide voortgangsanalyse met:
1. **Algemeen beeld** - Hoe verloopt de progressie overall?
2. **Sterke punten** - Welke vaardigheden gaan goed?
3. **Aandachtspunten** - Welke vaardigheden hebben extra oefening nodig?
4. **Patroon analyse** - Zie je trends over de lessen?
5. **Aanbevelingen** - Concrete oefentips en focuspunten voor de volgende les
6. **Diplomaprognose** - Wanneer is de cursist klaar voor het KB2 diploma op basis van de huidige progressie?

Wees concreet, gebruik de vaardigheids-codes (KB2-01 etc.) en houd de toon motiverend maar eerlijk.`

  const stream = new ReadableStream({
    async start(controller) {
      try {
        await streamToController(controller, {
          system:    systemPrompt,
          prompt:    userPrompt,
          maxTokens: 2048,
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
}
