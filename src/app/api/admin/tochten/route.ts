import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { tochten, profiles, tochtAanmeldingen } from '@/lib/db/schema'
import { eq, isNull, desc, and, count, sql } from 'drizzle-orm'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.isAdmin) return Response.json({ error: 'Geen toegang' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get('filter') ?? 'all'
  const offset = Math.max(0, (parseInt(searchParams.get('p') ?? '1') - 1)) * 50

  const filterWhere =
    filter === 'open'        ? eq(tochten.status, 'open') :
    filter === 'geannuleerd' ? eq(tochten.status, 'geannuleerd') :
    filter === 'vol'         ? eq(tochten.status, 'vol') :
    undefined

  const rows = await db
    .select({
      id:             tochten.id,
      titel:          tochten.titel,
      datum:          tochten.datum,
      vaargebied:     tochten.vaargebied,
      status:         tochten.status,
      aantalPlaatsen: tochten.aantalPlaatsen,
      createdAt:      tochten.createdAt,
      poster:         profiles.displayName,
      posterId:       profiles.id,
      aanmeldingen:   sql<number>`(select count(*) from tocht_aanmeldingen where tocht_id = ${tochten.id})`.mapWith(Number),
    })
    .from(tochten)
    .innerJoin(profiles, eq(tochten.profileId, profiles.id))
    .where(and(isNull(tochten.deletedAt), filterWhere))
    .orderBy(desc(tochten.createdAt))
    .limit(50)
    .offset(offset)

  return Response.json({ tochten: rows })
}
