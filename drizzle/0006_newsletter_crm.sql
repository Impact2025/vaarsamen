-- Nieuwsbrief + CRM module (VaarSamen zeilschool)
-- Double-opt-in nieuwsbrieven, campagne-tracking, CRM contactgeschiedenis
-- en lifecycle/segmentatie-velden op school_memberships.

CREATE TYPE "public"."lifecycle_status" AS ENUM('lead', 'actief', 'inactief', 'oud_cursist', 'opgezegd');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'actief', 'afgemeld', 'gebounced');--> statement-breakpoint
CREATE TYPE "public"."campaign_status" AS ENUM('concept', 'verzonden', 'gepland');--> statement-breakpoint

-- CRM-velden op bestaande school_memberships tabel
ALTER TABLE "school_memberships" ADD COLUMN "lifecycle_status" "lifecycle_status" DEFAULT 'actief' NOT NULL;--> statement-breakpoint
ALTER TABLE "school_memberships" ADD COLUMN "tags" text[];--> statement-breakpoint
ALTER TABLE "school_memberships" ADD COLUMN "geboortedatum" date;--> statement-breakpoint
ALTER TABLE "school_memberships" ADD COLUMN "laatst_contact" timestamp;--> statement-breakpoint
ALTER TABLE "school_memberships" ADD COLUMN "nieuwsbrief" boolean DEFAULT true NOT NULL;

CREATE TABLE "crm_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"auteur_id" uuid NOT NULL,
	"kanaal" varchar(20) DEFAULT 'notitie' NOT NULL,
	"inhoud" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"membership_id" uuid,
	"email" text NOT NULL,
	"naam" text,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"token" text,
	"aangemeld_via" varchar(20) DEFAULT 'school' NOT NULL,
	"confirmed_at" timestamp,
	"afgemeld_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"titel" text NOT NULL,
	"subject" text NOT NULL,
	"inhoud" text NOT NULL,
	"status" "campaign_status" DEFAULT 'concept' NOT NULL,
	"ontvangers" integer DEFAULT 0,
	"opens" integer DEFAULT 0,
	"kliks" integer DEFAULT 0,
	"gepland_voor" timestamp,
	"verzonden_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "newsletter_sends" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"campaign_id" uuid NOT NULL,
	"subscriber_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'verzonden' NOT NULL,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now()
);

ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_membership_id_school_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."school_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notes" ADD CONSTRAINT "crm_notes_auteur_id_users_id_fk" FOREIGN KEY ("auteur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_subscribers" ADD CONSTRAINT "newsletter_subscribers_membership_id_school_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."school_memberships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_campaigns" ADD CONSTRAINT "newsletter_campaigns_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_campaign_id_newsletter_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."newsletter_campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_sends" ADD CONSTRAINT "newsletter_sends_subscriber_id_newsletter_subscribers_id_fk" FOREIGN KEY ("subscriber_id") REFERENCES "public"."newsletter_subscribers"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "crm_notes_school_idx" ON "crm_notes" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "crm_notes_membership_idx" ON "crm_notes" USING btree ("membership_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_school_email_uniq" ON "newsletter_subscribers" USING btree ("school_id","email");--> statement-breakpoint
CREATE INDEX "newsletter_subscribers_school_idx" ON "newsletter_subscribers" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_token_uniq" ON "newsletter_subscribers" USING btree ("token");--> statement-breakpoint
CREATE INDEX "newsletter_campaigns_school_idx" ON "newsletter_campaigns" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "newsletter_sends_campaign_idx" ON "newsletter_sends" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "newsletter_sends_subscriber_idx" ON "newsletter_sends" USING btree ("subscriber_id");
