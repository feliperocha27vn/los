import { FinanceTransactionLimitExceededError } from '@errors/finance-transaction-limit-exceeded-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import { CreateFinanceTransactionUseCase } from '@use-cases/finance/transactions/create-finance-transaction'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  financeInstallmentResponseSchema,
  financeTransactionResponseSchema,
  financeTransactionTypeSchema,
  toInstallmentResponse,
  toTransactionListItem,
} from './finance-transactions-response'

export function postFinanceTransactionRoute(
  financeTransactionsRepository: FinanceTransactionsRepository,
  financeCategoriesRepository: FinanceCategoriesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post(
      '/finance/transactions',
      {
        schema: {
          tags: ['Finance'],
          summary: 'Create finance transaction',
          body: z.object({
            type: financeTransactionTypeSchema,
            description: z.string().min(1).max(200),
            categoryId: z.string().nullable().optional(),
            totalAmount: z.number().positive(),
            installmentsCount: z.number().int().min(1).max(24).optional(),
            firstInstallmentDate: z.string().optional(),
            isFixed: z.boolean().optional(),
          }),
          response: {
            201: z.object({
              transaction: financeTransactionResponseSchema,
              installments: financeInstallmentResponseSchema.array(),
            }),
            400: z.object({ message: z.string() }),
            404: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const {
            type,
            description,
            categoryId,
            totalAmount,
            installmentsCount,
            firstInstallmentDate,
            isFixed,
          } = request.body

          const useCase = new CreateFinanceTransactionUseCase(
            financeTransactionsRepository,
            financeCategoriesRepository,
          )
          const { transaction, installments } = await useCase.execute({
            userId,
            type,
            description,
            categoryId: categoryId ?? null,
            totalAmount,
            installmentsCount,
            firstInstallmentDate,
            isFixed,
          })

          const transactionWithCategory = {
            ...transaction,
            installmentAmount: null,
            installmentDate: null,
            installmentNumber: null,
            category: transaction.categoryId
              ? await financeCategoriesRepository.findById(transaction.categoryId)
              : null,
          }

          return reply.status(201).send({
            transaction: toTransactionListItem(transactionWithCategory),
            installments: installments.map(toInstallmentResponse),
          })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          if (error instanceof FinanceTransactionLimitExceededError) {
            return reply.status(400).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
