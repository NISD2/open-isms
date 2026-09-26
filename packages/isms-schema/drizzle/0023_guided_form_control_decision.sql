-- migration-safety:allow: every constraint here is on control_decision, which this
-- same migration creates, so validation scans zero rows and cannot fail on existing
-- data. The CHECK makes a "no object" decision without the register evidence, or a
-- justification with no reasons, unrepresentable rather than merely discouraged.
-- The two columns added to company are safe on a populated table:
-- critical_installation is NOT NULL with a default, which Postgres 11 and later
-- fill without a rewrite, and service_types is nullable.
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
	"supersedes" uuid,
	CONSTRAINT "control_decision_outcome_evidence" CHECK (
        CASE "control_decision"."outcome"
          WHEN 'no_object' THEN "control_decision"."evidence_module" IS NOT NULL
            AND "control_decision"."evidence_count" IS NOT NULL
            AND "control_decision"."evidence_at" IS NOT NULL
          WHEN 'covered_otherwise' THEN "control_decision"."reason" IS NOT NULL
          WHEN 'justified' THEN "control_decision"."justification" IS NOT NULL
          WHEN 'deferred' THEN "control_decision"."deferred_until" IS NOT NULL
            OR "control_decision"."deferred_until_module" IS NOT NULL
          ELSE TRUE
        END
      )
);
--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "critical_installation" "settled_fact" DEFAULT 'unsettled' NOT NULL;--> statement-breakpoint
ALTER TABLE "company" ADD COLUMN "service_types" text[];--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_supersedes_control_decision_id_fk" FOREIGN KEY ("supersedes") REFERENCES "public"."control_decision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_control_fk" FOREIGN KEY ("control_id","edition") REFERENCES "public"."control"("id","edition") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_control_decision_current" ON "control_decision" USING btree ("company_id","control_id","decided_at");--> statement-breakpoint
CREATE INDEX "idx_control_decision_company" ON "control_decision" USING btree ("company_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_control_decision_supersedes" ON "control_decision" USING btree ("supersedes");