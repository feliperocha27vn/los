export interface FinanceCreditCardExpenseRecord {
  id: string
  userId: string
  categoryId: string | null
  description: string
  totalAmount: string
  myShareAmount: string
  date: string
  launchedInMain: boolean
  linkedTransactionId: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateFinanceCreditCardExpenseInput = Pick<
  FinanceCreditCardExpenseRecord,
  'id' | 'userId' | 'description' | 'totalAmount' | 'myShareAmount' | 'date'
> & {
  categoryId: string | null
}

export type UpdateFinanceCreditCardExpenseInput = Partial<
  Pick<
    FinanceCreditCardExpenseRecord,
    'description' | 'categoryId' | 'totalAmount' | 'myShareAmount' | 'date'
  >
>

export interface FinanceCreditCardExpensesRepository {
  findById(id: string, userId: string): Promise<FinanceCreditCardExpenseRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { from?: string; to?: string },
  ): Promise<FinanceCreditCardExpenseRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateFinanceCreditCardExpenseInput): Promise<FinanceCreditCardExpenseRecord>
  update(
    id: string,
    userId: string,
    input: UpdateFinanceCreditCardExpenseInput,
  ): Promise<FinanceCreditCardExpenseRecord>
  markLaunched(
    id: string,
    userId: string,
    linkedTransactionId: string,
  ): Promise<FinanceCreditCardExpenseRecord>
  markUnlaunched(id: string, userId: string): Promise<FinanceCreditCardExpenseRecord>
  delete(id: string, userId: string): Promise<void>
}
