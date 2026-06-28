import { FinanceCreditCardLimitExceededError } from '@errors/finance-credit-card-limit-exceeded-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import { CreateFinanceCreditCardExpenseUseCase } from '@use-cases/finance/credit-card/create-finance-credit-card-expense'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeCreditCardExpenseResponseSchema,
  toCreditCardExpenseResponse,
} from './finance-credit-card-response'

export function postFinanceCreditCardExpenseRoute(
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post(
      '/finance/credit-card-expenses',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Create credit card expense',
          body: z.object({
            description: z.string().min(1).max(200),
            categoryId: z.string().nullable().optional(),
            totalAmount: z.number().positive(),
            myShareAmount: z.number().min(0).optional(),
            date: z.string().optional(),
          }),
          response: {
            201: z.object({
              expense: financeCreditCardExpenseResponseSchema,
            }),
            400: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { description, categoryId, totalAmount, myShareAmount, date } = request.body

          const useCase = new CreateFinanceCreditCardExpenseUseCase(
            financeCreditCardExpensesRepository,
            financeCategoriesRepository,
          )
          const { expense } = await useCase.execute({
            userId,
            description,
            categoryId: categoryId ?? null,
            totalAmount,
            myShareAmount,
            date,
          })
          return reply.status(201).send({ expense: toCreditCardExpenseResponse(expense) })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          if (error instanceof FinanceCreditCardLimitExceededError) {
            return reply.status(400).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
