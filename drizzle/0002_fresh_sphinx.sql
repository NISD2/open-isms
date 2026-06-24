CREATE TABLE "newsletter_group" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" varchar(500),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "newsletter_group_member" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_newsletter_group_member" UNIQUE("group_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "newsletter_issue" ADD COLUMN "target_group_id" uuid;--> statement-breakpoint
ALTER TABLE "newsletter_group_member" ADD CONSTRAINT "newsletter_group_member_group_id_newsletter_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."newsletter_group"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_group_member" ADD CONSTRAINT "newsletter_group_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_newsletter_group_created" ON "newsletter_group" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_newsletter_group_member_group" ON "newsletter_group_member" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "idx_newsletter_group_member_user" ON "newsletter_group_member" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "newsletter_issue" ADD CONSTRAINT "newsletter_issue_target_group_id_newsletter_group_id_fk" FOREIGN KEY ("target_group_id") REFERENCES "public"."newsletter_group"("id") ON DELETE set null ON UPDATE no action;