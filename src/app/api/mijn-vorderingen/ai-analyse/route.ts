import { auth } from '@/lib/auth'
import { getMijnVorderingen } from '@/lib/db/queries/school'
import { streamToController } from '@/lib/ai'

// ─── POST /api/mijn-vorderingen/ai-analyse ────────────────────────────────
// Body: { schoolId?: string }
// Cursist vraagt een AI analyse van zijn eigen vorderingen op

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return new Response('Unauthorized', { status: 401 })

  const { schoolId } = await req.json() as { schoolId?: string }

  const vorderingenList = await getMijnVorderingen(session.user.id, schoolId)
  if (vorderingenList.length === 0) {
    return new Response('Geen vorderingen gevonden', { status: 404 })
  }

  // Neem de eerste (of enige) vorderingen set
  const v = vorderingenList[0]
  const { school, course, skills, lessen } = v

  const lessenTekst = lessen.map((les, i) => {
    const scoreLines = skills
      .map(skill => {
        const score = les.scores[skill.id]
        if (!score) return null
        const letter = score === 'aangeboden' ? 'A' : score === 'matig' ? 'M' : score === 'redelijk' ? 'R' : 'B'
        return `  ${skill.code} (${skill.naam}): ${letter}`
      })
      .filter(Boolean)
      .join('\n')

    const meta = [
      les.datum,
      les.soloGevaren ? 'solo' : 'met begeleiding',
      les.windRichting ? `${les.windRichting}` : null,
      les.windKracht ? `${les.windKracht} Bft` : null,
      les.bootNummer ? `boot ${les.bootNummer}` : null,
    ].filter(Boolean).join(', ')

    return [
      `\nLes ${i + 1} (${meta}):`,
      scoreLines || '  (geen scores)',
      les.note ? `  Opmerking instructeur: ${les.note}` : null,
    ].filter(Boolean).join('\n')
  }).join('\n')

  const systemPrompt = `Je bent een motiverende zeilcoach die cursisten helpt begrijpen waar ze staan in hun CWO opleiding en wat ze kunnen doen om te verbeteren.
Je toon is positief, concreet en aanmoedigend. Je schrijft in het Nederlands voor de cursist zelf.

KB2 scoring: A=Aangeboden, M=Matig, R=Redelijk, B=Beheerst`

  const userPrompt = `Hier zijn mijn voortgangsgegevens van de CWO KB2 zeilcursus bij ${school.name}:

Cursus: ${course.name}
Aantal lessen gevolgd: ${lessen.length}

Vaardigheden:
${skills.map(s => `${s.code}: ${s.naam}`).join('\n')}

${lessenTekst}

Geef mij als cursist een persoonlijke analyse van mijn voortgang:

1. **Hoe gaat het?** - Kort en eerlijk overzicht
2. **Dit kan ik al goed!** - Mijn sterke punten
3. **Hieraan moet ik werken** - Aandachtspunten
4. **Praktische tips** - Wat kan ik zelf doen om sneller te verbeteren?
5. **Wanneer kan ik diploma aanvragen?** - Realistisch beeld

Schrijf alsof je me na de les even apart neemt. Motiverend maar eerlijk.`

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
}
