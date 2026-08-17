CREATE TYPE "public"."series_state" AS ENUM('watching', 'paused', 'finished');--> statement-breakpoint
CREATE TABLE "series" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"state" "series_state" DEFAULT 'watching' NOT NULL,
	"season" integer DEFAULT 1 NOT NULL,
	"episode" integer DEFAULT 1 NOT NULL,
	"position_seconds" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "series" ADD CONSTRAINT "series_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "series_user_id_state_updated_at_idx" ON "series" USING btree ("user_id","state","updated_at");