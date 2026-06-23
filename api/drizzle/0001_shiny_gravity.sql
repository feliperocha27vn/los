CREATE TYPE "public"."cofre_category" AS ENUM('credential', 'secure_note', 'api_key');--> statement-breakpoint
CREATE TABLE "cofre_entries" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category" "cofre_category" NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"username" text,
	"password_enc" text,
	"content_enc" text,
	"provider" text,
	"token_enc" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_hash" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pin_locked_until" timestamp;--> statement-breakpoint
ALTER TABLE "cofre_entries" ADD CONSTRAINT "cofre_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;