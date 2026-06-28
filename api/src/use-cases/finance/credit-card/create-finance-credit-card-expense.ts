import { randomUUID } from 'node:crypto'
import { FinanceCreditCardLimitExceededError } from '@errors/finance-credit-card-limit-exceeded-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'

const CREDIT_CARD_LIMIT_PER_USER = 200
const MAX_DESCRIPTION_LENGTH = 200

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface CreateFinanceCreditCardExpenseInput {
  userId: string
  description: string
  categoryId: string | null
  totalAmount: number
  myShareAmount?: number
  date?: string
}

interface CreateFinanceCreditCardExpenseOutput {
  expense: Awaited<ReturnType<FinanceCreditCardExpensesRepository['create']>>
}

export class CreateFinanceCreditCardExpenseUseCase {
  constructor(
    private readonly financeCreditCardExpensesRepository: FinanceCreditCardExpensesRepository,
    private readonly financeCategoriesRepository: FinanceCategoriesRepository,
  ) {}

  async execute({
    userId,
    description,
    categoryId,
    totalAmount,
    myShareAmount,
    date,
  }: CreateFinanceCreditCardExpenseInput): Promise<CreateFinanceCreditCardExpenseOutput> {
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error('totalAmount deve ser positivo')
    }
    const myShare = myShareAmount ?? Number((totalAmount / 2).toFixed(10))
    if (myShare < 0 || myShare > totalAmount) {
      throw new Error('myShareAmount deve estar entre 0 e totalAmount')
    }
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`description máximo ${MAX_DESCRIPTION_LENGTH} caracteres`)
    }

    const count = await this.financeCreditCardExpensesRepository.countByUserId(userId)
    if (count >= CREDIT_CARD_LIMIT_PER_USER) {
      throw new FinanceCreditCardLimitExceededError()
    }

    if (categoryId) {
      const category = await this.financeCategoriesRepository.findById(categoryId)
      if (!category) throw new ResourceNotFoundError()
    }

    const expense = await this.financeCreditCardExpensesRepository.create({
      id: randomUUID(),
      userId,
      description,
      categoryId,
      totalAmount: totalAmount.toFixed(10),
      myShareAmount: myShare.toFixed(10),
      date: date ?? toIsoDate(new Date()),
    })

    return { expense }
  }
}
