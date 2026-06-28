import type {
  CreateFinanceTransactionInput,
  FinanceInstallmentInput,
  FinanceInstallmentRecord,
  FinanceTransactionRecord,
  FinanceTransactionsRepository,
  FinanceTransactionType,
  UpdateFinanceTransactionInput,
} from '@repositories/finance-transactions-repository'

export class InMemoryFinanceTransactionsRepository implements FinanceTransactionsRepository {
  private transactions: FinanceTransactionRecord[] = []
  private installments: FinanceInstallmentRecord[] = []

  async findById(id: string, userId: string): Promise<FinanceTransactionRecord | null> {
    return this.transactions.find((t) => t.id === id && t.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: {
      type?: FinanceTransactionType
      categoryId?: string
      from?: string
      to?: string
      search?: string
    },
  ): Promise<FinanceTransactionRecord[]> {
    let result = this.transactions.filter((t) => t.userId === userId)
    if (filters?.type) result = result.filter((t) => t.type === filters.type)
    if (filters?.categoryId) result = result.filter((t) => t.categoryId === filters.categoryId)
    if (filters?.search) {
      const term = filters.search.toLowerCase()
      result = result.filter((t) => t.description.toLowerCase().includes(term))
    }
    return result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }

  async countByUserId(userId: string): Promise<number> {
    return this.transactions.filter((t) => t.userId === userId).length
  }

  async create(input: CreateFinanceTransactionInput): Promise<FinanceTransactionRecord> {
    const now = new Date()
    const record: FinanceTransactionRecord = {
      id: input.id,
      userId: input.userId,
      categoryId: input.categoryId,
      type: input.type,
      description: input.description,
      totalAmount: input.totalAmount,
      installmentsCount: input.installmentsCount,
      source: input.source,
      createdAt: now,
      updatedAt: now,
    }
    this.transactions.push(record)
    return record
  }

  async update(
    id: string,
    userId: string,
    input: UpdateFinanceTransactionInput,
  ): Promise<FinanceTransactionRecord> {
    const record = await this.findById(id, userId)
    if (!record) throw new Error('FinanceTransaction not found')
    if (input.description !== undefined) record.description = input.description
    if (input.categoryId !== undefined) record.categoryId = input.categoryId
    record.updatedAt = new Date()
    return record
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.transactions.findIndex((t) => t.id === id && t.userId === userId)
    if (index === -1) throw new Error('FinanceTransaction not found')
    this.transactions.splice(index, 1)
    this.installments = this.installments.filter((i) => i.transactionId !== id)
  }

  async findInstallmentsByTransactionId(
    transactionId: string,
  ): Promise<FinanceInstallmentRecord[]> {
    return this.installments
      .filter((i) => i.transactionId === transactionId)
      .sort((a, b) => a.installmentNumber - b.installmentNumber)
  }

  async createInstallments(inputs: FinanceInstallmentInput[]): Promise<FinanceInstallmentRecord[]> {
    const records: FinanceInstallmentRecord[] = inputs.map((i) => ({
      id: i.id,
      transactionId: i.transactionId,
      installmentNumber: i.installmentNumber,
      amount: i.amount,
      date: i.date,
    }))
    this.installments.push(...records)
    return records
  }

  async sumInstallmentsInRange(
    userId: string,
    type: FinanceTransactionType,
    from: string,
    to: string,
  ): Promise<number> {
    const txs = this.transactions.filter((t) => t.userId === userId && t.type === type)
    const txIds = new Set(txs.map((t) => t.id))
    const matchingInstallments = this.installments.filter(
      (i) => txIds.has(i.transactionId) && i.date >= from && i.date <= to,
    )
    return matchingInstallments.reduce((sum, i) => sum + Number(i.amount), 0)
  }
}
