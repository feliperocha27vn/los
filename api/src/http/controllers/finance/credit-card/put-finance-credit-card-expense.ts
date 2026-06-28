import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import { UpdateFinanceCreditCardExpenseUseCase } from '@use-cases/finance/credit-card/update-finance-credit-card-expense'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeCreditCardExpenseResponseSchema,
  toCreditCardExpenseResponse,
} from './finance-credit-card-response'

export function putFinanceCreditCardExpenseRoute(
  financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put(
      '/finance/credit-card-expenses/:id',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Update credit card expense',
          params: z.object({ id: z.string() }),
          body: z
            .object({
              description: z.string().min(1).max(200).optional(),
              categoryId: z.string().nullable().optional(),
              totalAmount: z.number().positive().optional(),
              myShareAmount: z.number().min(0).optional(),
              date: z.string().optional(),
            })
            .refine(
              (b) =>
                b.description !== undefined ||
                b.categoryId !== undefined ||
                b.totalAmount !== undefined ||
                b.myShareAmount !== undefined ||
                b.date !== undefined,
              { message: 'Pelo menos um campo deve ser fornecido' },
            ),
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
          const { description, categoryId, totalAmount, myShareAmount, date } = request.body

          const useCase = new UpdateFinanceCreditCardExpenseUseCase(
            financeCreditCardExpensesRepository,
            financeCategoriesRepository,
          )
          const { expense } = await useCase.execute({
            userId,
            expenseId: id,
            description,
            categoryId,
            totalAmount,
            myShareAmount,
            date,
          })

          const withCategory = {
            ...expense,
            category: expense.categoryId
              ? await financeCategoriesRepository.findById(expense.categoryId)
              : null,
          }
          return reply.status(200).send({ expense: toCreditCardExpenseResponse(withCategory) })
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
