CREATE TYPE "public"."bpr_status" AS ENUM('ingediend', 'beoordeeld', 'geaccordeerd', 'afgekeurd');--> statement-breakpoint
CREATE TABLE "bpr_recordings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"les_id" uuid,
	"user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"boot_type" "boat_type" NOT NULL,
	"blob_key" text NOT NULL,
	"transcript" text,
	"opmerkingen" text,
	"status" "bpr_status" DEFAULT 'ingediend' NOT NULL,
	"beoordeeld_door" uuid,
	"score" integer,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bpr_recordings" ADD CONSTRAINT "bpr_recordings_les_id_school_lessons_id_fk" FOREIGN KEY ("les_id") REFERENCES "public"."school_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpr_recordings" ADD CONSTRAINT "bpr_recordings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpr_recordings" ADD CONSTRAINT "bpr_recordings_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bpr_recordings" ADD CONSTRAINT "bpr_recordings_beoordeeld_door_users_id_fk" FOREIGN KEY ("beoordeeld_door") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bpr_recordings_school_idx" ON "bpr_recordings" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "bpr_recordings_user_idx" ON "bpr_recordings" USING btree ("user_id");