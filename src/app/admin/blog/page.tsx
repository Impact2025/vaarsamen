import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { listBlogPosts } from '@/lib/db/queries/blog'

async function getSessionSafe() {
  try { return await auth() } catch { return null }
}

export default async function AdminBlogPage() {
  const session = await getSessionSafe()
  if (!session?.user?.isAdmin) redirect('/')

  const posts = await listBlogPosts()

  return (
    <div>
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-headline font-black text-2xl text-on-surface">Blog</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1">
            Platform-blog met AI SEO-tool
          </p>
        </div>
        <Link
          href="/admin/blog/nieuw"
          className="px-4 py-2.5 rounded-xl gradient-primary font-label text-sm font-semibold text-on-primary shadow-glow"
        >
          + Nieuw artikel
        </Link>
      </div>

      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant font-label text-xs">
                <th className="px-4 py-3">Titel</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Auteur</th>
                <th className="px-4 py-3">Bijgewerkt</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map(p => (
                <tr key={p.id} className="border-b border-white/5 hover:bg-surface-container-high/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/blog/${p.id}`} className="font-label font-semibold text-on-surface hover:text-primary transition-colors">
                      {p.titel}
                    </Link>
                    <span className="block font-label text-[11px] text-on-surface-variant">/{p.slug}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-label text-xs px-2 py-1 rounded-lg ${
                      p.status === 'gepubliceerd'
                        ? 'bg-emerald-400/10 text-emerald-300'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-label text-xs text-on-surface-variant">{p.auteurNaam ?? '—'}</td>
                  <td className="px-4 py-3 font-label text-xs text-on-surface-variant">
                    {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString('nl-NL') : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/blog/${p.id}`} className="font-label text-xs text-primary hover:underline">
                      Bewerken
                    </Link>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center font-label text-sm text-on-surface-variant">
                    Nog geen blogartikelen. Maak er een aan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
