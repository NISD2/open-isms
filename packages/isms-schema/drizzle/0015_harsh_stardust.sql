CREATE TYPE "public"."control_outcome" AS ENUM('done', 'no_object', 'covered_otherwise', 'justified', 'deferred');--> statement-breakpoint
CREATE TYPE "public"."settled_fact" AS ENUM('yes', 'no', 'unsettled');--> statement-breakpoint
CREATE TABLE "control_decision" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"control_id" varchar(32) NOT NULL,
	"edition" varchar(32) NOT NULL,
	"outcome" "control_outcome" NOT NULL,
	"reason" text,
	"evidence_module" varchar(50),
	"evidence_count" integer,
	"evidence_at" timestamp,
	"justification" jsonb,
	"deferred_until" timestamp,
	"deferred_until_module" varchar(50),
	"decided_by" uuid NOT NULL,
	"decided_at" timestamp DEFAULT now() NOT NULL,
	"supersedes" uuid
);
--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "critical_installation" "settled_fact" DEFAULT 'unsettled' NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "service_types" text[];--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_control_fk" FOREIGN KEY ("control_id","edition") REFERENCES "public"."control"("id","edition") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_control_decision_current" ON "control_decision" USING btree ("company_id","control_id","decided_at");--> statement-breakpoint
CREATE INDEX "idx_control_decision_company" ON "control_decision" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_control_decision_supersedes" ON "control_decision" USING btree ("supersedes");