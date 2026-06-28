import z from 'zod'

export const financeTransactionTypeSchema = z.enum(['expense', 'income'])
export const financeTransactionSourceSchema = z.enum(['principal', 'credit_card'])

export const financeCategoryEmbeddedSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
})

export const financeInstallmentResponseSchema = z.object({
  id: z.string(),
  installmentNumber: z.number(),
  amount: z.number(),
  date: z.string(),
})

export const financeTransactionResponseSchema = z.object({
  id: z.string(),
  type: financeTransactionTypeSchema,
  description: z.string(),
  category: financeCategoryEmbeddedSchema.nullable(),
  totalAmount: z.number(),
  installmentsCount: z.number(),
  currentInstallment: z.number().nullable(),
  date: z.string(),
  source: financeTransactionSourceSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const financeTransactionDetailResponseSchema = z.object({
  transaction: financeTransactionResponseSchema,
  installments: financeInstallmentResponseSchema.array(),
})

function toEmbedded(category: { id: string; name: string; color: string } | null) {
  return category ? { id: category.id, name: category.name, color: category.color } : null
}

export function toTransactionListItem(
  record: {
    id: string
    type: 'expense' | 'income'
    description: string
    totalAmount: string
    installmentsCount: number
    source: 'principal' | 'credit_card'
    createdAt: Date
    updatedAt: Date
  } & { category: { id: string; name: string; color: string } | null },
) {
  return {
    id: record.id,
    type: record.type,
    description: record.description,
    category: toEmbedded(record.category),
    totalAmount: Number(record.totalAmount),
    installmentsCount: record.installmentsCount,
    currentInstallment: null,
    date: record.createdAt.toISOString().slice(0, 10),
    source: record.source,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function toInstallmentResponse(record: {
  id: string
  installmentNumber: number
  amount: string
  date: string
}) {
  return {
    id: record.id,
    installmentNumber: record.installmentNumber,
    amount: Number(record.amount),
    date: record.date,
  }
}
