CREATE TABLE "close_crm_sync" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"lead_id" varchar(64),
	"contact_id" varchar(64),
	"created_lead" boolean DEFAULT false NOT NULL,
	"fields_hash" varchar(64),
	"synced_at" timestamp,
	"rejected_count" smallint DEFAULT 0 NOT NULL,
	"last_error" varchar(200),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "close_crm_sync_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "close_crm_sync_synced_is_linked" CHECK ("close_crm_sync"."synced_at" IS NULL OR ("close_crm_sync"."lead_id" IS NOT NULL AND "close_crm_sync"."contact_id" IS NOT NULL AND "close_crm_sync"."fields_hash" IS NOT NULL)),
	CONSTRAINT "close_crm_sync_rejected_count_check" CHECK ("close_crm_sync"."rejected_count" >= 0)
);
--> statement-breakpoint
ALTER TABLE "close_crm_sync" ADD CONSTRAINT "close_crm_sync_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;