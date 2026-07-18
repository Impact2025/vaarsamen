// Idempotente schema-delta voor het Platform Admin (world-class) feature.
// LET OP: dit repo's drizzle/meta snapshot is stuk — gebruik GEEN drizzle generate/push
// voor kolommen op bestaande tabellen. Dit script past de delta DIRECT op Neon toe.
//
// Run:
//   export DATABASE_URL="$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)"
//   node_modules/.bin/tsx scripts/delta-platform-admin.ts

import { pool } from '@/lib/db'

const log = (m: string) => console.log('[delta]', m)

async function alterIfNotExists(
  table: string,
  column: string,
  definition: string,
) {
  const exists = await pool.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_name = $1 AND column_name = $2`,
    [table, column],
  )
  if (exists.rowCount && exists.rowCount > 0) {
    log(`skip ${table}.${column} (bestaat al)`)
    return
  }
  await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`)
  log(`added ${table}.${column}`)
}

async function createTableIfNotExists(table: string, ddl: string) {
  const exists = await pool.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name = $1`,
    [table],
  )
  if (exists.rowCount && exists.rowCount > 0) {
    log(`skip table ${table} (bestaat al)`)
    return
  }
  await pool.query(ddl)
  log(`created table ${table}`)
}

async function main() {
  // ── sailing_schools: platform-velden ──
  await alterIfNotExists('sailing_schools', 'plan', "varchar(12) default 'basis'")
  await alterIfNotExists('sailing_schools', 'account_status', "varchar(12) default 'actief'")
  await alterIfNotExists('sailing_schools', 'laatste_activiteit_op', 'timestamptz')

  // ── crm_notes: pro-velden ──
  await alterIfNotExists('crm_notes', 'fase', "varchar(20) default 'geen'")
  await alterIfNotExists('crm_notes', 'ai_samenvatting', 'text')

  // ── crm_contacts: NIEUWE tabel ──
  await createTableIfNotExists('crm_contacts', `
    CREATE TABLE crm_contacts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id uuid REFERENCES sailing_schools(id) ON DELETE CASCADE,
      naam text NOT NULL,
      email text,
      telefoon varchar(30),
      fase varchar(20) default 'nieuw',
      tags text[],
      ai_samenvatting text,
      aangemaakt_door uuid REFERENCES users(id),
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    )
  `)
  // index op crm_contacts.tenant_id
  await pool.query(
    `CREATE INDEX IF NOT EXISTS crm_contacts_tenant_idx ON crm_contacts (tenant_id)`,
  ).then(() => log('index crm_contacts_tenant_idx ok')).catch(() => {})

  // ── blog_posts: NIEUWE tabel ──
  await createTableIfNotExists('blog_posts', `
    CREATE TABLE blog_posts (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      titel text NOT NULL,
      slug varchar(120) NOT NULL UNIQUE,
      excerpt text,
      inhoud text NOT NULL,
      status varchar(12) default 'concept',
      auteur_id uuid REFERENCES users(id),
      gepubliceerd_at timestamptz,
      created_at timestamptz default now(),
      updated_at timestamptz default now()
    )
  `)
  await pool.query(
    `CREATE INDEX IF NOT EXISTS blog_posts_slug_uniq ON blog_posts (slug)`,
  ).then(() => log('index blog_posts_slug_uniq ok')).catch(() => {})

  // ── blog_seo: NIEUWE tabel ──
  await createTableIfNotExists('blog_seo', `
    CREATE TABLE blog_seo (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      post_id uuid NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
      focus_keyword varchar(80),
      meta_description varchar(320),
      readability_score integer,
      json_ld jsonb,
      gegenereerd_op timestamptz
    )
  `)
  await pool.query(
    `CREATE INDEX IF NOT EXISTS blog_seo_post_idx ON blog_seo (post_id)`,
  ).then(() => log('index blog_seo_post_idx ok')).catch(() => {})

  log('KLAAR — alle platform-admin delta\'s toegepast.')
  await pool.end()
}

main().catch(async (e) => {
  console.error('[delta] FOUT:', e)
  await pool.end()
  process.exit(1)
})
