import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { blogPosts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { completeAi } from '@/lib/ai'
import { saveBlogSeo } from '@/lib/db/queries/blog'

// POST /api/admin/blog/[id]/ai-seo
// Genereert een SEO-pakket (titel, slug, meta, focus-keyword, JSON-LD, score).
// Retourneert JSON (geen stream).

const schema = z.object({
  titel: z.string().min(1),
  inhoud: z.string().min(1),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

    const { id } = await params
    const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1)
    if (!post) return Response.json({ error: 'Niet gevonden' }, { status: 404 })

    const body = await req.json().catch(() => ({}))
    const parsed = schema.safeParse(body)
    const titel = parsed.success ? parsed.data.titel : post.titel
    const inhoud = parsed.success ? parsed.data.inhoud : post.inhoud

    // Strip HTML naar platte tekst voor de AI
    const plain = inhoud.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 4000)

    const systemPrompt = `Je bent een senior SEO-specialist voor een Nederlandse zeilschool-website.
Analyseer het artikel en lever een optimalisatiepakket als GELDIG JSON (geen markdown, geen uitleg):
{
  "seoTitel": "string (max 60 chars, bevat focus-keyword)",
  "slug": "string (kebab-case, kleine letters, Nederlands, max 80 chars, geen stopwoorden)",
  "metaDescription": "string (max 155 chars, verleidelijk, bevat focus-keyword)",
  "focusKeyword": "string (1-3 woorden, waar het artikel om draait)",
  "internalLinks": ["string (3 suggesties voor interne links binnen vaarsamen.nl)"],
  "readabilityScore": number (0-100, Flesch-achtige score voor NL),
  "verbeterTip": "string (1 concrete tip om de SEO te verhogen)"
}
Antwoord ALLEEN met het JSON-object.`

    const userPrompt = `Titel: ${titel}

Inhoud (platte tekst):
${plain}

Lever het SEO-pakket als JSON.`

    const raw = await completeAi({ system: systemPrompt, prompt: userPrompt, maxTokens: 1200, temperature: 0.3 })

    // JSON uit de response halen (soms wrapped in markdown code-fence)
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'AI retourneerde geen geldig JSON', raw }, { status: 502 })
    }
    const seo = JSON.parse(jsonMatch[0])

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: seo.seoTitel ?? titel,
      description: seo.metaDescription ?? '',
      keywords: seo.focusKeyword ?? '',
      datePublished: post.gepubliceerdAt ?? post.createdAt,
      author: { '@type': 'Organization', name: 'VaarSamen' },
    }

    // Sla op in DB
    await saveBlogSeo({
      postId: id,
      focusKeyword: seo.focusKeyword,
      metaDescription: seo.metaDescription,
      readabilityScore: typeof seo.readabilityScore === 'number' ? seo.readabilityScore : undefined,
      jsonLd,
    })

    // Stel ook de slug voor op de post (niet overschrijven als al gepubliceerd)
    if (seo.slug && post.status !== 'gepubliceerd') {
      await db.update(blogPosts).set({ slug: seo.slug, updatedAt: new Date() }).where(eq(blogPosts.id, id))
    }

    return Response.json({ seo, jsonLd, slug: seo.slug })
  } catch (err) {
    return Response.json({ error: (err as Error).message ?? 'Onbekende fout' }, { status: 500 })
  }
}
