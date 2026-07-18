import { auth } from '@/lib/auth'
import { voegSchoolBerichtReactieToe } from '@/lib/db/queries/school'
import { z } from 'zod'

// ─── POST /api/school-berichten/[id]/reactie ─────────────────────────────────
// Zeiler reageert op een school-bericht.

const Schema = z.object({
  bericht: z.string().min(1).max(2000),
})

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json().catch(() => null)
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return Response.json({ error: 'Ongeldige invoer' }, { status: 400 })

  const nieuw = await voegSchoolBerichtReactieToe(id, session.user.id, parsed.data.bericht)
  if (!nieuw) return Response.json({ error: 'Bericht niet gevonden' }, { status: 404 })

  return Response.json({ id: nieuw.id }, { status: 201 })
}
