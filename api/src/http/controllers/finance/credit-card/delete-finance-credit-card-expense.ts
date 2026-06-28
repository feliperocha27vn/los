import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import { DeleteFinanceCreditCardExpenseUseCase } from '@use-cases/finance/credit-card/delete-finance-credit-card-expense'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function deleteFinanceCreditCardExpenseRoute(
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete(
      '/finance/credit-card-expenses/:id',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Delete credit card expense',
          params: z.object({ id: z.string() }),
          response: {
            204: z.void(),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params

          const useCase = new DeleteFinanceCreditCardExpenseUseCase(
            financeCreditCardExpensesRepository,
          )
          await useCase.execute({ userId, expenseId: id })
          return reply.status(204).send()
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
