import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import type { FastifyInstance } from 'fastify'
import { deleteFinanceCreditCardExpenseRoute } from './delete-finance-credit-card-expense'
import { getFinanceCreditCardExpenseDetailRoute } from './get-finance-credit-card-expense-detail'
import { getFinanceCreditCardExpensesRoute } from './get-finance-credit-card-expenses'
import { patchFinanceCreditCardExpenseLaunchRoute } from './patch-finance-credit-card-expense-launch'
import { patchFinanceCreditCardExpenseUnlaunchRoute } from './patch-finance-credit-card-expense-unlaunch'
import { postFinanceCreditCardExpenseRoute } from './post-finance-credit-card-expense'
import { putFinanceCreditCardExpenseRoute } from './put-finance-credit-card-expense'

export function registerFinanceCreditCardRoutes(
  app: FastifyInstance,
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): void {
  app
    .register(
      getFinanceCreditCardExpensesRoute(
        financeCreditCardExpensesRepository,
        financeCategoriesRepository,
      ),
    )
    .register(
      getFinanceCreditCardExpenseDetailRoute(
        financeCreditCardExpensesRepository,
        financeCategoriesRepository,
      ),
    )
    .register(
      postFinanceCreditCardExpenseRoute(
        financeCreditCardExpensesRepository,
        financeCategoriesRepository,
      ),
    )
    .register(
      putFinanceCreditCardExpenseRoute(
        financeCreditCardExpensesRepository,
        financeCategoriesRepository,
      ),
    )
    .register(deleteFinanceCreditCardExpenseRoute(financeCreditCardExpensesRepository))
    .register(
      patchFinanceCreditCardExpenseLaunchRoute(
        financeCreditCardExpensesRepository,
        financeTransactionsRepository,
        financeCategoriesRepository,
      ),
    )
    .register(
      patchFinanceCreditCardExpenseUnlaunchRoute(
        financeCreditCardExpensesRepository,
        financeTransactionsRepository,
        financeCategoriesRepository,
      ),
    )
}
