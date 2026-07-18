// Seed een voorbeeld-blogpost zodat /blog content toont.
// Idempotent: upsert op vaste slug, update inhoud als al aanwezig.
// Run:
//   export DATABASE_URL="$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)"
//   node_modules/.bin/tsx scripts/seed-blog-demo.ts

import { db } from '@/lib/db'
import { blogPosts, blogSeo, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { saveBlogSeo } from '@/lib/db/queries/blog'

const SLUG = 'zo-wordt-je-zeilschool-een-magneet-voor-nieuwe-leden'
const AUTEUR_ID = 'aadde900-0000-0000-0000-000000000001'

const TITEL = 'Zo word je zeilschool een magneet voor nieuwe leden'
const EXCERPT = 'Drie bewezen manieren om instromers te verleiden — van eerste proefles tot levenslange vlootbinding.'
const INHOUD = `<h2>Waarom de eerste indruk alles bepaalt</h2>
<p>De overstap van "ik wil wel eens zeilen" naar "ik ben lid" gebeurt bijna altijd in de eerste drie weken. Een warm onthaal, een duidelijk rooster en een buddy uit dezelfde leeftijdsgroep maken het verschil tussen een uitgestelde droom en een nieuwe passie.</p>
<h2>1. Werk met een buddy-systeem</h2>
<p>Koppel elke nieuwe cursist aan een ervaren lid. Niet als begeleider, maar als mede-zeiler. De drempel om alleen te komen zakt, en de banden die op het water ontstaan zijn sterker dan elke brochure.</p>
<h2>2. Maak voortgang zichtbaar</h2>
<p>Een CWO-vorderingenstaat die de cursist zelf kan volgen, werkt als een spel. Klein: zeilen wordt "levelen". Vierel het inzicht en deel het vierel de ouder of partner — zo word het een gezamenlijke overwinning.</p>
<h2>3. Vier de seizoenswissel</h2>
<p>Een openingsevenement in het voorjaar en een afsluiting in het najaar booken het jaar ritmisch in. Leden die zich verbonden voelen aan het seizoen, blijven lid.</p>
<h2>Klaar om te beginnen?</h2>
<p>Met VaarSamen zet je het hele lidmaatschapsproces — van inschrijving tot vorderingen — in een paar klikken online. Probeer het gratis met je eigen vloot.</p>`

async function main() {
  // Zorg dat de auteur (admin-demo) bestaat met isAdmin
  await db.insert(users).values({
    id: AUTEUR_ID, email: 'admin.demo@vaarsamen.nl', name: 'Vincent (Platform Admin)',
    emailVerified: new Date('2026-01-01'), isAdmin: true,
  }).onConflictDoUpdate({
    target: users.id,
    set: { name: 'Vincent (Platform Admin)', isAdmin: true },
  })

  const [bestaand] = await db.select().from(blogPosts).where(eq(blogPosts.slug, SLUG)).limit(1)
  if (bestaand) {
    await db.update(blogPosts).set({
      titel: TITEL, excerpt: EXCERPT, inhoud: INHOUD, status: 'gepubliceerd',
      gepubliceerdAt: bestaand.gepubliceerdAt ?? new Date(), updatedAt: new Date(),
    }).where(eq(blogPosts.id, bestaand.id))
    console.log('[blog-seed] bijgewerkt:', bestaand.id)
  } else {
    const [inserted] = await db.insert(blogPosts).values({
      titel: TITEL, slug: SLUG, excerpt: EXCERPT, inhoud: INHOUD,
      status: 'gepubliceerd', auteurId: AUTEUR_ID, gepubliceerdAt: new Date(),
    }).returning()
    console.log('[blog-seed] aangemaakt:', inserted.id)
  }

  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, SLUG)).limit(1)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: TITEL,
    description: EXCERPT,
    keywords: 'zeilschool ledenwerving',
    datePublished: post?.gepubliceerdAt ?? post?.createdAt,
    author: { '@type': 'Organization', name: 'VaarSamen' },
  }
  // Gebruik de bestaande saveBlogSeo (doet check + insert/update)
  await saveBlogSeo({
    postId: post!.id, focusKeyword: 'zeilschool ledenwerving',
    metaDescription: EXCERPT, readabilityScore: 92, jsonLd,
  })

  console.log('[blog-seed] KLAAR — /blog toont nu de voorbeeldpost.')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
