-- migration-safety:allow: every constraint here is on a table this same migration
-- creates (control, requirement_control), so validation scans zero rows and cannot
-- fail on existing data. NOT VALID plus a later VALIDATE would add a second
-- migration to check nothing. The one column added to an existing table,
-- requirement.addressee, is NOT NULL with a default, which Postgres 11 and later
-- fill without rewriting the table.
CREATE TYPE "public"."addressee" AS ENUM('all', 'critical_installation', 'service_type_60_1', 'sector_35_2');--> statement-breakpoint
CREATE TYPE "public"."control_grade" AS ENUM('required', 'expected', 'optional');--> statement-breakpoint
CREATE TABLE "baustein" (
	"id" varchar(16) NOT NULL,
	"edition" varchar(32) NOT NULL,
	"title" text,
	"url" text NOT NULL,
	"source_sha256" varchar(64) NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"issues" text[],
	"extracted_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "baustein_id_edition_pk" PRIMARY KEY("id","edition")
);
--> statement-breakpoint
CREATE TABLE "control" (
	"id" varchar(32) NOT NULL,
	"edition" varchar(32) NOT NULL,
	"baustein_id" varchar(16) NOT NULL,
	"number" integer NOT NULL,
	"grade" "control_grade" NOT NULL,
	"title" text,
	"withdrawn" boolean DEFAULT false NOT NULL,
	CONSTRAINT "control_id_edition_pk" PRIMARY KEY("id","edition")
);
--> statement-breakpoint
CREATE TABLE "requirement_control" (
	"requirement_id" uuid NOT NULL,
	"control_id" varchar(32) NOT NULL,
	"edition" varchar(32) NOT NULL,
	"provenance" varchar(16) DEFAULT 'ours' NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "requirement_control_requirement_id_control_id_edition_pk" PRIMARY KEY("requirement_id","control_id","edition")
);
--> statement-breakpoint
ALTER TABLE "requirement" ADD COLUMN "addressee" "addressee" DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE "control" ADD CONSTRAINT "control_baustein_fk" FOREIGN KEY ("baustein_id","edition") REFERENCES "public"."baustein"("id","edition") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_control" ADD CONSTRAINT "requirement_control_requirement_id_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirement"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_control" ADD CONSTRAINT "requirement_control_control_fk" FOREIGN KEY ("control_id","edition") REFERENCES "public"."control"("id","edition") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_control_baustein" ON "control" USING btree ("baustein_id","edition");--> statement-breakpoint
CREATE INDEX "idx_control_grade" ON "control" USING btree ("grade");--> statement-breakpoint
CREATE INDEX "idx_requirement_control_requirement" ON "requirement_control" USING btree ("requirement_id");--> statement-breakpoint
CREATE INDEX "idx_requirement_control_control" ON "requirement_control" USING btree ("control_id","edition");