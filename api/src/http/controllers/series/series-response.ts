import z from 'zod'

export const seriesStateSchema = z.enum(['watching', 'paused', 'finished'])

export const seriesResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  state: seriesStateSchema,
  season: z.number(),
  episode: z.number(),
  positionSeconds: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export function toResponse(record: {
  id: string
  name: string
  state: 'watching' | 'paused' | 'finished'
  season: number
  episode: number
  positionSeconds: number
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    name: record.name,
    state: record.state,
    season: record.season,
    episode: record.episode,
    positionSeconds: record.positionSeconds,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

/** Limites do Marcador — 24h de minutagem cobre qualquer episódio real. */
export const seasonSchema = z.number().int().min(1).max(99)
export const episodeSchema = z.number().int().min(1).max(9999)
export const positionSecondsSchema = z.number().int().min(0).max(86_399)
