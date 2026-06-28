export type FinanceTransactionType = 'expense' | 'income'
export type FinanceTransactionSource = 'principal' | 'credit_card'

export interface FinanceInstallmentRecord {
  id: string
  transactionId: string
  installmentNumber: number
  amount: string
  date: string
}

export interface FinanceTransactionRecord {
  id: string
  userId: string
  categoryId: string | null
  type: FinanceTransactionType
  description: string
  totalAmount: string
  installmentsCount: number
  source: FinanceTransactionSource
  createdAt: Date
  updatedAt: Date
}

export type CreateFinanceTransactionInput = Pick<
  FinanceTransactionRecord,
  'id' | 'userId' | 'type' | 'description' | 'totalAmount' | 'installmentsCount' | 'source'
> & {
  categoryId: string | null
}

export type UpdateFinanceTransactionInput = Partial<
  Pick<FinanceTransactionRecord, 'description' | 'categoryId'>
>

export interface FinanceInstallmentInput {
  id: string
  transactionId: string
  installmentNumber: number
  amount: string
  date: string
}

export interface FinanceTransactionsRepository {
  findById(id: string, userId: string): Promise<FinanceTransactionRecord | null>
  findManyByUserId(
    userId: string,
    filters?: {
      type?: FinanceTransactionType
      categoryId?: string
      from?: string
      to?: string
      search?: string
    },
  ): Promise<FinanceTransactionRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateFinanceTransactionInput): Promise<FinanceTransactionRecord>
  update(
    id: string,
    userId: string,
    input: UpdateFinanceTransactionInput,
  ): Promise<FinanceTransactionRecord>
  delete(id: string, userId: string): Promise<void>

  // installments
  findInstallmentsByTransactionId(transactionId: string): Promise<FinanceInstallmentRecord[]>
  createInstallments(inputs: FinanceInstallmentInput[]): Promise<FinanceInstallmentRecord[]>
  sumInstallmentsInRange(
    userId: string,
    type: FinanceTransactionType,
    from: string,
    to: string,
  ): Promise<number>
}
