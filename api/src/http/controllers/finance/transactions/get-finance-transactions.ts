import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { FetchFinanceTransactionsUseCase } from '@use-cases/finance/transactions/fetch-finance-transactions'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeTransactionResponseSchema,
  financeTransactionTypeSchema,
  toTransactionListItem,
} from './finance-transactions-response'

export function getFinanceTransactionsRoute(
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/finance/transactions',
      {
        schema: {
          tags: ['Finance'],
          summary: 'List finance transactions',
          querystring: z.object({
            type: financeTransactionTypeSchema.optional(),
            categoryId: z.string().optional(),
            from: z.string().optional(),
            to: z.string().optional(),
            search: z.string().min(1).optional(),
          }),
          response: {
            200: z.object({
              transactions: financeTransactionResponseSchema.array(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const { type, categoryId, from, to, search } = request.query

        const useCase = new FetchFinanceTransactionsUseCase(
          financeTransactionsRepository,
          financeCategoriesRepository,
        )
        const { transactions } = await useCase.execute({
          userId,
          type,
          categoryId,
          from,
          to,
          search,
        })
        return reply.status(200).send({ transactions: transactions.map(toTransactionListItem) })
      },
    )
  }
}
