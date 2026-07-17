import { Pool } from '@neondatabase/serverless'
const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
async function q(t: string, p: any[] = []){ const r = await pool.query(t, p); return r }
(async () => {
  // 1) Voeg boot_type waarden toe (idempotent)
  await q(`DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='boat_type' AND e.enumlabel='kielboot') THEN ALTER TYPE boat_type ADD VALUE 'kielboot'; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='boat_type' AND e.enumlabel='sloep')    THEN ALTER TYPE boat_type ADD VALUE 'sloep';    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON e.enumtypid=t.oid WHERE t.typname='boat_type' AND e.enumlabel='kano')     THEN ALTER TYPE boat_type ADD VALUE 'kano';     END IF;
  END $$;`)
  console.log('boat_type values ensured')

  // 2) Voeg uitrusting/opmerkingen toe aan school_fleet (idempotent)
  await q(`ALTER TABLE school_fleet ADD COLUMN IF NOT EXISTS uitrusting text;`)
  await q(`ALTER TABLE school_fleet ADD COLUMN IF NOT EXISTS opmerkingen text;`)
  console.log('school_fleet columns ensured')

  // Controle
  const bt = await q(`SELECT unnest(enum_range(NULL::boat_type)) AS v`)
  console.log('boat_type:', bt.rows.map(r=>r.v).join(', '))
  const cols = await q(`SELECT column_name FROM information_schema.columns WHERE table_name='school_fleet' ORDER BY ordinal_position`)
  console.log('school_fleet cols:', cols.rows.map(r=>r.column_name).join(', '))
  await pool.end()
})().catch(e=>{console.error(e);process.exit(1)})
