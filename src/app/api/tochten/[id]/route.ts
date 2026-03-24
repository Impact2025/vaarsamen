import { auth } from '@/lib/auth'
import { aanmeldingSchema } from '@/lib/validations'
import { getProfileByUserId } from '@/lib/db/queries/profiles'
import { db } from '@/lib/db'
import { tochten, tochtAanmeldingen, profiles } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'
import { sendPushToProfile } from '@/lib/push'

// GET /api/tochten/[id] — Tocht detail + aanmeldingen
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params

  const [tocht] = await db
    .select()
    .from(tochten)
    .where(and(eq(tochten.id, id), isNull(tochten.deletedAt)))
    .limit(1)

  if (!tocht) return Response.json({ error: 'Tocht niet gevonden' }, { status: 404 })

  // Aanmeldingen inclusief profiel info
  const aanmeldingen = await db
    .select({
      aanmelding: tochtAanmeldingen,
      profiel:    profiles,
    })
    .from(tochtAanmeldingen)
    .innerJoin(profiles, eq(tochtAanmeldingen.profileId, profiles.id))
    .where(eq(tochtAanmeldingen.tochtId, id))

  // Poster profiel
  const [poster] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, tocht.profileId))
    .limit(1)

  return Response.json({ tocht, poster, aanmeldingen })
}

// POST /api/tochten/[id] — Aanmelden voor tocht
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const [tocht] = await db
    .select()
    .from(tochten)
    .where(and(eq(tochten.id, id), isNull(tochten.deletedAt), eq(tochten.status, 'open')))
    .limit(1)

  if (!tocht) return Response.json({ error: 'Tocht niet gevonden of al vol' }, { status: 404 })
  if (tocht.profileId === profile.id) return Response.json({ error: 'Je kunt je niet aanmelden voor je eigen tocht' }, { status: 400 })

  // Check duplicaat aanmelding
  const [bestaand] = await db
    .select()
    .from(tochtAanmeldingen)
    .where(and(eq(tochtAanmeldingen.tochtId, id), eq(tochtAanmeldingen.profileId, profile.id)))
    .limit(1)

  if (bestaand) return Response.json({ error: 'Je hebt je al aangemeld' }, { status: 409 })

  const body   = await req.json()
  const parsed = aanmeldingSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 })

  const [aanmelding] = await db
    .insert(tochtAanmeldingen)
    .values({ tochtId: id, profileId: profile.id, bericht: parsed.data.bericht })
    .returning()

  // Notificeer de poster
  await sendPushToProfile(tocht.profileId, {
    title: '⛵ Nieuwe aanmelding',
    body:  `${profile.displayName} wil mee varen op "${tocht.titel}"!`,
    url:   `/tochten/${id}`,
  })

  return Response.json({ aanmelding }, { status: 201 })
}

// PATCH /api/tochten/[id] — Aanmelding accepteren/afwijzen (alleen poster)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return Response.json({ error: 'Niet ingelogd' }, { status: 401 })

  const { id } = await params
  const profile = await getProfileByUserId(session.user.id)
  if (!profile) return Response.json({ error: 'Profiel niet gevonden' }, { status: 404 })

  const [tocht] = await db.select().from(tochten).where(eq(tochten.id, id)).limit(1)
  if (!tocht || tocht.profileId !== profile.id) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { aanmeldingId, status: nieuwStatus } = await req.json()
  if (!['geaccepteerd', 'afgewezen'].includes(nieuwStatus)) {
    return Response.json({ error: 'Ongeldige status' }, { status: 400 })
  }

  const [updated] = await db
    .update(tochtAanmeldingen)
    .set({ status: nieuwStatus })
    .where(and(eq(tochtAanmeldingen.id, aanmeldingId), eq(tochtAanmeldingen.tochtId, id)))
    .returning()

  if (updated) {
    const bericht = nieuwStatus === 'geaccepteerd'
      ? `Je bent geaccepteerd voor "${tocht.titel}"! Tot op het water 🎉`
      : `Je aanmelding voor "${tocht.titel}" is helaas afgewezen.`
    await sendPushToProfile(updated.profileId, {
      title: nieuwStatus === 'geaccepteerd' ? '✅ Geaccepteerd!' : '❌ Aanmelding afgewezen',
      body:  bericht,
      url:   `/tochten/${id}`,
    })
  }

  return Response.json({ aanmelding: updated })
}
