-- migration-safety:allow: the foreign key is on supplier_contact, created empty in this same
-- migration, so validating it scans no rows.
CREATE TABLE "supplier_contact" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"relationship_id" uuid NOT NULL,
	"email" varchar(255) NOT NULL,
	"access_token" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_contact_access_token_unique" UNIQUE("access_token"),
	CONSTRAINT "supplier_contact_email_lowercase" CHECK ("supplier_contact"."email" = lower("supplier_contact"."email")),
	CONSTRAINT "supplier_contact_token_hex" CHECK ("supplier_contact"."access_token" ~ '^[0-9a-f]{64}$')
);
--> statement-breakpoint
ALTER TABLE "supplier_contact" ADD CONSTRAINT "supplier_contact_relationship_id_supplier_id_fk" FOREIGN KEY ("relationship_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_supplier_contact_pair" ON "supplier_contact" USING btree ("relationship_id","email");--> statement-breakpoint
CREATE INDEX "idx_supplier_contact_relationship" ON "supplier_contact" USING btree ("relationship_id");