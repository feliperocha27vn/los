import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import { FetchFinanceCategoriesUseCase } from '@use-cases/finance/categories/fetch-finance-categories'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeCategoryResponseSchema,
  financeCategoryTypeSchema,
  toCategoryResponse,
} from './finance-categories-response'

export function getFinanceCategoriesRoute(
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get(
      '/finance/categories',
      {
        schema: {
          tags: ['Finance'],
          summary: 'List finance categories (seed)',
          querystring: z.object({
            type: financeCategoryTypeSchema.optional(),
          }),
          response: {
            200: z.object({
              categories: financeCategoryResponseSchema.array(),
            }),
          },
        },
      },
      async (request, reply) => {
        const { type } = request.query
        const useCase = new FetchFinanceCategoriesUseCase(financeCategoriesRepository)
        const { categories } = await useCase.execute({ type })
        return reply.status(200).send({
          categories: categories.map(toCategoryResponse),
        })
      },
    )
  }
}
