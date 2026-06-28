import { FinanceTransactionAlreadyLaunchedError } from '@errors/finance-transaction-already-launched-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { LaunchFinanceCreditCardExpenseUseCase } from '@use-cases/finance/credit-card/launch-finance-credit-card-expense'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeTransactionResponseSchema,
  toTransactionListItem,
} from '../transactions/finance-transactions-response'
import {
  financeCreditCardExpenseResponseSchema,
  toCreditCardExpenseResponse,
} from './finance-credit-card-response'

export function patchFinanceCreditCardExpenseLaunchRoute(
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch(
      '/finance/credit-card-expenses/:id/launch',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Mark credit card expense as launched in main',
          params: z.object({ id: z.string() }),
          response: {
            200: z.object({
              expense: financeCreditCardExpenseResponseSchema,
              transaction: financeTransactionResponseSchema,
            }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params

          const useCase = new LaunchFinanceCreditCardExpenseUseCase(
            financeCreditCardExpensesRepository,
            financeTransactionsRepository,
          )
          const { expense, transaction } = await useCase.execute({
            userId,
            expenseId: id,
          })

          const expenseWithCategory = {
            ...expense,
            category: expense.categoryId
              ? await financeCategoriesRepository.findById(expense.categoryId)
              : null,
          }
          const transactionWithCategory = {
            ...transaction,
            category: transaction.categoryId
              ? await financeCategoriesRepository.findById(transaction.categoryId)
              : null,
          }

          return reply.status(200).send({
            expense: toCreditCardExpenseResponse(expenseWithCategory),
            transaction: toTransactionListItem(transactionWithCategory),
          })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          if (error instanceof FinanceTransactionAlreadyLaunchedError) {
            return reply.status(409).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
