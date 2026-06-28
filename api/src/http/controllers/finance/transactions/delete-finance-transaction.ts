import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { DeleteFinanceTransactionUseCase } from '@use-cases/finance/transactions/delete-finance-transaction'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function deleteFinanceTransactionRoute(
  financeTransactionsRepository: FinanceTransactionsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete(
      '/finance/transactions/:id',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Delete finance transaction',
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

          const useCase = new DeleteFinanceTransactionUseCase(financeTransactionsRepository)
          await useCase.execute({ userId, transactionId: id })
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
