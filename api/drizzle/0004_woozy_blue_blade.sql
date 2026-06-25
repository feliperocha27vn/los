CREATE TABLE "study_courses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"position" numeric(20, 10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_modules" (
	"id" text PRIMARY KEY NOT NULL,
	"course_id" text NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"position" numeric(20, 10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "study_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"module_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"position" numeric(20, 10) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "study_courses" ADD CONSTRAINT "study_courses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_modules" ADD CONSTRAINT "study_modules_course_id_study_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."study_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_modules" ADD CONSTRAINT "study_modules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_pages" ADD CONSTRAINT "study_pages_module_id_study_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."study_modules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_pages" ADD CONSTRAINT "study_pages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "study_courses_user_id_idx" ON "study_courses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_courses_user_position_idx" ON "study_courses" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "study_modules_user_id_idx" ON "study_modules" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_modules_user_position_idx" ON "study_modules" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "study_modules_course_id_idx" ON "study_modules" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "study_pages_user_id_idx" ON "study_pages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "study_pages_user_position_idx" ON "study_pages" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "study_pages_module_id_idx" ON "study_pages" USING btree ("module_id");