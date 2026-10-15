CREATE TABLE "mcp_connection" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"kind" varchar(16) NOT NULL,
	"client" varchar(200),
	"key_version" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"last_used_at" timestamp,
	"ended_at" timestamp,
	CONSTRAINT "mcp_connection_kind" CHECK ("mcp_connection"."kind" in ('key', 'signin')),
	CONSTRAINT "mcp_connection_client_on_signin" CHECK ("mcp_connection"."kind" = 'signin' or "mcp_connection"."client" is null),
	CONSTRAINT "mcp_connection_expires_after_made" CHECK ("mcp_connection"."expires_at" > "mcp_connection"."created_at")
);
--> statement-breakpoint
ALTER TABLE "mcp_connection" ADD CONSTRAINT "mcp_connection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mcp_connection" ADD CONSTRAINT "mcp_connection_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_mcp_connection_user_company" ON "mcp_connection" USING btree ("user_id","company_id");