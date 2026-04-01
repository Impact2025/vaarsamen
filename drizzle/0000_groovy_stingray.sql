CREATE TYPE "public"."boat_type" AS ENUM('valk', 'polyvalk', 'laser', 'laser_pico', 'rs_feva', 'kajuitjacht', 'catamaran', 'anders');--> statement-breakpoint
CREATE TYPE "public"."cwo_level" AS ENUM('geen', 'cwo1', 'cwo2', 'cwo3', 'cwo4', 'cwo_kielboot1', 'cwo_kielboot2', 'cwo_kielboot3');--> statement-breakpoint
CREATE TYPE "public"."looking_for" AS ENUM('dagje_varen', 'weekend', 'regatta', 'zeilvakantie', 'alles');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('active', 'archived', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."rental_status" AS ENUM('aangevraagd', 'goedgekeurd', 'afgewezen', 'geannuleerd');--> statement-breakpoint
CREATE TYPE "public"."report_reason" AS ENUM('ongepast_gedrag', 'nep_profiel', 'spam', 'minderjarig', 'anders');--> statement-breakpoint
CREATE TYPE "public"."sailing_role" AS ENUM('schipper', 'bemanning', 'beide');--> statement-breakpoint
CREATE TYPE "public"."school_role" AS ENUM('eigenaar', 'instructeur', 'cursist');--> statement-breakpoint
CREATE TYPE "public"."skill_score" AS ENUM('aangeboden', 'matig', 'redelijk', 'beheerst');--> statement-breakpoint
CREATE TYPE "public"."subscription_tier" AS ENUM('free', 'actief', 'schipper_pro');--> statement-breakpoint
CREATE TYPE "public"."swipe_action" AS ENUM('like', 'pass', 'superlike');--> statement-breakpoint
CREATE TYPE "public"."tocht_status" AS ENUM('open', 'vol', 'gevaren', 'geannuleerd');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text
);
--> statement-breakpoint
CREATE TABLE "availability" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"date" date NOT NULL,
	"is_available" boolean DEFAULT true,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "boat_rentals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"boot_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"datum" date NOT NULL,
	"start_tijd" varchar(5) NOT NULL,
	"eind_tijd" varchar(5) NOT NULL,
	"opmerking" text,
	"reactie" text,
	"status" "rental_status" DEFAULT 'aangevraagd' NOT NULL,
	"beoordeeld_door" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "boats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text,
	"type" "boat_type" NOT NULL,
	"brand" text,
	"length" real,
	"home_port" text,
	"is_available" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "club_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"club_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city" text,
	"website" text,
	"logo_url" text,
	"admin_user_id" uuid,
	"tier" varchar(20) DEFAULT 'basis',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lesson_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"instructeur_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "lesson_students" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"boot_id" uuid,
	"solo_gevaren" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_a_id" uuid NOT NULL,
	"profile_b_id" uuid NOT NULL,
	"status" "match_status" DEFAULT 'active',
	"has_sailed" boolean DEFAULT false,
	"matched_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"is_read" boolean DEFAULT false,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"age" integer,
	"bio" text,
	"photo_url" text,
	"photo_urls" text[],
	"postcode" varchar(7),
	"city" text,
	"province" text,
	"home_port" text,
	"lat" real,
	"lng" real,
	"search_radius_km" integer DEFAULT 50,
	"cwo_level" "cwo_level" DEFAULT 'geen',
	"sailing_role" "sailing_role" DEFAULT 'beide',
	"looking_for" "looking_for" DEFAULT 'alles',
	"experience_years" integer,
	"sailing_areas" text[],
	"skill_tags" text[],
	"cwo_verified" boolean DEFAULT false,
	"cwo_document_url" text,
	"cwo_verified_at" timestamp,
	"cwo_verified_by" uuid,
	"subscription_tier" "subscription_tier" DEFAULT 'free',
	"subscription_until" date,
	"is_onboarded" boolean DEFAULT false,
	"is_visible" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"last_active" timestamp DEFAULT now(),
	"average_rating" real,
	"review_count" integer DEFAULT 0,
	"deleted_at" timestamp,
	"deleted_by" uuid,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"reported_id" uuid NOT NULL,
	"reason" "report_reason" NOT NULL,
	"description" text,
	"status" varchar(20) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" uuid
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"text" text,
	"sailed_date" date,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sailing_schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"straat" text,
	"huisnummer" text,
	"postcode" varchar(8),
	"city" text,
	"website" text,
	"logo_url" text,
	"owner_user_id" uuid NOT NULL,
	"verhuur_tarieven" jsonb,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "sailing_schools_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "school_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" text NOT NULL,
	"cwo_level" "cwo_level" DEFAULT 'cwo_kielboot2',
	"description" text,
	"start_date" date,
	"end_date" date,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_fleet" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"boot_nummer" text NOT NULL,
	"boot_type" "boat_type",
	"naam" text,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"token" text NOT NULL,
	"role" "school_role" DEFAULT 'cursist' NOT NULL,
	"label" text,
	"max_uses" integer,
	"used_count" integer DEFAULT 0 NOT NULL,
	"expires_at" timestamp,
	"created_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "school_lessons" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"school_id" uuid NOT NULL,
	"datum" date NOT NULL,
	"wind_richting" varchar(5),
	"wind_kracht" integer,
	"instructeur_id" uuid,
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "school_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "school_role" NOT NULL,
	"joined_at" timestamp DEFAULT now(),
	"deleted_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lesson_id" uuid NOT NULL,
	"student_user_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"score" "skill_score" NOT NULL,
	"instructeur_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "skill_definitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cwo_level" "cwo_level" NOT NULL,
	"code" varchar(20) NOT NULL,
	"naam" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swipe_daily_counts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"date" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"swiper_id" uuid NOT NULL,
	"swiped_id" uuid NOT NULL,
	"action" "swipe_action" NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tocht_aanmeldingen" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tocht_id" uuid NOT NULL,
	"profile_id" uuid NOT NULL,
	"bericht" text,
	"status" varchar(20) DEFAULT 'wacht',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tocht_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tocht_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"reviewee_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"text" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tochten" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"titel" text NOT NULL,
	"beschrijving" text,
	"datum" date NOT NULL,
	"vertrek_tijd" varchar(5),
	"vaargebied" text NOT NULL,
	"locatie" text,
	"boot_type" "boat_type",
	"cwo_minimum" "cwo_level" DEFAULT 'geen',
	"aantal_plaatsen" integer DEFAULT 1,
	"status" "tocht_status" DEFAULT 'open',
	"deleted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"image" text,
	"email_verified" timestamp,
	"is_admin" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability" ADD CONSTRAINT "availability_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_rentals" ADD CONSTRAINT "boat_rentals_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_rentals" ADD CONSTRAINT "boat_rentals_boot_id_school_fleet_id_fk" FOREIGN KEY ("boot_id") REFERENCES "public"."school_fleet"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_rentals" ADD CONSTRAINT "boat_rentals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boat_rentals" ADD CONSTRAINT "boat_rentals_beoordeeld_door_users_id_fk" FOREIGN KEY ("beoordeeld_door") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "boats" ADD CONSTRAINT "boats_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "club_members" ADD CONSTRAINT "club_members_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clubs" ADD CONSTRAINT "clubs_admin_user_id_users_id_fk" FOREIGN KEY ("admin_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_lesson_id_school_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."school_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_notes" ADD CONSTRAINT "lesson_notes_instructeur_id_users_id_fk" FOREIGN KEY ("instructeur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_students" ADD CONSTRAINT "lesson_students_lesson_id_school_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."school_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_students" ADD CONSTRAINT "lesson_students_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_students" ADD CONSTRAINT "lesson_students_boot_id_school_fleet_id_fk" FOREIGN KEY ("boot_id") REFERENCES "public"."school_fleet"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile_a_id_profiles_id_fk" FOREIGN KEY ("profile_a_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile_b_id_profiles_id_fk" FOREIGN KEY ("profile_b_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_profiles_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_cwo_verified_by_users_id_fk" FOREIGN KEY ("cwo_verified_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_profiles_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reported_id_profiles_id_fk" FOREIGN KEY ("reported_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewee_id_profiles_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sailing_schools" ADD CONSTRAINT "sailing_schools_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_courses" ADD CONSTRAINT "school_courses_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_fleet" ADD CONSTRAINT "school_fleet_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_invites" ADD CONSTRAINT "school_invites_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_invites" ADD CONSTRAINT "school_invites_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_lessons" ADD CONSTRAINT "school_lessons_course_id_school_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."school_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_lessons" ADD CONSTRAINT "school_lessons_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_lessons" ADD CONSTRAINT "school_lessons_instructeur_id_users_id_fk" FOREIGN KEY ("instructeur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_memberships" ADD CONSTRAINT "school_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_lesson_id_school_lessons_id_fk" FOREIGN KEY ("lesson_id") REFERENCES "public"."school_lessons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_student_user_id_users_id_fk" FOREIGN KEY ("student_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_skill_id_skill_definitions_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill_definitions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_assessments" ADD CONSTRAINT "skill_assessments_instructeur_id_users_id_fk" FOREIGN KEY ("instructeur_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipe_daily_counts" ADD CONSTRAINT "swipe_daily_counts_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiper_id_profiles_id_fk" FOREIGN KEY ("swiper_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipes" ADD CONSTRAINT "swipes_swiped_id_profiles_id_fk" FOREIGN KEY ("swiped_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tocht_aanmeldingen" ADD CONSTRAINT "tocht_aanmeldingen_tocht_id_tochten_id_fk" FOREIGN KEY ("tocht_id") REFERENCES "public"."tochten"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tocht_aanmeldingen" ADD CONSTRAINT "tocht_aanmeldingen_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tocht_reviews" ADD CONSTRAINT "tocht_reviews_tocht_id_tochten_id_fk" FOREIGN KEY ("tocht_id") REFERENCES "public"."tochten"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tocht_reviews" ADD CONSTRAINT "tocht_reviews_reviewer_id_profiles_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tocht_reviews" ADD CONSTRAINT "tocht_reviews_reviewee_id_profiles_id_fk" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tochten" ADD CONSTRAINT "tochten_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "boat_rentals_boot_user_datum_uniq" ON "boat_rentals" USING btree ("boot_id","user_id","datum");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_notes_lesson_student_uniq" ON "lesson_notes" USING btree ("lesson_id","student_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_students_lesson_student_uniq" ON "lesson_students" USING btree ("lesson_id","student_user_id");--> statement-breakpoint
CREATE INDEX "lesson_students_lesson_id_idx" ON "lesson_students" USING btree ("lesson_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_invites_token_uniq" ON "school_invites" USING btree ("token");--> statement-breakpoint
CREATE INDEX "school_lessons_course_id_idx" ON "school_lessons" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "school_lessons_school_id_idx" ON "school_lessons" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "school_memberships_school_user_uniq" ON "school_memberships" USING btree ("school_id","user_id");--> statement-breakpoint
CREATE INDEX "school_memberships_school_deleted_idx" ON "school_memberships" USING btree ("school_id","deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_assessments_lesson_student_skill_uniq" ON "skill_assessments" USING btree ("lesson_id","student_user_id","skill_id");--> statement-breakpoint
CREATE INDEX "skill_assessments_lesson_id_idx" ON "skill_assessments" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "skill_assessments_student_id_idx" ON "skill_assessments" USING btree ("student_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_definitions_cwo_code_uniq" ON "skill_definitions" USING btree ("cwo_level","code");--> statement-breakpoint
CREATE UNIQUE INDEX "swipe_daily_counts_profile_date_uniq" ON "swipe_daily_counts" USING btree ("profile_id","date");--> statement-breakpoint
CREATE UNIQUE INDEX "tocht_reviews_uniq" ON "tocht_reviews" USING btree ("tocht_id","reviewer_id","reviewee_id");