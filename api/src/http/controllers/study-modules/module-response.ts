import z from 'zod'

export const moduleResponseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  name: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function toResponse(record: {
  id: string
  courseId: string
  name: string
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    courseId: record.courseId,
    name: record.name,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
