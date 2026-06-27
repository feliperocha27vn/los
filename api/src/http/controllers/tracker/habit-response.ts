import z from 'zod'

export const habitResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  position: z.number(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function toResponse(record: {
  id: string
  name: string
  icon: string
  position: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    name: record.name,
    icon: record.icon,
    position: Number(record.position),
    archived: record.archived,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}
