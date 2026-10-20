CREATE TABLE "close_invite_sync" (
	"invite_id" varchar(64) PRIMARY KEY NOT NULL,
	"kind" varchar(12) NOT NULL,
	"outcome" varchar(20) NOT NULL,
	"lead_id" varchar(64),
	"contact_id" varchar(64),
	"handled_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "close_invite_sync_kind_check" CHECK ("close_invite_sync"."kind" IN ('team', 'supplier')),
	CONSTRAINT "close_invite_sync_outcome_check" CHECK ("close_invite_sync"."outcome" IN ('added', 'already_in_close', 'refused')),
	CONSTRAINT "close_invite_sync_in_close_has_ids" CHECK (("close_invite_sync"."outcome" = 'refused') OR ("close_invite_sync"."lead_id" IS NOT NULL AND "close_invite_sync"."contact_id" IS NOT NULL))
);
