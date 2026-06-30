CREATE TYPE "public"."resource_type" AS ENUM('boot', 'equip', 'instructeur');--> statement-breakpoint
CREATE TABLE "booking_locks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource_id" uuid NOT NULL,
	"lesson_id" uuid,
	"locked_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"type" "resource_type" NOT NULL,
	"boot_id" uuid,
	"user_id" uuid,
	"name" varchar(100) NOT NULL,
	"capacity" integer DEFAULT 1,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_locks" ADD CONSTRAINT "booking_locks_resource_id_school_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."school_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_locks" ADD CONSTRAINT "booking_locks_lesson_id_school_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."school_lessons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_locks" ADD CONSTRAINT "booking_locks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_resources" ADD CONSTRAINT "school_resources_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_resources" ADD CONSTRAINT "school_resources_boot_id_school_fleet_id_fk" FOREIGN KEY ("boot_id") REFERENCES "public"."school_fleet"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_resources" ADD CONSTRAINT "school_resources_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_locks_active_uniq" ON "booking_locks" USING btree ("resource_id","lesson_id") WHERE "booking_locks"."expires_at" > now();--> statement-breakpoint
CREATE INDEX "school_resources_school_idx" ON "school_resources" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "school_resources_type_idx" ON "school_resources" USING btree ("type");