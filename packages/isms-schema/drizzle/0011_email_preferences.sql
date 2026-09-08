CREATE TABLE "email_preference" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"scope" varchar(100) NOT NULL,
	"source" varchar(40) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_preference" ADD CONSTRAINT "email_preference_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_email_preference_user" ON "email_preference" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_email_preference_user_scope" ON "email_preference" USING btree ("user_id","scope");