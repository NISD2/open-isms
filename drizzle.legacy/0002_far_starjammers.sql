CREATE TABLE "training_lesson_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"course_id" text NOT NULL,
	"lesson_id" text NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"quiz_score" integer,
	"quiz_passed" boolean,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "uq_training_progress_user_course_lesson" UNIQUE("user_id","course_id","lesson_id")
);
--> statement-breakpoint
ALTER TABLE "training_lesson_progress" ADD CONSTRAINT "training_lesson_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "training_lesson_progress" ADD CONSTRAINT "training_lesson_progress_company_id_company_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_training_progress_company_course" ON "training_lesson_progress" USING btree ("company_id","course_id");