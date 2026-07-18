import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getBlogPostById } from '@/lib/db/queries/blog'
import { BlogEditor } from '../BlogEditor'

async function getSessionSafe() {
  try { return await auth() } catch { return null }
}

export default async function AdminBlogEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSessionSafe()
  if (!session?.user?.isAdmin) redirect('/')

  const { id } = await params

  // Nieuw artikel
  if (id === 'nieuw') {
    return (
      <div>
        <h1 className="font-headline font-black text-2xl text-on-surface mb-6">Nieuw artikel</h1>
        <BlogEditor
          initialTitel=""
          initialSlug=""
          initialExcerpt=""
          initialInhoud=""
          initialStatus="concept"
        />
      </div>
    )
  }

  const data = await getBlogPostById(id)
  if (!data) redirect('/admin/blog')

  return (
    <div>
      <h1 className="font-headline font-black text-2xl text-on-surface mb-6">Artikel bewerken</h1>
      <BlogEditor
        postId={data.post.id}
        initialTitel={data.post.titel}
        initialSlug={data.post.slug ?? ''}
        initialExcerpt={data.post.excerpt ?? ''}
        initialInhoud={data.post.inhoud}
        initialStatus={data.post.status ?? 'concept'}
      />
    </div>
  )
}
