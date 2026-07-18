import { db } from '@/lib/db'
import {
  sailingSchools, schoolMemberships, schoolFleet, newsletterSubscribers,
} from '@/lib/db/schema'
import { count, eq, isNull, sql, desc } from 'drizzle-orm'

// Totaal-overzicht van alle zeilscholen voor het platform-admin dashboard.
export async function getPlatformScholen() {
  return db
    .select({
      id: sailingSchools.id,
      naam: sailingSchools.name,
      slug: sailingSchools.slug,
      plan: sailingSchools.plan,
      accountStatus: sailingSchools.accountStatus,
      stad: sailingSchools.city,
      laatsteActiviteitOp: sailingSchools.laatsteActiviteitOp,
      leden: sql<number>`(
        SELECT count(*) FROM school_memberships sm
        WHERE sm.school_id = sailing_schools.id AND sm.deleted_at IS NULL
      )`,
      vloot: sql<number>`(
        SELECT count(*) FROM school_fleet sf WHERE sf.school_id = sailing_schools.id
      )`,
      abonnees: sql<number>`(
        SELECT count(*) FROM newsletter_subscribers ns
        WHERE ns.school_id = sailing_schools.id AND ns.status = 'actief'
      )`,
    })
    .from(sailingSchools)
    .where(isNull(sailingSchools.deletedAt))
    .orderBy(sailingSchools.name)
}

export type PlatformSchool = Awaited<ReturnType<typeof getPlatformScholen>>[number]

// Pipeline-samenvatting voor de platform-CRM (aantal contacten per fase).
export async function getCrmPipeline() {
  const { crmContacts } = await import('@/lib/db/schema')
  const rows = await db
    .select({ fase: crmContacts.fase, n: count() })
    .from(crmContacts)
    .groupBy(crmContacts.fase)
  const map: Record<string, number> = { nieuw: 0, gekwalificeerd: 0, klant: 0, verloren: 0 }
  for (const r of rows) {
    const f = r.fase ?? 'nieuw'
    map[f] = Number(r.n)
  }
  return map
}

// Alle platform-CRM-contacten (optioneel gefilterd op fase).
export async function getCrmContacts(fase?: string) {
  const { crmContacts, sailingSchools: ss2 } = await import('@/lib/db/schema')
  const q = db
    .select({
      id: crmContacts.id,
      naam: crmContacts.naam,
      email: crmContacts.email,
      telefoon: crmContacts.telefoon,
      fase: crmContacts.fase,
      tags: crmContacts.tags,
      aiSamenvatting: crmContacts.aiSamenvatting,
      tenantNaam: ss2.name,
      createdAt: crmContacts.createdAt,
    })
    .from(crmContacts)
    .leftJoin(ss2, eq(crmContacts.tenantId, ss2.id))
    .orderBy(desc(crmContacts.createdAt))
  if (fase && fase !== 'alle') {
    return (await q).filter(r => r.fase === fase)
  }
  return await q
}

export type CrmContactRow = Awaited<ReturnType<typeof getCrmContacts>>[number]
