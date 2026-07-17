import { db } from '@/lib/db'
import { schoolInvites, sailingSchools } from '@/lib/db/schema'
import { and, eq, isNull } from 'drizzle-orm'

// Bewust geen server action: dit is een leesfunctie voor de server. In een
// 'use server'-bestand zou elke export een endpoint worden dat met willekeurige
// tokens te bevragen is.

export type GeldigeUitnodiging = typeof schoolInvites.$inferSelect & {
  schoolNaam: string
}

// Geldig = bestaat, niet ingetrokken, niet verlopen, nog niet geaccepteerd,
// en persoonlijk (gedeelde links horen op /invite, niet hier).
export async function getGeldigeUitnodiging(token: string): Promise<GeldigeUitnodiging | null> {
  const [row] = await db
    .select({ invite: schoolInvites, schoolNaam: sailingSchools.name })
    .from(schoolInvites)
    .innerJoin(sailingSchools, eq(sailingSchools.id, schoolInvites.schoolId))
    .where(and(
      eq(schoolInvites.token, token),
      isNull(schoolInvites.deletedAt),
      isNull(schoolInvites.acceptedAt),
    ))
    .limit(1)

  if (!row) return null
  if (row.invite.expiresAt && row.invite.expiresAt < new Date()) return null
  if (!row.invite.email) return null

  return { ...row.invite, schoolNaam: row.schoolNaam }
}
