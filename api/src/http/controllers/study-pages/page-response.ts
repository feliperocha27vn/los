import z from 'zod'

export const pageResponseSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  content: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const breadcrumbSchema = z.object({
  course: z.object({ id: z.string(), name: z.string() }).optional(),
  module: z.object({ id: z.string(), name: z.string() }).optional(),
  page: z.object({ id: z.string(), name: z.string() }),
})

export function toResponse(record: {
  id: string
  moduleId: string
  title: string
  content: string
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    moduleId: record.moduleId,
    title: record.title,
    content: record.content,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
