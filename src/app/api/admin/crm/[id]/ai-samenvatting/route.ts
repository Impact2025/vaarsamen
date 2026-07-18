import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { crmNotes } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { streamToController } from '@/lib/ai'

// POST /api/admin/crm/[id]/ai-samenvatting
// Body: { type?: 'contact' | 'membership', id: string }
// Genereert een AI-samenvatting van alle CRM-notities voor een contact/lid (streaming).

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

    const { id } = await params
    const body = await req.json().catch(() => ({}))

    // Haal notities op voor deze membership (of contact)
    const notities = await db
      .select({ kanaal: crmNotes.kanaal, inhoud: crmNotes.inhoud, createdAt: crmNotes.createdAt })
      .from(crmNotes)
      .where(eq(crmNotes.membershipId, id))
      .orderBy(desc(crmNotes.createdAt))
      .limit(40)

    if (notities.length === 0) {
      return Response.json({ error: 'Geen CRM-notities gevonden voor dit contact' }, { status: 404 })
    }

    const notitieTekst = notities
      .map(n => `• [${n.kanaal}] ${n.inhoud}`)
      .join('\n')

    const systemPrompt = `Je bent een ervaren CRM-assistent voor een zeilschool-platform.
Je maakt een korte, objectieve samenvatting van de relatiegeschiedenis met een contactpersoon.
Schrijf in het Nederlands, maximaal 150 woorden. Gebruik bullet-points:
- Laatste contact & inhoud
- Sentiment (positief / neutraal / negatief)
- Open acties / aandachtspunten
- Kans op conversie (laag / gemiddeld / hoog) + reden`

    const userPrompt = `Hier zijn de CRM-notities van deze contactpersoon:

${notitieTekst}

Geef de samenvatting zoals beschreven.`

    const stream = new ReadableStream({
      async start(controller) {
        try {
          await streamToController(controller, { system: systemPrompt, prompt: userPrompt, maxTokens: 800 })
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
