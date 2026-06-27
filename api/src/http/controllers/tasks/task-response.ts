import z from 'zod'

export const taskColumnSchema = z.enum(['todo', 'in_progress', 'done'])

export const taskResponseSchema = z.object({
  id: z.string(),
  column: taskColumnSchema,
  title: z.string(),
  description: z.string().nullable(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function toResponse(record: {
  id: string
  column: 'todo' | 'in_progress' | 'done'
  title: string
  description: string | null
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    column: record.column,
    title: record.title,
    description: record.description,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
