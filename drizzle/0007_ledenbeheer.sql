-- Ledenbeheer: rollen lid/klusser, toegangsstatus en persoonlijke uitnodigingen.
-- Puur additief: bestaande rijen houden hun toegang via de default 'goedgekeurd'.

-- ALTER TYPE ... ADD VALUE mag niet in dezelfde transactie gebruikt worden als
-- de waarde zelf, daarom staan deze statements los en draaien ze als eerste.
ALTER TYPE "school_role" ADD VALUE IF NOT EXISTS 'lid';
--> statement-breakpoint
ALTER TYPE "school_role" ADD VALUE IF NOT EXISTS 'klusser';
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "membership_status" AS ENUM ('onboarding', 'wacht_op_goedkeuring', 'goedgekeurd', 'afgewezen');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

-- Default 'goedgekeurd': leden die al bestonden voordat deze kolom er was,
-- mogen hun toegang niet verliezen. Nieuwe leden krijgen expliciet 'onboarding'.
ALTER TABLE "school_memberships"
  ADD COLUMN IF NOT EXISTS "status"          "membership_status" NOT NULL DEFAULT 'goedgekeurd',
  ADD COLUMN IF NOT EXISTS "onboarding_at"   timestamp,
  ADD COLUMN IF NOT EXISTS "approved_at"     timestamp,
  ADD COLUMN IF NOT EXISTS "approved_by"     uuid REFERENCES "users"("id"),
  ADD COLUMN IF NOT EXISTS "afwijzing_reden" text,
  ADD COLUMN IF NOT EXISTS "telefoon"        varchar(30),
  ADD COLUMN IF NOT EXISTS "ervaring"        text,
  ADD COLUMN IF NOT EXISTS "nood_contact"    varchar(200);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "school_memberships_school_status_idx"
  ON "school_memberships" ("school_id", "status");
--> statement-breakpoint

-- Persoonlijke uitnodiging: email gevuld = gebonden aan één persoon.
-- email NULL = gedeelde link, gedraagt zich zoals voorheen.
ALTER TABLE "school_invites"
  ADD COLUMN IF NOT EXISTS "email"       varchar(255),
  ADD COLUMN IF NOT EXISTS "naam"        varchar(200),
  ADD COLUMN IF NOT EXISTS "accepted_at" timestamp;
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "school_invites_school_email_idx"
  ON "school_invites" ("school_id", "email");
