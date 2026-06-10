CREATE TABLE "gap_assessment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid,
	"answers" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"scores" jsonb,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gap_assessment" ADD CONSTRAINT "gap_assessment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gap_assessment" ADD CONSTRAINT "gap_assessment_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_gap_assessment_user" ON "gap_assessment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_gap_assessment_company" ON "gap_assessment" USING btree ("company_id");