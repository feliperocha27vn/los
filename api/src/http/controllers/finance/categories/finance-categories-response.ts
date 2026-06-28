import z from 'zod'

export const financeCategoryTypeSchema = z.enum(['expense', 'income'])

export const financeCategoryResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: financeCategoryTypeSchema,
  color: z.string(),
})

export function toCategoryResponse(record: {
  id: string
  name: string
  type: 'expense' | 'income'
  color: string
}) {
  return {
    id: record.id,
    name: record.name,
    type: record.type,
    color: record.color,
  }
}
