import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { GetFinanceTransactionDetailUseCase } from '@use-cases/finance/transactions/get-finance-transaction-detail'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeInstallmentResponseSchema,
  financeTransactionResponseSchema,
  toInstallmentResponse,
  toTransactionListItem,
} from './finance-transactions-response'

export function getFinanceTransactionDetailRoute(
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/finance/transactions/:id',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Get finance transaction detail',
          params: z.object({ id: z.string() }),
          response: {
            200: z.object({
              transaction: financeTransactionResponseSchema,
              installments: financeInstallmentResponseSchema.array(),
            }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params

          const useCase = new GetFinanceTransactionDetailUseCase(
            financeTransactionsRepository,
            financeCategoriesRepository,
          )
          const { transaction, installments } = await useCase.execute({
            userId,
            transactionId: id,
          })

          return reply.status(200).send({
            transaction: toTransactionListItem({
              ...transaction,
              installmentAmount: null,
              installmentDate: null,
              installmentNumber: null,
            }),
            installments: installments.map(toInstallmentResponse),
          })
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
