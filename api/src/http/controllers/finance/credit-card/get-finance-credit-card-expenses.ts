import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import { FetchFinanceCreditCardExpensesUseCase } from '@use-cases/finance/credit-card/fetch-finance-credit-card-expenses'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeCreditCardExpenseResponseSchema,
  toCreditCardExpenseResponse,
} from './finance-credit-card-response'

export function getFinanceCreditCardExpensesRoute(
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/finance/credit-card-expenses',
      {
        schema: {
          tags: ['Finance'],
          summary: 'List credit card expenses (default = current month)',
          querystring: z.object({
            month: z
              .string()
              .regex(/^\d{4}-\d{2}$/)
              .optional(),
          }),
          response: {
            200: z.object({
              expenses: financeCreditCardExpenseResponseSchema.array(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { sub: userId } = request.user as { sub: string }
        const { month: monthParam } = request.query

        let from: string | undefined
        let to: string | undefined
        if (monthParam) {
          const [y, m] = monthParam.split('-').map(Number)
          const padded = String(m).padStart(2, '0')
          from = `${y}-${padded}-01`
          const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate()
          to = `${y}-${padded}-${String(lastDay).padStart(2, '0')}`
        }

        const useCase = new FetchFinanceCreditCardExpensesUseCase(
          financeCreditCardExpensesRepository,
          financeCategoriesRepository,
        )
        const { expenses } = await useCase.execute({ userId, from, to })
        return reply.status(200).send({ expenses: expenses.map(toCreditCardExpenseResponse) })
      },
    )
  }
}
