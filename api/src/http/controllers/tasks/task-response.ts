import z from 'zod'

export const taskColumnSchema = z.enum(['todo', 'in_progress', 'done'])
export const taskCategorySchema = z.enum(['work', 'personal', 'other'])

export const taskResponseSchema = z.object({
  id: z.string(),
  category: taskCategorySchema,
  column: taskColumnSchema,
  title: z.string(),
  description: z.string().nullable(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function toResponse(record: {
  id: string
  category: 'work' | 'personal' | 'other'
  column: 'todo' | 'in_progress' | 'done'
  title: string
  description: string | null
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    category: record.category,
    column: record.column,
    title: record.title,
    description: record.description,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
