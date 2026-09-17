CREATE TABLE "advisory_referral" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"partner" varchar(60) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"fee_cents" integer,
	"paid_at" timestamp,
	"note" text
);
--> statement-breakpoint
DROP INDEX "idx_advisory_request_forwarded";--> statement-breakpoint
ALTER TABLE "advisory_referral" ADD CONSTRAINT "advisory_referral_request_id_advisory_request_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."advisory_request"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_advisory_referral_request" ON "advisory_referral" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "idx_advisory_referral_sent" ON "advisory_referral" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "idx_advisory_referral_partner" ON "advisory_referral" USING btree ("partner");--> statement-breakpoint
ALTER TABLE "advisory_request" DROP COLUMN "forwarded_at";--> statement-breakpoint
ALTER TABLE "advisory_request" DROP COLUMN "forwarded_to";