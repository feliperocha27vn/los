import type {
  CreateFinanceCreditCardExpenseInput,
  FinanceCreditCardExpenseRecord,
  FinanceCreditCardExpensesRepository,
  UpdateFinanceCreditCardExpenseInput,
} from '@repositories/finance-credit-card-expenses-repository'

export class InMemoryFinanceCreditCardExpensesRepository
  implements FinanceCreditCardExpensesRepository
{
  private expenses: FinanceCreditCardExpenseRecord[] = []

  async findById(id: string, userId: string): Promise<FinanceCreditCardExpenseRecord | null> {
    return this.expenses.find((e) => e.id === id && e.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { from?: string; to?: string },
  ): Promise<FinanceCreditCardExpenseRecord[]> {
    let result = this.expenses.filter((e) => e.userId === userId)
    if (filters?.from) result = result.filter((e) => e.date >= filters.from!)
    if (filters?.to) result = result.filter((e) => e.date <= filters.to!)
    return result.sort((a, b) => b.date.localeCompare(a.date))
  }

  async countByUserId(userId: string): Promise<number> {
    return this.expenses.filter((e) => e.userId === userId).length
  }

  async create(
    input: CreateFinanceCreditCardExpenseInput,
  ): Promise<FinanceCreditCardExpenseRecord> {
    const now = new Date()
    const record: FinanceCreditCardExpenseRecord = {
      id: input.id,
      userId: input.userId,
      categoryId: input.categoryId,
      description: input.description,
      totalAmount: input.totalAmount,
      myShareAmount: input.myShareAmount,
      date: input.date,
      launchedInMain: false,
      linkedTransactionId: null,
      createdAt: now,
      updatedAt: now,
    }
    this.expenses.push(record)
    return record
  }

  async update(
    id: string,
    userId: string,
    input: UpdateFinanceCreditCardExpenseInput,
  ): Promise<FinanceCreditCardExpenseRecord> {
    const record = await this.findById(id, userId)
    if (!record) throw new Error('FinanceCreditCardExpense not found')
    if (input.description !== undefined) record.description = input.description
    if (input.categoryId !== undefined) record.categoryId = input.categoryId
    if (input.totalAmount !== undefined) record.totalAmount = input.totalAmount
    if (input.myShareAmount !== undefined) record.myShareAmount = input.myShareAmount
    if (input.date !== undefined) record.date = input.date
    record.updatedAt = new Date()
    return record
  }

  async markLaunched(
    id: string,
    userId: string,
    linkedTransactionId: string,
  ): Promise<FinanceCreditCardExpenseRecord> {
    const record = await this.findById(id, userId)
    if (!record) throw new Error('FinanceCreditCardExpense not found')
    record.launchedInMain = true
    record.linkedTransactionId = linkedTransactionId
    record.updatedAt = new Date()
    return record
  }

  async markUnlaunched(id: string, userId: string): Promise<FinanceCreditCardExpenseRecord> {
    const record = await this.findById(id, userId)
    if (!record) throw new Error('FinanceCreditCardExpense not found')
    record.launchedInMain = false
    record.linkedTransactionId = null
    record.updatedAt = new Date()
    return record
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.expenses.findIndex((e) => e.id === id && e.userId === userId)
    if (index === -1) throw new Error('FinanceCreditCardExpense not found')
    this.expenses.splice(index, 1)
  }
}
