import { db } from '@/lib/db'
import { blogPosts, blogSeo, users } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function listBlogPosts(alleenGepubliceerd = false) {
  const q = db
    .select({
      id: blogPosts.id,
      titel: blogPosts.titel,
      slug: blogPosts.slug,
      excerpt: blogPosts.excerpt,
      status: blogPosts.status,
      auteurNaam: users.name,
      gepubliceerdAt: blogPosts.gepubliceerdAt,
      createdAt: blogPosts.createdAt,
      updatedAt: blogPosts.updatedAt,
    })
    .from(blogPosts)
    .leftJoin(users, eq(blogPosts.auteurId, users.id))
    .orderBy(desc(blogPosts.updatedAt))

  if (alleenGepubliceerd) {
    return (await q).filter(p => p.status === 'gepubliceerd')
  }
  return await q
}

export async function getBlogPostById(id: string) {
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id)).limit(1)
  if (!post) return null
  const [seo] = await db.select().from(blogSeo).where(eq(blogSeo.postId, id)).limit(1)
  return { post, seo: seo ?? null }
}

export async function getBlogPostBySlug(slug: string) {
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, 'gepubliceerd')))
    .limit(1)
  if (!post) return null
  const [seo] = await db.select().from(blogSeo).where(eq(blogSeo.postId, post.id)).limit(1)
  return { post, seo: seo ?? null }
}

export async function upsertBlogPost(input: {
  id?: string
  titel: string
  slug: string
  excerpt?: string
  inhoud: string
  status?: string
  auteurId?: string
}) {
  if (input.id) {
    const [updated] = await db
      .update(blogPosts)
      .set({
        titel: input.titel,
        slug: input.slug,
        excerpt: input.excerpt ?? null,
        inhoud: input.inhoud,
        status: (input.status as typeof blogPosts.$inferInsert.status) ?? 'concept',
        updatedAt: new Date(),
        gepubliceerdAt: input.status === 'gepubliceerd' ? new Date() : null,
      })
      .where(eq(blogPosts.id, input.id))
      .returning()
    return updated
  }
  const [inserted] = await db
    .insert(blogPosts)
    .values({
      titel: input.titel,
      slug: input.slug,
      excerpt: input.excerpt ?? null,
      inhoud: input.inhoud,
      status: (input.status as typeof blogPosts.$inferInsert.status) ?? 'concept',
      auteurId: input.auteurId ?? null,
      gepubliceerdAt: input.status === 'gepubliceerd' ? new Date() : null,
    })
    .returning()
  return inserted
}

export async function saveBlogSeo(input: {
  postId: string
  focusKeyword?: string
  metaDescription?: string
  readabilityScore?: number
  jsonLd?: unknown
}) {
  const [existing] = await db.select().from(blogSeo).where(eq(blogSeo.postId, input.postId)).limit(1)
  if (existing) {
    const [updated] = await db
      .update(blogSeo)
      .set({
        focusKeyword: input.focusKeyword ?? existing.focusKeyword,
        metaDescription: input.metaDescription ?? existing.metaDescription,
        readabilityScore: input.readabilityScore ?? existing.readabilityScore,
        jsonLd: input.jsonLd !== undefined ? (input.jsonLd as typeof blogSeo.$inferInsert.jsonLd) : existing.jsonLd,
        gegenereerdOp: new Date(),
      })
      .where(eq(blogSeo.postId, input.postId))
      .returning()
    return updated
  }
  const [inserted] = await db
    .insert(blogSeo)
    .values({
      postId: input.postId,
      focusKeyword: input.focusKeyword ?? null,
      metaDescription: input.metaDescription ?? null,
      readabilityScore: input.readabilityScore ?? null,
      jsonLd: (input.jsonLd as typeof blogSeo.$inferInsert.jsonLd) ?? null,
      gegenereerdOp: new Date(),
    })
    .returning()
  return inserted
}
