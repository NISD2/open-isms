ALTER TABLE "incident" ADD COLUMN "notified_data_subjects_at" timestamp;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "processes_only_on_instructions" boolean;--> statement-breakpoint
ALTER TABLE "supplier" ADD COLUMN "assists_with_data_subject_rights" boolean;