import z from 'zod'

export const recordResponseSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  date: z.string(),
  completed: z.boolean(),
  energy: z.enum(['low', 'medium', 'high']).nullable(),
  quality: z.enum(['weak', 'ok', 'strong']).nullable(),
  note: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function toResponse(record: {
  id: string
  habitId: string
  date: string
  completed: boolean
  energy: 'low' | 'medium' | 'high' | null
  quality: 'weak' | 'ok' | 'strong' | null
  note: string | null
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    habitId: record.habitId,
    date: record.date,
    completed: record.completed,
    energy: record.energy,
    quality: record.quality,
    note: record.note,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
