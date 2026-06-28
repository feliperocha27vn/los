import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import { GetFinanceCreditCardExpenseDetailUseCase } from '@use-cases/finance/credit-card/get-finance-credit-card-expense-detail'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeCreditCardExpenseResponseSchema,
  toCreditCardExpenseResponse,
} from './finance-credit-card-response'

export function getFinanceCreditCardExpenseDetailRoute(
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/finance/credit-card-expenses/:id',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Get credit card expense detail',
          params: z.object({ id: z.string() }),
          response: {
            200: z.object({
              expense: financeCreditCardExpenseResponseSchema,
            }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params

          const useCase = new GetFinanceCreditCardExpenseDetailUseCase(
            financeCreditCardExpensesRepository,
            financeCategoriesRepository,
          )
          const { expense } = await useCase.execute({
            userId,
            expenseId: id,
          })
          return reply.status(200).send({ expense: toCreditCardExpenseResponse(expense) })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
