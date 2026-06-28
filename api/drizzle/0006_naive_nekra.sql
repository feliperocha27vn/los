CREATE TYPE "public"."finance_category_type" AS ENUM('expense', 'income');--> statement-breakpoint
CREATE TYPE "public"."finance_transaction_source" AS ENUM('principal', 'credit_card');--> statement-breakpoint
CREATE TYPE "public"."finance_transaction_type" AS ENUM('expense', 'income');--> statement-breakpoint
CREATE TABLE "finance_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "finance_category_type" NOT NULL,
	"color" text NOT NULL
);--> statement-breakpoint
INSERT INTO "finance_categories" ("id", "name", "type", "color") VALUES
	('cat-alimentacao', 'Alimentação', 'expense', '#ef4444'),
	('cat-transporte', 'Transporte', 'expense', '#f59e0b'),
	('cat-moradia', 'Moradia', 'expense', '#3b82f6'),
	('cat-saude', 'Saúde', 'expense', '#10b981'),
	('cat-lazer', 'Lazer', 'expense', '#a855f7'),
	('cat-educacao', 'Educação', 'expense', '#06b6d4'),
	('cat-outros', 'Outros', 'expense', '#71717a'),
	('cat-salario', 'Salário', 'income', '#22c55e'),
	('cat-freelance', 'Freelance', 'income', '#14b8a6'),
	('cat-investimentos', 'Investimentos', 'income', '#eab308');
--> statement-breakpoint
CREATE TABLE "finance_credit_card_expenses" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text,
	"description" text NOT NULL,
	"total_amount" numeric(20, 10) NOT NULL,
	"my_share_amount" numeric(20, 10) NOT NULL,
	"date" date NOT NULL,
	"launched_in_main" boolean DEFAULT false NOT NULL,
	"linked_transaction_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_installments" (
	"id" text PRIMARY KEY NOT NULL,
	"transaction_id" text NOT NULL,
	"installment_number" integer NOT NULL,
	"amount" numeric(20, 10) NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"category_id" text,
	"type" "finance_transaction_type" NOT NULL,
	"description" text NOT NULL,
	"total_amount" numeric(20, 10) NOT NULL,
	"installments_count" integer DEFAULT 1 NOT NULL,
	"source" "finance_transaction_source" DEFAULT 'principal' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance_credit_card_expenses" ADD CONSTRAINT "finance_credit_card_expenses_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_credit_card_expenses" ADD CONSTRAINT "finance_credit_card_expenses_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_credit_card_expenses" ADD CONSTRAINT "finance_credit_card_expenses_linked_transaction_id_finance_transactions_id_fk" FOREIGN KEY ("linked_transaction_id") REFERENCES "public"."finance_transactions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_installments" ADD CONSTRAINT "finance_installments_transaction_id_finance_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."finance_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance_transactions" ADD CONSTRAINT "finance_transactions_category_id_finance_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance_categories"("id") ON DELETE no action ON UPDATE no action;