CREATE TABLE "rate_limit_window" (
	"key" varchar(64) PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_rate_limit_window_cleanup" ON "rate_limit_window" USING btree ("reset_at");