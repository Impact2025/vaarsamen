import { auth } from '@/lib/auth'
import { upsertBlogPost, listBlogPosts } from '@/lib/db/queries/blog'
import { z } from 'zod'

// GET /api/admin/blog — lijst
// POST /api/admin/blog — nieuw/upsert
export async function GET() {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })
  const posts = await listBlogPosts()
  return Response.json({ posts })
}

const schema = z.object({
  id: z.string().min(1).optional(),
  titel: z.string().min(1),
  slug: z.string().min(1).max(120),
  excerpt: z.string().optional(),
  inhoud: z.string().min(1),
  status: z.enum(['concept', 'gepubliceerd']).default('concept'),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const parsed = schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const post = await upsertBlogPost({ ...parsed.data, auteurId: session.user.id })
  return Response.json({ post })
}
