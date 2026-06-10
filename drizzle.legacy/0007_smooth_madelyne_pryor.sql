CREATE TABLE "requirement_satisfaction" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requirement_a_id" uuid NOT NULL,
	"requirement_b_id" uuid NOT NULL,
	"rationale" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_satisfaction_pair" UNIQUE("requirement_a_id","requirement_b_id")
);
--> statement-breakpoint
ALTER TABLE "requirement_satisfaction" ADD CONSTRAINT "requirement_satisfaction_requirement_a_id_requirement_id_fk" FOREIGN KEY ("requirement_a_id") REFERENCES "public"."requirement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_satisfaction" ADD CONSTRAINT "requirement_satisfaction_requirement_b_id_requirement_id_fk" FOREIGN KEY ("requirement_b_id") REFERENCES "public"."requirement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_satisfaction_a" ON "requirement_satisfaction" USING btree ("requirement_a_id");--> statement-breakpoint
CREATE INDEX "idx_satisfaction_b" ON "requirement_satisfaction" USING btree ("requirement_b_id");