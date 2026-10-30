CREATE TABLE "ownership_transfer" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"from_user_id" uuid,
	"to_user_id" uuid,
	"initiated_by" uuid,
	"method" varchar(16) NOT NULL,
	"status" varchar(16) DEFAULT 'pending' NOT NULL,
	"reason" text,
	"decided_by" uuid,
	"decided_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ownership_transfer_status" CHECK ("ownership_transfer"."status" in ('pending', 'accepted', 'cancelled')),
	CONSTRAINT "ownership_transfer_method" CHECK ("ownership_transfer"."method" in ('self_service', 'platform_admin')),
	CONSTRAINT "ownership_transfer_not_to_self" CHECK ("ownership_transfer"."from_user_id" <> "ownership_transfer"."to_user_id"),
	CONSTRAINT "ownership_transfer_decided_iff_closed" CHECK (("ownership_transfer"."status" = 'pending') = ("ownership_transfer"."decided_at" is null)),
	CONSTRAINT "ownership_transfer_expires_after_start" CHECK ("ownership_transfer"."expires_at" > "ownership_transfer"."created_at"),
	CONSTRAINT "ownership_transfer_operator_reasoned" CHECK ("ownership_transfer"."method" <> 'platform_admin' or ("ownership_transfer"."status" = 'accepted' and length(trim("ownership_transfer"."reason")) >= 20))
);
--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_initiated_by_user_id_fk" FOREIGN KEY ("initiated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ownership_transfer" ADD CONSTRAINT "ownership_transfer_decided_by_user_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_ownership_transfer_pending" ON "ownership_transfer" USING btree ("company_id") WHERE "ownership_transfer"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_ownership_transfer_company" ON "ownership_transfer" USING btree ("company_id","created_at");