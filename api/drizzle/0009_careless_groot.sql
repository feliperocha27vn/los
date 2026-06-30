DROP TABLE "agenda_calendars" CASCADE;--> statement-breakpoint
DROP TABLE "agenda_event_exceptions" CASCADE;--> statement-breakpoint
DROP TABLE "agenda_events" CASCADE;--> statement-breakpoint
DROP TABLE "agenda_telegram_links" CASCADE;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "notification_offset_minutes";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "timezone";--> statement-breakpoint
DROP TYPE "public"."agenda_event_status";--> statement-breakpoint
DROP TYPE "public"."agenda_exception_action";