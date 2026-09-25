CREATE TABLE "order_check" (
	"billing_account_id" uuid PRIMARY KEY NOT NULL,
	"invoice_number" varchar(40) NOT NULL,
	"since" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "order_check" ADD CONSTRAINT "order_check_billing_account_id_billing_account_id_fk" FOREIGN KEY ("billing_account_id") REFERENCES "public"."billing_account"("id") ON DELETE restrict ON UPDATE no action;