import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { blogPosts, blogSeo } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { getBlogPostById, saveBlogSeo } from '@/lib/db/queries/blog'

// GET /api/admin/blog/[id] — detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })
  const { id } = await params
  const data = await getBlogPostById(id)
  if (!data) return Response.json({ error: 'Niet gevonden' }, { status: 404 })
  return Response.json(data)
}

// PATCH /api/admin/blog/[id] — velden + SEO bijwerken
const patchSchema = z.object({
  titel: z.string().min(1).optional(),
  slug: z.string().min(1).max(120).optional(),
  excerpt: z.string().optional(),
  inhoud: z.string().optional(),
  status: z.enum(['concept', 'gepubliceerd']).optional(),
  seo: z.object({
    focusKeyword: z.string().optional(),
    metaDescription: z.string().optional(),
    readabilityScore: z.number().optional(),
    jsonLd: z.unknown().optional(),
  }).optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })
  const { id } = await params

  const body = await req.json().catch(() => ({}))
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const { seo, ...fields } = parsed.data
  const set: Record<string, unknown> = {}
  if (fields.titel !== undefined) set.titel = fields.titel
  if (fields.slug !== undefined) set.slug = fields.slug
  if (fields.excerpt !== undefined) set.excerpt = fields.excerpt
  if (fields.inhoud !== undefined) set.inhoud = fields.inhoud
  if (fields.status !== undefined) {
    set.status = fields.status
    set.gepubliceerdAt = fields.status === 'gepubliceerd' ? new Date() : null
  }
  set.updatedAt = new Date()

  if (Object.keys(set).length > 0) {
    await db.update(blogPosts).set(set).where(eq(blogPosts.id, id))
  }
  if (seo) {
    await saveBlogSeo({ postId: id, ...seo })
  }
  const data = await getBlogPostById(id)
  return Response.json(data)
}

// DELETE /api/admin/blog/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })
  const { id } = await params
  await db.delete(blogSeo).where(eq(blogSeo.postId, id))
  await db.delete(blogPosts).where(eq(blogPosts.id, id))
  return Response.json({ ok: true })
}
