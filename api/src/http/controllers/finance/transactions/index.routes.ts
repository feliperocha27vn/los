import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import type { FastifyInstance } from 'fastify'
import { getFinanceSummaryRoute } from '../summary/get-finance-summary'
import { deleteFinanceTransactionRoute } from './delete-finance-transaction'
import { getFinanceTransactionDetailRoute } from './get-finance-transaction-detail'
import { getFinanceTransactionsRoute } from './get-finance-transactions'
import { postFinanceTransactionRoute } from './post-finance-transaction'
import { putFinanceTransactionRoute } from './put-finance-transaction'

export function registerFinanceTransactionsRoutes(
  app: FastifyInstance,
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): void {
  app
    .register(
      getFinanceTransactionsRoute(financeTransactionsRepository, financeCategoriesRepository),
    )
    .register(
      getFinanceTransactionDetailRoute(financeTransactionsRepository, financeCategoriesRepository),
    )
    .register(
      postFinanceTransactionRoute(financeTransactionsRepository, financeCategoriesRepository),
    )
    .register(
      putFinanceTransactionRoute(financeTransactionsRepository, financeCategoriesRepository),
    )
    .register(deleteFinanceTransactionRoute(financeTransactionsRepository))
    .register(getFinanceSummaryRoute(financeTransactionsRepository))
}
