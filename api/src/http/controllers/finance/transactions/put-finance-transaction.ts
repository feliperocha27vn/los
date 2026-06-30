import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { UpdateFinanceTransactionUseCase } from '@use-cases/finance/transactions/update-finance-transaction'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export function putFinanceTransactionRoute(
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put(
      '/finance/transactions/:id',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Update finance transaction (description / category / isFixed)',
          params: z.object({ id: z.string() }),
          body: z
            .object({
              description: z.string().min(1).max(200).optional(),
              categoryId: z.string().nullable().optional(),
              isFixed: z.boolean().optional(),
            })
            .refine(
              (b) => b.description !== undefined || b.categoryId !== undefined || b.isFixed !== undefined,
              { message: 'Pelo menos um campo deve ser fornecido' },
            ),
          response: {
            200: z.object({
              transaction: z.object({
                id: z.string(),
                description: z.string(),
                category: z
                  .object({ id: z.string(), name: z.string(), color: z.string() })
                  .nullable(),
                isFixed: z.boolean(),
                updatedAt: z.string(),
              }),
            }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params
          const { description, categoryId, isFixed } = request.body

          const useCase = new UpdateFinanceTransactionUseCase(
            financeTransactionsRepository,
            financeCategoriesRepository,
          )
          const { transaction } = await useCase.execute({
            userId,
            transactionId: id,
            description,
            categoryId,
            isFixed,
          })

          const category = transaction.categoryId
            ? await financeCategoriesRepository.findById(transaction.categoryId)
            : null

          return reply.status(200).send({
            transaction: {
              id: transaction.id,
              description: transaction.description,
              category: category
                ? { id: category.id, name: category.name, color: category.color }
                : null,
              isFixed: transaction.isFixed,
              updatedAt: transaction.updatedAt.toISOString(),
            },
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
