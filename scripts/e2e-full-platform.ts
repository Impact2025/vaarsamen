// Volledige e2e voor de platform-admin + blog + CRM data-layer.
import { getPlatformScholen, getCrmContacts, getCrmPipeline } from '@/lib/db/queries/platform'
import { listBlogPosts, getBlogPostBySlug, getBlogPostById } from '@/lib/db/queries/blog'

const SLUG = 'zo-wordt-je-zeilschool-een-magneet-voor-nieuwe-leden'

async function main() {
  console.log('=== Platform scholen ===')
  const scholen = await getPlatformScholen()
  console.log('aantal:', scholen.length, '| voorbeeld:', scholen[0]?.naam, '| leden:', Number(scholen[0]?.leden))

  console.log('\n=== CRM pipeline ===')
  const pipe = await getCrmPipeline()
  console.log(pipe)

  console.log('\n=== CRM contacten (alle) ===')
  const c = await getCrmContacts()
  console.log('aantal:', c.length)

  console.log('\n=== Blog (gepubliceerd) ===')
  const posts = await listBlogPosts(true)
  console.log('gepubliceerd:', posts.length, '| eerste:', posts[0]?.titel)

  console.log('\n=== Blog by slug ===')
  const bySlug = await getBlogPostBySlug(SLUG)
  console.log('gevonden:', !!bySlug, '| seo.focusKeyword:', bySlug?.seo?.focusKeyword, '| jsonLd?:', !!bySlug?.seo?.jsonLd)

  if (bySlug) {
    const byId = await getBlogPostById(bySlug.post.id)
    console.log('by id matcht:', byId?.post.id === bySlug.post.id, '| readability:', byId?.seo?.readabilityScore)
  }

  console.log('\n✅ VOLLEDIGE E2E OK')
  process.exit(0)
}

main().catch(e => { console.error('E2E FOUT:', e); process.exit(1) })
