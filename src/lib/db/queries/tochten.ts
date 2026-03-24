import { db } from '@/lib/db'
import { tochten, profiles, tochtAanmeldingen } from '@/lib/db/schema'
import { and, eq, gte, isNull, desc, count, sql } from 'drizzle-orm'

export type TochtMetPoster = {
  tocht: typeof tochten.$inferSelect
  poster: typeof profiles.$inferSelect
  aanmeldingen: number
}

export async function getTochtenVoorPagina(): Promise<TochtMetPoster[]> {
  const vandaag = new Date().toISOString().slice(0, 10)

  // Subquery: aantal aanmeldingen per tocht
  const aanmeldCount = db
    .select({
      tochtId: tochtAanmeldingen.tochtId,
      n: count().as('n'),
    })
    .from(tochtAanmeldingen)
    .groupBy(tochtAanmeldingen.tochtId)
    .as('ac')

  const rows = await db
    .select({
      tocht:        tochten,
      poster:       profiles,
      aanmeldingen: sql<number>`coalesce(${aanmeldCount.n}, 0)`.as('aanmeldingen'),
    })
    .from(tochten)
    .innerJoin(profiles, eq(tochten.profileId, profiles.id))
    .leftJoin(aanmeldCount, eq(tochten.id, aanmeldCount.tochtId))
    .where(and(
      isNull(tochten.deletedAt),
      eq(tochten.status, 'open'),
      gte(tochten.datum, vandaag),
    ))
    .orderBy(tochten.datum, desc(tochten.createdAt))
    .limit(200)

  return rows.map(r => ({
    tocht:        r.tocht,
    poster:       r.poster,
    aanmeldingen: Number(r.aanmeldingen),
  }))
}

export async function getTochtenCountNieuw(since: Date): Promise<number> {
  const vandaag = new Date().toISOString().slice(0, 10)
  const [row] = await db
    .select({ n: count() })
    .from(tochten)
    .where(and(
      isNull(tochten.deletedAt),
      eq(tochten.status, 'open'),
      gte(tochten.datum, vandaag),
      gte(tochten.createdAt, since),
    ))
  return row.n
}

// ─── TOCHT DETAIL ─────────────────────────────────────────────────────────────

export type TochtDetail = {
  tocht: typeof tochten.$inferSelect
  poster: typeof profiles.$inferSelect
  aanmeldingen: Array<{
    aanmelding: typeof tochtAanmeldingen.$inferSelect
    profiel: typeof profiles.$inferSelect
  }>
}

export async function getTochtById(id: string): Promise<TochtDetail | null> {
  // Fetch the tocht row joined with the poster profile
  const [tochtRow] = await db
    .select({
      tocht:  tochten,
      poster: profiles,
    })
    .from(tochten)
    .innerJoin(profiles, eq(tochten.profileId, profiles.id))
    .where(and(
      eq(tochten.id, id),
      isNull(tochten.deletedAt),
    ))
    .limit(1)

  if (!tochtRow) return null

  // Alias profiles table for the aanmelder join to avoid column name collisions
  const aanmelderProfiles = profiles

  // Fetch all aanmeldingen with their aanmelder's profile
  const aanmeldingRows = await db
    .select({
      aanmelding: tochtAanmeldingen,
      profiel:    aanmelderProfiles,
    })
    .from(tochtAanmeldingen)
    .innerJoin(aanmelderProfiles, eq(tochtAanmeldingen.profileId, aanmelderProfiles.id))
    .where(eq(tochtAanmeldingen.tochtId, id))
    .orderBy(tochtAanmeldingen.createdAt)

  return {
    tocht:        tochtRow.tocht,
    poster:       tochtRow.poster,
    aanmeldingen: aanmeldingRows.map(r => ({
      aanmelding: r.aanmelding,
      profiel:    r.profiel,
    })),
  }
}

// ─── MIJN TOCHTEN ─────────────────────────────────────────────────────────────

export async function getMyTochten(profileId: string): Promise<TochtMetPoster[]> {
  // Subquery: aantal aanmeldingen per tocht
  const aanmeldCount = db
    .select({
      tochtId: tochtAanmeldingen.tochtId,
      n: count().as('n'),
    })
    .from(tochtAanmeldingen)
    .groupBy(tochtAanmeldingen.tochtId)
    .as('ac')

  const rows = await db
    .select({
      tocht:        tochten,
      poster:       profiles,
      aanmeldingen: sql<number>`coalesce(${aanmeldCount.n}, 0)`.as('aanmeldingen'),
    })
    .from(tochten)
    .innerJoin(profiles, eq(tochten.profileId, profiles.id))
    .leftJoin(aanmeldCount, eq(tochten.id, aanmeldCount.tochtId))
    .where(and(
      isNull(tochten.deletedAt),
      eq(tochten.profileId, profileId),
    ))
    .orderBy(desc(tochten.datum), desc(tochten.createdAt))

  return rows.map(r => ({
    tocht:        r.tocht,
    poster:       r.poster,
    aanmeldingen: Number(r.aanmeldingen),
  }))
}
