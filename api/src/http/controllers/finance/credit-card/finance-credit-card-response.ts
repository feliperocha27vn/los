import z from 'zod'

export const financeCreditCardExpenseResponseSchema = z.object({
  id: z.string(),
  description: z.string(),
  category: z.object({ id: z.string(), name: z.string(), color: z.string() }).nullable(),
  totalAmount: z.number(),
  myShareAmount: z.number(),
  date: z.string(),
  launchedInMain: z.boolean(),
  linkedTransactionId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function toEmbedded(category: { id: string; name: string; color: string } | null) {
  return category ? { id: category.id, name: category.name, color: category.color } : null
}

export function toCreditCardExpenseResponse(
  record: {
    id: string
    description: string
    totalAmount: string
    myShareAmount: string
    date: string
    launchedInMain: boolean
    linkedTransactionId: string | null
    createdAt: Date
    updatedAt: Date
  } & { category: { id: string; name: string; color: string } | null },
) {
  return {
    id: record.id,
    description: record.description,
    category: toEmbedded(record.category),
    totalAmount: Number(record.totalAmount),
    myShareAmount: Number(record.myShareAmount),
    date: record.date,
    launchedInMain: record.launchedInMain,
    linkedTransactionId: record.linkedTransactionId,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
