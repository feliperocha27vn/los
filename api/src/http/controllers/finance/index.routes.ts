import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import type { FastifyInstance } from 'fastify'
import { registerFinanceCategoriesRoutes } from './categories/index.routes'
import { registerFinanceCreditCardRoutes } from './credit-card/index.routes'
import { registerFinanceTransactionsRoutes } from './transactions/index.routes'

interface FinanceRoutesDeps {
  financeCategoriesRepository: FinanceCategoriesRepository
  financeTransactionsRepository: FinanceTransactionsRepository
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository
}

export function registerFinanceRoutes(app: FastifyInstance, deps: FinanceRoutesDeps): void {
  registerFinanceCategoriesRoutes(app, deps.financeCategoriesRepository)
  registerFinanceTransactionsRoutes(
    app,
    deps.financeTransactionsRepository,
    deps.financeCategoriesRepository,
  )
  registerFinanceCreditCardRoutes(
    app,
    deps.financeCreditCardExpensesRepository,
    deps.financeTransactionsRepository,
    deps.financeCategoriesRepository,
  )
}
