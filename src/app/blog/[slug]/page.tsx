import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getBlogPostBySlug } from '@/lib/db/queries/blog'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await getBlogPostBySlug(slug)
  if (!data) return { title: 'Artikel niet gevonden · VaarSamen' }
  return {
    title: data.seo?.metaDescription ? `${data.post.titel} · VaarSamen` : `${data.post.titel} · VaarSamen`,
    description: data.seo?.metaDescription ?? data.post.excerpt ?? undefined,
    openGraph: {
      title: data.post.titel,
      description: data.seo?.metaDescription ?? data.post.excerpt ?? undefined,
      type: 'article',
    },
  }
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getBlogPostBySlug(slug)
  if (!data) notFound()

  const jsonLd = data.seo?.jsonLd as Record<string, unknown> | undefined
  const metaDescription = data.seo?.metaDescription ?? undefined
  const auteurNaam = data.post.auteurId
    ? (await db.select({ name: users.name }).from(users).where(eq(users.id, data.post.auteurId)).limit(1)).at(0)?.name
    : null

  return (
    <div className="min-h-screen bg-surface">
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <article className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-8">
          <Link href="/blog" className="inline-flex items-center gap-1.5 font-label text-xs text-on-surface-variant hover:text-on-surface mb-4">
            <span className="material-symbols-outlined text-sm" aria-hidden="true">arrow_back</span>
            Alle artikelen
          </Link>
          <h1 className="font-headline font-black text-4xl text-on-surface">{data.post.titel}</h1>
          {metaDescription && <p className="font-body text-on-surface-variant mt-3">{metaDescription}</p>}
          <div className="flex items-center gap-3 mt-4 font-label text-xs text-on-surface-variant">
            <span>{auteurNaam ?? 'VaarSamen'}</span>
            {data.post.gepubliceerdAt && <span>· {new Date(data.post.gepubliceerdAt).toLocaleDateString('nl-NL')}</span>}
          </div>
        </header>

        <div
          className="prose-nl max-w-none font-body text-on-surface leading-relaxed [&_h2]:font-headline [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-headline [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-5 [&_h3]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_li]:my-0.5 [&_a]:text-primary [&_a]:underline [&_p]:my-3"
          dangerouslySetInnerHTML={{ __html: data.post.inhoud }}
        />

        <footer className="mt-12 pt-6 border-t border-white/5">
          <Link href="/blog" className="font-label text-sm text-primary hover:underline">
            ← Terug naar het blog
          </Link>
        </footer>
      </article>
    </div>
  )
}
