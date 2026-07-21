CREATE TYPE "public"."task_category" AS ENUM('work', 'personal', 'other');--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "category" "task_category" DEFAULT 'other' NOT NULL;