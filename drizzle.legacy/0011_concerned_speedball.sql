CREATE TYPE "public"."equivalence_kind" AS ENUM('equivalent', 'overlapping');--> statement-breakpoint
ALTER TABLE "requirement_satisfaction" ADD COLUMN "equivalence_kind" "equivalence_kind" DEFAULT 'overlapping' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_satisfaction_kind" ON "requirement_satisfaction" USING btree ("equivalence_kind");