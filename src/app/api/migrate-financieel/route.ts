import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

// EENMALIGE migratie-route voor productie (financiele + nieuwsbrief-template kolommen).
// Beveiligd met MIGRATE_TOKEN (Vercel env). Idempotent: alle ALTERs gebruiken
// IF NOT EXISTS. Na uitvoering deze route + de MIGRATE_TOKEN env verwijderen.
export async function POST(req: Request) {
  const token = req.headers.get('x-migrate-token')
  const expected = process.env.MIGRATE_TOKEN
  if (!expected || token !== expected) {
    return Response.json({ error: 'Niet geautoriseerd' }, { status: 401 })
  }

  const steps: string[] = []
  const alts = [
    `ALTER TABLE "public"."boat_rentals" ADD COLUMN IF NOT EXISTS "bedrag_centen" integer`,
    `ALTER TABLE "public"."boat_rentals" ADD COLUMN IF NOT EXISTS "betaald_op" timestamp`,
    `ALTER TABLE "public"."school_memberships" ADD COLUMN IF NOT EXISTS "lidmaatschap_bedrag" integer`,
    `ALTER TABLE "public"."school_memberships" ADD COLUMN IF NOT EXISTS "lidmaatschap_status" membership_fee_status DEFAULT 'open'`,
    `ALTER TABLE "public"."school_memberships" ADD COLUMN IF NOT EXISTS "sepa_iban" varchar(34)`,
    `ALTER TABLE "public"."school_memberships" ADD COLUMN IF NOT EXISTS "sepa_naam" varchar(70)`,
    `ALTER TABLE "public"."school_memberships" ADD COLUMN IF NOT EXISTS "sepa_machtiging_id" varchar(35)`,
    `ALTER TABLE "public"."school_memberships" ADD COLUMN IF NOT EXISTS "sepa_machtiging_op" timestamp`,
    `CREATE TYPE IF NOT EXISTS membership_fee_status AS ENUM ('open','betaald')`,
    `ALTER TABLE "public"."sailing_schools" ADD COLUMN IF NOT EXISTS "financieel" jsonb`,
    `ALTER TABLE "public"."newsletter_campaigns" ADD COLUMN IF NOT EXISTS "template" varchar(40)`,
  ]

  try {
    for (const q of alts) {
      await db.execute(sql.raw(q))
      steps.push('OK: ' + q.slice(0, 50))
    }
    return Response.json({ ok: true, steps })
  } catch (e: any) {
    return Response.json({ ok: false, error: e.message, steps }, { status: 500 })
  }
}
