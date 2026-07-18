import Link from 'next/link'
import { listBlogPosts } from '@/lib/db/queries/blog'

export const dynamic = 'force-dynamic'

export default async function BlogIndexPage() {
  const posts = await listBlogPosts(true)

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <header className="mb-10 text-center">
          <span className="font-label text-xs uppercase tracking-wider text-primary">VaarSamen Blog</span>
          <h1 className="font-headline font-black text-4xl text-on-surface mt-2">
            Tips, verhalen & zeilkennis
          </h1>
          <p className="font-body text-on-surface-variant mt-3">
            Van CWO-theorie tot onderhoud — geschreven door zeilers, voor zeilers.
          </p>
        </header>

        <div className="space-y-5">
          {posts.map(p => (
            <Link key={p.id} href={`/blog/${p.slug}`}
              className="block glass-card rounded-2xl p-5 border border-white/5 hover:border-primary/20 transition-colors">
              <h2 className="font-headline font-bold text-xl text-on-surface">{p.titel}</h2>
              {p.excerpt && <p className="font-body text-sm text-on-surface-variant mt-2">{p.excerpt}</p>}
              <div className="flex items-center gap-3 mt-3 font-label text-xs text-on-surface-variant">
                <span>{p.auteurNaam ?? 'VaarSamen'}</span>
                {p.gepubliceerdAt && <span>· {new Date(p.gepubliceerdAt).toLocaleDateString('nl-NL')}</span>}
              </div>
            </Link>
          ))}
          {posts.length === 0 && (
            <p className="text-center font-body text-on-surface-variant">Nog geen artikelen gepubliceerd.</p>
          )}
        </div>

        <footer className="mt-12 text-center">
          <Link href="/" className="font-label text-sm text-primary hover:underline">
            ← Terug naar VaarSamen
          </Link>
        </footer>
      </div>
    </div>
  )
}
