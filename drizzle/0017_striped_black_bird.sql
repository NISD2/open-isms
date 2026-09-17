ALTER TABLE "advisory_request" ALTER COLUMN "trigger" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "advisory_request" ALTER COLUMN "timeframe" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "advisory_request" ALTER COLUMN "contact_name" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "advisory_request" ALTER COLUMN "company_name" DROP NOT NULL;