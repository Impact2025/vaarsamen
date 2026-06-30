CREATE TYPE "public"."subscription_status" AS ENUM('trialing', 'active', 'canceled', 'incomplete', 'past_due');--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"stripe_invoice_id" text NOT NULL,
	"amount_paid" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'eur' NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"paid_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"status" "subscription_status" DEFAULT 'incomplete' NOT NULL,
	"price_id" text NOT NULL,
	"current_period_end" timestamp,
	"cancel_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_school_id_sailing_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."sailing_schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoices_school_idx" ON "invoices" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_school_uniq" ON "subscriptions" USING btree ("school_id");