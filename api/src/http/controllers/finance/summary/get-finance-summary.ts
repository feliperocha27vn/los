import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { GetFinanceSummaryUseCase } from '@use-cases/finance/summary/get-finance-summary'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

function currentMonth(): { month: number; year: number } {
  const now = new Date()
  return { month: now.getUTCMonth() + 1, year: now.getUTCFullYear() }
}

export function getFinanceSummaryRoute(
  financeTransactionsRepository: FinanceTransactionsRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/finance/summary',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Get finance summary for a month',
          querystring: z.object({
            month: z
              .string()
              .regex(/^\d{4}-\d{2}$/)
              .optional(),
          }),
          response: {
            200: z.object({
              period: z.object({ month: z.number(), year: z.number() }),
              income: z.number(),
              expenses: z.number(),
              balance: z.number(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const { month: monthParam } = request.query

        let month: number
        let year: number
        if (monthParam) {
          const [y, m] = monthParam.split('-').map(Number)
          year = y
          month = m
        } else {
          const cur = currentMonth()
          month = cur.month
          year = cur.year
        }

        const useCase = new GetFinanceSummaryUseCase(financeTransactionsRepository)
        const result = await useCase.execute({ userId, month, year })
        return reply.status(200).send(result)
      },
    )
  }
}
