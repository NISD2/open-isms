-- migration-safety:allow: both foreign keys are on processing_activity_supplier, created empty in
-- this same migration, so validating them scans no rows.
CREATE TABLE "processing_activity_supplier" (
	"activity_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "processing_activity_supplier_activity_id_supplier_id_pk" PRIMARY KEY("activity_id","supplier_id")
);
--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "transfer_countries" text;--> statement-breakpoint
ALTER TABLE "processing_activity_supplier" ADD CONSTRAINT "processing_activity_supplier_activity_id_processing_activity_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."processing_activity"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_activity_supplier" ADD CONSTRAINT "processing_activity_supplier_supplier_id_supplier_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_processing_activity_supplier_supplier" ON "processing_activity_supplier" USING btree ("supplier_id");