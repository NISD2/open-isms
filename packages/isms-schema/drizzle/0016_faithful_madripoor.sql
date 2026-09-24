-- migration-safety:allow: both constraints are on control_decision, which the
-- previous migration in this same series creates and which is therefore empty on
-- every database that runs this. Validation scans zero rows. The CHECK is the
-- floor under the procedure: it makes a "no object" decision without the register
-- evidence, or a justification with no reasons, unrepresentable rather than merely
-- discouraged.
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_supersedes_control_decision_id_fk" FOREIGN KEY ("supersedes") REFERENCES "public"."control_decision"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "control_decision" ADD CONSTRAINT "control_decision_outcome_evidence" CHECK (
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
      );