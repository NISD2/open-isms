CREATE TABLE "close_mail_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email_type" varchar(64) NOT NULL,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"logged_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "close_mail_log" ADD CONSTRAINT "close_mail_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "close_mail_log_unlogged_idx" ON "close_mail_log" USING btree ("sent_at") WHERE "close_mail_log"."logged_at" IS NULL;