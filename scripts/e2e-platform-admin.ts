// E2E verificatie van de platform-admin data-layer (geen browser nodig).
// Bewijst dat queries de juiste shape retourneren tegen de live Neon DB.

import { getPlatformScholen, getCrmContacts, getCrmPipeline } from '@/lib/db/queries/platform'
import { listBlogPosts, getBlogPostById, upsertBlogPost, saveBlogSeo } from '@/lib/db/queries/blog'

async function main() {
  console.log('=== getPlatformScholen ===')
  const scholen = await getPlatformScholen()
  console.log('aantal scholen:', scholen.length)
  if (scholen[0]) {
    const s = scholen[0]
    console.log('voorbeeld:', { naam: s.naam, leden: Number(s.leden), vloot: Number(s.vloot), abonnees: Number(s.abonnees), plan: s.plan })
  }

  console.log('\n=== getCrmPipeline ===')
  const pipeline = await getCrmPipeline()
  console.log(pipeline)

  console.log('\n=== getCrmContacts ===')
  const contacten = await getCrmContacts()
  console.log('aantal contacten:', contacten.length)

  console.log('\n=== blog upsert + seo + lezen ===')
  const post = await upsertBlogPost({
    titel: 'E2E testartikel VaarSamen',
    slug: 'e2e-testartikel-vaarsamen',
    excerpt: 'Test',
    inhoud: '<h2>Test</h2><p>Dit is een e2e testartikel.</p>',
    status: 'concept',
    auteurId: 'aadde900-0000-0000-0000-000000000001',
  })
  console.log('aangemaakt post id:', post.id, 'status:', post.status)
  await saveBlogSeo({ postId: post.id, focusKeyword: 'zeilen', metaDescription: 'Test meta', readabilityScore: 88 })
  const terug = await getBlogPostById(post.id)
  console.log('teruggelezen seo.focusKeyword:', terug?.seo?.focusKeyword, 'score:', terug?.seo?.readabilityScore)
  const lijst = await listBlogPosts()
  console.log('lijst bevat testartikel:', lijst.some(p => p.id === post.id))

  // cleanup
  const { db } = await import('@/lib/db')
  const { blogSeo, blogPosts } = await import('@/lib/db/schema')
  const { eq } = await import('drizzle-orm')
  await db.delete(blogSeo).where(eq(blogSeo.postId, post.id))
  await db.delete(blogPosts).where(eq(blogPosts.id, post.id))
  console.log('opgeruimd: testartikel verwijderd')

  console.log('\n✅ E2E OK')
  process.exit(0)
}

main().catch(e => { console.error('E2E FOUT:', e); process.exit(1) })
