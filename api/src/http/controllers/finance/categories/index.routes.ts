import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FastifyInstance } from 'fastify'
import { getFinanceCategoriesRoute } from './get-finance-categories'

export function registerFinanceCategoriesRoutes(
  app: FastifyInstance,
  financeCategoriesRepository: FinanceCategoriesRepository,
): void {
  app.register(getFinanceCategoriesRoute(financeCategoriesRepository))
}
