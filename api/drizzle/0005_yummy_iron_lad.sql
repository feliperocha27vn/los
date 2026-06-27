CREATE TABLE "tracker_habits" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"position" numeric(20, 10) NOT NULL,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracker_records" (
	"id" text PRIMARY KEY NOT NULL,
	"habit_id" text NOT NULL,
	"user_id" text NOT NULL,
	"date" date NOT NULL,
	"completed" boolean DEFAULT false NOT NULL,
	"energy" text,
	"quality" text,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tracker_habits" ADD CONSTRAINT "tracker_habits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_records" ADD CONSTRAINT "tracker_records_habit_id_tracker_habits_id_fk" FOREIGN KEY ("habit_id") REFERENCES "public"."tracker_habits"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracker_records" ADD CONSTRAINT "tracker_records_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tracker_records_habit_id_date_idx" ON "tracker_records" USING btree ("habit_id","date");--> statement-breakpoint
CREATE INDEX "tracker_habits_user_id_idx" ON "tracker_habits" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tracker_habits_user_position_idx" ON "tracker_habits" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "tracker_records_user_id_idx" ON "tracker_records" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tracker_records_user_date_idx" ON "tracker_records" USING btree ("user_id","date");--> statement-breakpoint
CREATE INDEX "tracker_records_user_habit_date_idx" ON "tracker_records" USING btree ("user_id","habit_id","date");