import { auth } from '@/lib/auth'
import { markeerSchoolBerichtenGelezen, getSchoolBerichtenVoorUser } from '@/lib/db/queries/school'

// ─── GET /api/school-berichten ────────────────────────────────────────────────
// Zeiler-app: alle berichten van scholen waar de gebruiker lid van is.
// Bij ?markRead=1 worden ongelezen berichten direct gemarkeerd als gelezen.

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  if (searchParams.get('markRead') === '1') {
    await markeerSchoolBerichtenGelezen(session.user.id).catch(() => {})
  }

  const berichten = await getSchoolBerichtenVoorUser(session.user.id)
  return Response.json({ berichten })
}
