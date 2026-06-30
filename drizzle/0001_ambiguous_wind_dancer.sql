CREATE TABLE "boat_availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"boot_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"date_from" varchar(10) NOT NULL,
	"date_to" varchar(10) NOT NULL,
	"reden" text,
	"created_by" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "boat_issues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"boot_id" uuid NOT NULL,
	"rental_id" uuid,
	"reported_by" uuid,
	"titel" varchar(200) NOT NULL,
	"beschrijving" text,
	"status" varchar(30) DEFAULT 'gemeld' NOT NULL,
	"prioriteit" varchar(20) DEFAULT 'normaal',
	"intern_note" text,
	"updated_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "certificates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"level" varchar(50) NOT NULL,
	"issued_at" timestamp DEFAULT now(),
	"expires_at" date,
	"blob_key" text NOT NULL,
	"download_url" text,
	"payload" jsonb
);
--> statement-breakpoint
CREATE TABLE "school_berichten" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"sender_user_id" uuid NOT NULL,
	"inhoud" text NOT NULL,
	"course_id" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
DROP INDEX "skill_definitions_cwo_code_uniq";--> statement-breakpoint
ALTER TABLE "skill_definitions" ALTER COLUMN "cwo_level" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "lesson_students" ADD COLUMN "miles_logboek" jsonb;--> statement-breakpoint
ALTER TABLE "skill_definitions" ADD COLUMN "boot_type" "boat_type";--> statement-breakpoint
ALTER TABLE "boat_availability" ADD CONSTRAINT "boat_availability_boot_id_school_fleet_id_fk" FOREIGN KEY ("boot_id") REFERENCES "public"."school_fleet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_availability" ADD CONSTRAINT "boat_availability_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_issues" ADD CONSTRAINT "boat_issues_boot_id_school_fleet_id_fk" FOREIGN KEY ("boot_id") REFERENCES "public"."school_fleet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_issues" ADD CONSTRAINT "boat_issues_rental_id_boat_rentals_id_fk" FOREIGN KEY ("rental_id") REFERENCES "public"."boat_rentals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_issues" ADD CONSTRAINT "boat_issues_reported_by_users_id_fk" FOREIGN KEY ("reported_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_issues" ADD CONSTRAINT "boat_issues_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "certificates" ADD CONSTRAINT "certificates_course_id_school_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."school_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_berichten" ADD CONSTRAINT "school_berichten_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_berichten" ADD CONSTRAINT "school_berichten_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_berichten" ADD CONSTRAINT "school_berichten_course_id_school_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."school_courses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "boat_issues_school_id_idx" ON "boat_issues" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "boat_issues_boot_id_idx" ON "boat_issues" USING btree ("boot_id");--> statement-breakpoint
CREATE INDEX "certificates_user_id_idx" ON "certificates" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "certificates_school_id_idx" ON "certificates" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_berichten_school_id_idx" ON "school_berichten" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_definitions_code_uniq" ON "skill_definitions" USING btree ("cwo_level","code") WHERE "skill_definitions"."boot_type" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "skill_definitions_boot_code_uniq" ON "skill_definitions" USING btree ("boot_type","code") WHERE "skill_definitions"."cwo_level" IS NULL;