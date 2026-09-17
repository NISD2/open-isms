CREATE TABLE "advisory_partner" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(60) NOT NULL,
	"name" varchar(200) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "advisory_partner_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "idx_advisory_partner_active" ON "advisory_partner" USING btree ("active");