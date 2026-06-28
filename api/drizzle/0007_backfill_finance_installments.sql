-- Backfill: cria finance_installments para transações existentes sem parcelas
-- (inclui transações geradas por /launch antes da correção em launch-finance-credit-card-expense.ts)

INSERT INTO "finance_installments" ("id", "transaction_id", "installment_number", "amount", "date")
SELECT
  gen_random_uuid()::text,
  t."id",
  1,
  t."total_amount",
  COALESCE(t."created_at"::date, CURRENT_DATE)
FROM "finance_transactions" t
LEFT JOIN "finance_installments" i ON i."transaction_id" = t."id"
WHERE i."id" IS NULL;
