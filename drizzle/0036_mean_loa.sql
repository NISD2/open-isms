CREATE TABLE "close_resend_log" (
	"resend_id" varchar(64) PRIMARY KEY NOT NULL,
	"sent_at" timestamp NOT NULL,
	"outcome" varchar(24) NOT NULL,
	"notes" smallint DEFAULT 0 NOT NULL,
	"logged_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "close_resend_log_outcome_check" CHECK ("close_resend_log"."outcome" IN ('noted', 'skipped_not_listed', 'skipped_not_delivered', 'skipped_no_contact')),
	CONSTRAINT "close_resend_log_noted_has_notes" CHECK (("close_resend_log"."outcome" = 'noted') = ("close_resend_log"."notes" > 0))
);
