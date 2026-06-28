import { FinanceTransactionNotLaunchedError } from '@errors/finance-transaction-not-launched-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { UnlaunchFinanceCreditCardExpenseUseCase } from '@use-cases/finance/credit-card/unlaunch-finance-credit-card-expense'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeCreditCardExpenseResponseSchema,
  toCreditCardExpenseResponse,
} from './finance-credit-card-response'

export function patchFinanceCreditCardExpenseUnlaunchRoute(
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch(
      '/finance/credit-card-expenses/:id/unlaunch',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Undo launch of credit card expense',
          params: z.object({ id: z.string() }),
          response: {
            200: z.object({
              expense: financeCreditCardExpenseResponseSchema,
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

          const useCase = new UnlaunchFinanceCreditCardExpenseUseCase(
            financeCreditCardExpensesRepository,
            financeTransactionsRepository,
          )
          const { expense } = await useCase.execute({
            userId,
            expenseId: id,
          })

          const expenseWithCategory = {
            ...expense,
            category: expense.categoryId
              ? await financeCategoriesRepository.findById(expense.categoryId)
              : null,
          }
          return reply
            .status(200)
            .send({ expense: toCreditCardExpenseResponse(expenseWithCategory) })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          if (error instanceof FinanceTransactionNotLaunchedError) {
            return reply.status(409).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
