# VaarSamen Platform Admin — Wereldklasse Implementatieplan

> **For Hermes:** Gebruik `subagent-driven-development` om dit plan taak-per-taak uit te voeren.
> Bouw ALTIJD voort op bestaande patronen (zie "Bestaande bouwstenen" hieronder) — verzin geen
> nieuwe WYSIWYG/AI/mail-implementatie als die er al is.

**Goal:** Eén eigen, wereldklasse `/admin` platform-command-center: totaal overzicht van alle
zeilscholen (multi-tenant), een pro CRM (platform-breed + per-school, AI-verrijkt), een pro
nieuwsbriefsysteem (WYSIWYG + AI + platform-templates) en een blog systeem met een AI SEO-tool.

**Architecture:** Platform-niveau admin (gated op `users.isAdmin`), bovenop de bestaande per-school
modules. Nieuwe data via Drizzle-schema-delta's die **direct op Neon** worden toegepast (het
`drizzle/meta` snapshot is stuk — `drizzle-kit generate`/`push` voor COLUMN/ENUM-delta's is onveilig;
alleen `npm run db:push` voor 100% nieuwe tabellen). AI via de bestaande `src/lib/ai.ts`
(OpenRouter streaming). Mail via Resend (bestaand). UI hergebruikt de design tokens uit
`src/app/globals.css` + Material Symbols + het bewezen `NieuwsbriefEditor.tsx` contentEditable-patroon.

**Tech Stack:** Next 16 (App Router, Turbopack), drizzle-orm + Neon Postgres, OpenRouter
(`anthropic/claude-opus-4.5` via `AI_MODEL`), Resend, Tailwind v4 CSS-first, contentEditable
(zonder externe rich-text dep), Zod.

**Kritieke constraints (uit vaarsamen-project skill — niet overtreden):**
- COLUMN/ENUM delta's → idempotente `tsx` ALTER-scripts direct op Neon (`ALTER TABLE x ADD COLUMN IF NOT EXISTS`).
  NOOIT `drizzle-kit generate`/`migrate` voor bestaande tabellen.
- Nieuwe tabellen → `set -a; . ./.env.local; set +a && npm run db:push` (veilig, diff-only).
- `z.string().uuid()` weigert de platform's custom IDs (bijv. `aadde400-…-0001`). Gebruik
  `z.string().min(1)` op elk route-param dat een fleet/boat/school/membership id neemt.
- `next build` segfault op Node 3.11 + Turbopack hier → betrouwbare code-gate is
  `npx tsc --noEmit -p tsconfig.json` (exit 0). Voor runtime-bewijs: e2e query-script tegen Neon
  (zie vaarsamen-nextjs-app "dev-server flakiness"). Een clean `tsc` + e2e query-print = verified.
- `search_files` faalt op `/d/apps/...` → gebruik terminal `grep -rn`.
- file-tools: altijd `D:/apps/...` paden (nooit `D:/d/APPS`).
- Publieke/admin-pagina's die `auth()` aanroepen: wrap in try/catch → null (corrupt cookie mag
  geen 500 geven). Admin-pagina's zijn alleen voor `isAdmin`, dus géén redirect-naar-login nodig,
  maar de `auth()` call zelf wel crash-resilient maken.

---

## Bestaande bouwstenen (HERGEBRUIKEN — niet opnieuw bouwen)

- **Admin shell:** `src/app/admin/layout.tsx` (sidebar `NAV[]`, gated op `isAdmin`),
  `src/app/admin/page.tsx` (stat-cards + `getStats()`). Uitbreiden, niet vervangen.
- **AI streaming:** `src/lib/ai.ts` → `streamToController(controller, { system, prompt, maxTokens })`
  naar OpenRouter. Voorbeeld-route: `src/app/api/mijn-vorderingen/ai-analyse/route.ts`.
- **WYSIWYG:** `src/app/school/[schoolId]/dashboard/NieuwsbriefEditor.tsx` (contentEditable +
  `document.execCommand` + merge-tags). Patroon voor de blog-editor en nieuwsbrief-upgrade.
- **Templates/merge-tags:** `src/lib/newsletter-templates.ts` (`NL_TEMPLATES`, `NL_MERGE_TAGS`).
- **Nieuwsbrief data:** `newsletter_subscribers` / `newsletter_campaigns` / `newsletter_sends`
  (schema.ts regels ~986-1071) + routes onder `src/app/api/school/[schoolId]/newsletter/*`.
- **CRM data:** `crm_notes` (schema.ts ~916). Per-lid CRM via `GET /api/school/[schoolId]/crm/leden`.
- **Mail:** `src/lib/email.ts` (Resend). Hergebruik voor blog-notificatie + nieuwsbrief.
- **Design tokens:** `src/app/globals.css` (`--color-primary`, `glass-card`, `gradient-primary`,
  `material-symbols-outlined`, `font-headline/body/label`). NIET hardcoden.

---

## Fase 0 — Verificatie huidige staat (DONE tijdens planvorming)

- [x] Admin shell, CRM, nieuwsbrief, AI, mail, design-tokens geïnventariseerd.
- [x] Geen blog-systeem aanwezig → volledig nieuw in Fase 5.
- [x] `isAdmin` kolom bestaat op `users` (schema.ts:50).

---

## Fase 1 — Platform Admin Shell upgrade (command center)

**Doel:** De `/admin` wordt een echt command center met een uitbreidbare nav en een rijker
totaal-dashboard. Bouwt op de bestaande `layout.tsx` + `page.tsx`.

### Taak 1.1 — Admin-nav uitbreiden met nieuwe modules
**Objective:** Voeg nav-items toe voor Scholen, CRM, Nieuwsbrief (platform), Blog.
**Files:** Modify `src/app/admin/layout.tsx` (NAV array, regels 5-12).
**Step 1:** Breid `NAV` uit:
```ts
const NAV = [
  { href: '/admin',                icon: 'dashboard',    label: 'Dashboard'   },
  { href: '/admin/scholen',        icon: 'sailing',      label: 'Zeilscholen' },
  { href: '/admin/crm',            icon: 'contacts',     label: 'CRM'         },
  { href: '/admin/nieuwsbrief',    icon: 'campaign',     label: 'Nieuwsbrief' },
  { href: '/admin/blog',           icon: 'article',      label: 'Blog'        },
  { href: '/admin/gebruikers',     icon: 'group',        label: 'Gebruikers'  },
  { href: '/admin/tochten',        icon: 'sailing',      label: 'Tochten'     },
  { href: '/admin/meldingen',      icon: 'flag',         label: 'Meldingen'   },
  { href: '/admin/cwo',            icon: 'verified',     label: 'CWO'         },
  { href: '/admin/push',           icon: 'campaign',     label: 'Broadcast'   },
]
```
**Step 2:** `npx tsc --noEmit -p tsconfig.json` → exit 0.
**Step 3:** Commit: `git commit -m "admin: nav uitgebreid met scholen/crm/nieuwsbrief/blog"`

### Taak 1.2 — Platform-stat-cards uitbreiden (scholen + inkomsten + groei)
**Objective:** Dashboard toont nu ook zeilscholen-totaal, abonnementen, nieuwsbrief-abonnees.
**Files:** Modify `src/app/admin/page.tsx` (`getStats()` + `CARDS`).
**Step 1:** Voeg in `getStats()` Promise.all toe:
```ts
const [[scholen], [abonnees], [campagnes]] = await Promise.all([
  db.select({ n: count() }).from(sailingSchools),
  db.select({ n: count() }).from(newsletterSubscribers).where(eq(newsletterSubscribers.status,'actief')),
  db.select({ n: count() }).from(newsletterCampaigns),
])
```
(en importeer `sailingSchools, newsletterSubscribers, newsletterCampaigns` bovenaan).
**Step 2:** Voeg cards toe aan `CARDS`:
```ts
{ key: 'scholen',    label: 'Zeilscholen',        icon: 'sailing',   href: '/admin/scholen',   color: '#46f1c5', alert: false },
{ key: 'abonnees',   label: 'Nieuwsbrief actief',  icon: 'campaign',  href: '/admin/nieuwsbrief', color: '#60a5fa', alert: false },
```
en return `scholen: scholen.n, abonnees: abonnees.n` in het stats-object.
**Step 3:** `npx tsc --noEmit` → exit 0. Commit.

---

## Fase 2 — Zeilscholen totaal-overzicht (multi-tenant)

**Doel:** Eén platform-view met alle zeilscholen, hun health/KPI's, en een drill-down detail.

### Taak 2.1 — Schema-delta: school-KPI + platvorm-velden
**Objective:** Optionele platform-velden op `sailing_schools` (plan/status/laatste activiteit).
**Files:** Modify `src/lib/db/schema.ts` (`sailing_schools`, ~380).
**Step 1:** Voeg kolommen toe (achter `financieel`):
```ts
  plan:           varchar('plan', { length: 12 }).default('basis'), // basis | school | school_pro
  accountStatus:  varchar('account_status', { length: 12 }).default('actief'), // actief | gepauzeerd | geblokkeerd
  laatsteActiviteitOp: timestamp('laatste_activiteit_op'),
```
**Step 2:** Schrijf `scripts/delta-schools-kpi.ts` (idempotente ALTER naar Neon):
```ts
import { Pool } from 'pg'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
await pool.query(`ALTER TABLE sailing_schools ADD COLUMN IF NOT EXISTS plan varchar(12) default 'basis'`)
await pool.query(`ALTER TABLE sailing_schools ADD COLUMN IF NOT EXISTS account_status varchar(12) default 'actief'`)
await pool.query(`ALTER TABLE sailing_schools ADD COLUMN IF NOT EXISTS laatste_activiteit_op timestamptz`)
```
Run: `export DATABASE_URL="$(grep -E '^DATABASE_URL=' .env.local | head -1 | cut -d= -f2-)" && node_modules/.bin/tsx scripts/delta-schools-kpi.ts`
**Step 3:** Patch de laatste goede `drizzle/meta/0005_snapshot.json` met de 3 kolommen (zodat een
toekomstige generate ze niet dubbel emitteert). Commit.

### Taak 2.2 — Platform school-overzicht query + pagina
**Objective:** Lijst alle scholen met KPI's (leden, vloot, abonnees, laatste activiteit).
**Files:** Create `src/lib/db/queries/platform.ts`, Create `src/app/admin/scholen/page.tsx`.
**Step 1:** In `queries/platform.ts`:
```ts
import { db } from '@/lib/db'
import { sailingSchools, schoolMemberships, schoolFleet, newsletterSubscribers } from '@/lib/db/schema'
import { count, eq, isNull, sql } from 'drizzle-orm'

export async function getPlatformScholen() {
  return db.select({
    id: sailingSchools.id,
    naam: sailingSchools.naam,
    slug: sailingSchools.slug,
    plan: sailingSchools.plan,
    accountStatus: sailingSchools.accountStatus,
    leden: sql<number>`(select count(*) from school_memberships sm where sm.school_id = sailing_schools.id and sm.deleted_at is null)`,
    vloot: sql<number>`(select count(*) from school_fleet sf where sf.school_id = sailing_schools.id)`,
    abonnees: sql<number>`(select count(*) from newsletter_subscribers ns where ns.school_id = sailing_schools.id and ns.status = 'actief')`,
    laatsteActiviteitOp: sailingSchools.laatsteActiviteitOp,
  }).from(sailingSchools).orderBy(sailingSchools.naam)
}
```
**Step 2:** `page.tsx` (server component, `auth()` in try/catch → `if (!session?.user?.isAdmin) redirect('/')`):
render een `glass-card` tabel met de 10 Material-Symbol-kolommen (naam, plan-badge, leden, vloot,
abonnees, status, laatste activiteit) + per rij een `<Link href={'/admin/scholen/'+id}>`.
**Step 3:** `npx tsc --noEmit` → exit 0. E2e: `scripts/_x.ts` roept `getPlatformScholen()` aan en
print `length` + eerste rij. Run met DATABASE_URL export. Commit.

### Taak 2.3 — School detail (platform drill-down)
**Objective:** Per school: KPI's + recente leden + nieuwsbrief-status + snelkoppeling naar school-dashboard.
**Files:** Create `src/app/admin/scholen/[schoolId]/page.tsx`.
**Step 1:** Server component: haal school via `getPlatformScholen()` gefilterd op id (of direct
`db.select().from(sailingSchools).where(eq(id, z.string().min(1)))`). Toon KPI-cards + link naar
`/school/<id>/dashboard` + `/admin/scholen/<id>/crm`.
**Step 2:** tsc + commit.

---

## Fase 3 — Pro CRM (platform-breed + per-school + AI)

**Doel:** CRM wordt "pro": pipeline/fasen, AI-samenvatting per lid, platform-brede CRM-view in /admin.

### Taak 3.1 — Schema-delta: CRM pipeline + AI-velden
**Objective:** crm_notes krijgt fase + AI-samenvatting; nieuwe `crm_contacts` voor platform-leden.
**Files:** Modify `src/lib/db/schema.ts` (`crmNotes` ~916).
**Step 1:** Voeg toe aan `crmNotes`:
```ts
  fase:      varchar('fase', { length: 20 }).default('nieuw'), // nieuw | gekwalificeerd | klant | verloren
  aiSamenvatting: text('ai_samenvatting'),
```
**Step 2:** Nieuwe tabel `crm_contacts` (platform-breed, los van school):
```ts
export const crmContacts = pgTable('crm_contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id').references(() => sailingSchools.id, { onDelete: 'cascade' }),
  naam: text('naam').notNull(),
  email: text('email'),
  telefoon: text('telefoon'),
  fase: varchar('fase', { length: 20 }).default('nieuw'),
  tags: text('tags').array(),
  aiSamenvatting: text('ai_samenvatting'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => ({ tenantIdx: index('crm_contacts_tenant_idx').on(t.tenantId) }))
```
**Step 3:** `scripts/delta-crm.ts` (idempotente ALTERs voor crm_notes + `CREATE TABLE IF NOT EXISTS
crm_contacts`). Run met DATABASE_URL. Patch snapshot. Commit.

### Taak 3.2 — AI CRM-samenvatting route
**Objective:** Genereer een AI-samenvatting van alle CRM-notities van een lid/contact (streaming).
**Files:** Create `src/app/api/admin/crm/[id]/ai-samenvatting/route.ts`, herbruik `streamToController`.
**Step 1:** Route haalt notities via `getCrmNotities(id)`, bouwt userPrompt met alle `inhoud` +
`kanaal`, systemPrompt = "Jij bent een CRM-assistent die een korte, objectieve samenvatting maakt
van de relatiegeschiedenis met deze contactpersoon (NL, max 150 woorden, bullet-points: laatste
contact, sentiment, open acties, kans op conversie)."
**Step 2:** Streaming-response zoals `ai-analyse/route.ts`. `z.string().min(1)` voor id.
**Step 3:** tsc + e2e query (`getCrmNotities` bestaat al in queries/school.ts) → commit.

### Taak 3.3 — Platform CRM-view + per-school CRM-tab upgrade
**Objective:** /admin/crm toont alle contacten/pipeline; school-dashboard CRM krijgt fase + AI-knop.
**Files:** Create `src/app/admin/crm/page.tsx`; Modify `SchoolDashboardClient.tsx` CRM-sectie.
**Step 1:** `page.tsx`: tabel contacten (naam, tenant, fase-badge, tags) + pipeline-summary (aantal
per fase via `group by fase`). Fase-filter via `?fase=`.
**Step 2:** In `SchoolDashboardClient.tsx` CRM detail: voeg een "AI-samenvatting" knop die de
`/api/admin/crm/[id]/ai-samenvatting` streamt in een paneel, en een fase-dropdown (PATCH naar
bestaande crm-notes route of nieuwe `crm/contacts/[id]` route).
**Step 3:** tsc + commit.

---

## Fase 4 — Pro nieuwsbrief upgrade (platform + AI)

**Doel:** Nieuwsbrief wordt "pro": platform-template-bibliotheek, AI-onderwerp/body-suggestie,
A/B-onderwerp, verbeterde segmentatie. Bouwt op bestaande `NieuwsbriefEditor.tsx` + routes.

### Taak 4.1 — Platform nieuwsbrief-overzicht + template-bibliotheek
**Objective:** /admin/nieuwsbrief toont alle campagnes over alle scholen + deelt templates.
**Files:** Create `src/app/admin/nieuwsbrief/page.tsx`; Create `src/lib/newsletter-platform-templates.ts`.
**Step 1:** `page.tsx`: query `newsletterCampaigns` met `school.naam` join, toon tabel (school,
titel, status, ontvangers, opens-rate, verzondenAt) + link naar school-dashboard nieuwsbrief-tab.
**Step 2:** Breid `newsletter-templates.ts` uit met `PLATFORM_TEMPLATES` (bijv. "Welkom",
"Open dag", "Seizoen-open") — herbruik `NL_MERGE_TAGS`.
**Step 3:** tsc + commit.

### Taak 4.2 — AI nieuwsbrief-assistent (onderwerp + body + A/B)
**Objective:** In de editor: knop "AI-suggestie" genereert onderwerp + intro-body, en een A/B-paar.
**Files:** Create `src/app/api/school/[schoolId]/newsletter/ai/route.ts`; Modify `NieuwsbriefEditor.tsx`.
**Step 1:** Route (POST `{ schoolId, context }`): roept `streamToController` met systemPrompt
"Jij bent een Nederlandse e-mailcopywriter voor zeilscholen. Schrijf een onderwerp + opening
(MAX 120 woorden) in de huisstijl van de school. Geef ook variant B voor A/B-test." Stream terug.
**Step 2:** In `NieuwsbriefEditor.tsx`: voeg toolbar-knop "AI ✨" die de stream ophaalt en de body
invoegt via `execCommand('insertHTML', ...)` (of `insertText`). Toon A/B-onderwerpen in 2 inputs.
**Step 3:** tsc + e2e (test route met een MIN(1)-schoolId + sample context, assert stream bevat tekst) → commit.

---

## Fase 5 — Blog systeem + AI SEO-tool (NIEUW)

**Doel:** Platform-blog (vaarsamen.nl/blog) met markdown/HTML-editor, publicatie-status, en een
AI SEO-tool die titel, slug, meta-beschrijving, focus-keyword, JSON-LD en leesbaarheidsscore genereert.

### Taak 5.1 — Schema: blog_posts + blog_seo
**Objective:** Nieuwe tabellen voor blog-artikelen + AI-SEO-velden.
**Files:** Modify `src/lib/db/schema.ts` (nieuwe tabellen onderaan).
```ts
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  titel: text('titel').notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  excerpt: text('excerpt'),
  inhoud: text('inhoud').notNull(),          // HTML (contentEditable, zelfde patroon als nieuwsbrief)
  status: varchar('status', { length: 12 }).default('concept'), // concept | gepubliceerd
  auteurId: uuid('auteur_id').references(() => users.id),
  gepubliceerdAt: timestamp('gepubliceerd_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => ({ slugUniq: uniqueIndex('blog_posts_slug_uniq').on(t.slug) }))

export const blogSeo = pgTable('blog_seo', {
  id: uuid('id').defaultRandom().primaryKey(),
  postId: uuid('post_id').notNull().references(() => blogPosts.id, { onDelete: 'cascade' }),
  focusKeyword: varchar('focus_keyword', { length: 80 }),
  metaDescription: varchar('meta_description', { length: 320 }),
  readabilityScore: integer('readability_score'),
  jsonLd: jsonb('json_ld'),
  gegenereerdOp: timestamp('gegenereerd_op'),
})
```
**Step 1:** NIEUWE tabel → `npm run db:push` (veilig): `set -a; . ./.env.local; set +a && npm run db:push`.
**Step 2:** Voeg relations toe. Commit.

### Taak 5.2 — Blog admin (lijst + editor + publish)
**Objective:** /admin/blog: lijst + nieuw/bewerk editor + publicatie.
**Files:** Create `src/app/admin/blog/page.tsx`, `src/app/admin/blog/[id]/page.tsx`,
`src/app/admin/blog/BlogEditor.tsx` (fork van `NieuwsbriefEditor.tsx`), `src/lib/db/queries/blog.ts`,
routes `src/app/api/admin/blog/route.ts` + `src/app/api/admin/blog/[id]/route.ts`.
**Step 1:** `queries/blog.ts`: `listBlogPosts()`, `getBlogPost(id)`, `upsertBlogPost(...)`, `publishBlogPost(id)`.
**Step 2:** `BlogEditor.tsx`: contentEditable (fork NieuwsbriefEditor) + slug/status/excerpt-velden +
"Publiceren" knop (POST/PUT naar api/admin/blog). Merge-tags niet nodig; wel link-knop.
**Step 3:** API routes (Zod `z.string().min(1)` voor id; slug unique-handling bij upsert).
**Step 4:** tsc + e2e (`upsertBlogPost` + `publishBlogPost` via script, assert status='gepubliceerd') → commit.

### Taak 5.3 — Publieke blog-pagina (SEO-ready)
**Objective:** vaarsamen.nl/blog (lijst) + /blog/[slug] (artikel met JSON-LD).
**Files:** Create `src/app/blog/page.tsx` (server, `getSessionSafe()` patroon), `src/app/blog/[slug]/page.tsx`.
**Step 1:** Lijst toont gepubliceerde posts (titel, excerpt, datum). Artikel-pagina injecteert
`<script type="application/ld+json">{jsonLd}</script>` uit `blog_seo`, `<title>` + `meta
description` via Next `metadata` export, plus `generateStaticParams` optioneel.
**Step 2:** tsc + curl `/blog` (anoniem, HTTP 200, titels aanwezig). Commit.

### Taak 5.4 — AI SEO-tool
**Objective:** Knop in BlogEditor genereert SEO-pakket (titel, slug, meta, focus-keyword, JSON-LD, score).
**Files:** Create `src/app/api/admin/blog/[id]/ai-seo/route.ts` (streaming via `streamToController`).
**Step 1:** Route haalt post, bouwt prompt: "Jij bent een SEO-specialist. Voor dit NL-artikel lever:
(1) SEO-titel <=60 chars, (2) slug (kebab-case, NL), (3) meta-beschrijving <=155 chars, (4)
focus-keyword, (5) 3 internal-link suggesties, (6) leesbaarheidsscore 0-100 + 1 verbetertip.
Antwoord als JSON." Roept OpenRouter met `maxTokens: 1200`.
**Step 2:** Omdat we JSON willen (geen stream nodig voor parse), voeg een `completeAi(opts)` helper
toe aan `src/lib/ai.ts` die de full response parsed (niet-stream). BlogEditor roept die aan en
vult de SEO-velden + toont score. Sla op via PATCH naar `api/admin/blog/[id]` (seo-velden).
**Step 3:** tsc + e2e (roep `completeAi` met sample-artikel, assert JSON parse + velden aanwezig) → commit.

---

## Fase 6 — Verificatie & deploy

- [ ] `npx tsc --noEmit -p tsconfig.json` → exit 0 (code-gate; next build segfault hier).
- [ ] Per module: e2e query-script tegen Neon print verwachte shape (zie vaarsamen-nextjs-app
      "dev-server flakiness" recept).
- [ ] Anonieme curl op `/blog` + `/admin` (laatste → 307 naar /login, verwacht).
- [ ] `git add -A && git commit -m "feat: platform admin — scholen/crm/nieuwsbrief/blog + AI SEO"`
- [ ] `git push` naar `main`; Vercel deploy >60s — wacht op `vercel inspect` Branch: main.
- [ ] Prod-check: `GET /api/auth/providers` live; headless demo-login als admin (voeg admin-UUID
      toe aan `DEMO_ACCOUNTS` indien nodig) en curl `/admin/scholen` + `/admin/blog`.

---

## Risico's / aandachtspunten
- **drizzle/meta stuk:** geen generate/push voor kolommen → altijd idempotente tsx-ALTER.
- **Node 3.11 + Turbopack:** next build segfault → tsc + e2e als waarheidsbron.
- **Custom IDs:** geen `z.string().uuid()` op school/fleet/boat/membership id's.
- **OpenRouter kosten:** AI-routes zijn best-effort; faal netjes (try/catch → 500 JSON, geen crash).
- **Resend rate-limit:** nieuwsbrief-verzending bestaat al; niet veranderen tenzij segmentatie.
- **Dupliceer geen WYSIWYG:** BlogEditor fork van NieuwsbriefEditor, herbruik contentEditable-patroon.
