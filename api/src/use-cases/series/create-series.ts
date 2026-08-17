import { randomUUID } from 'node:crypto'
import { SeriesLimitExceededError } from '@errors/series-limit-exceeded-error'
import type { SeriesRecord, SeriesRepository } from '@repositories/series-repository'

const SERIES_LIMIT_PER_USER = 200

interface CreateSeriesPayload {
  userId: string
  name: string
  season?: number
  episode?: number
  positionSeconds?: number
}

interface CreateSeriesOutput {
  series: SeriesRecord
}

export class CreateSeriesUseCase {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute({
    userId,
    name,
    season = 1,
    episode = 1,
    positionSeconds = 0,
  }: CreateSeriesPayload): Promise<CreateSeriesOutput> {
    const count = await this.seriesRepository.countByUserId(userId)
    if (count >= SERIES_LIMIT_PER_USER) {
      throw new SeriesLimitExceededError()
    }

    // Marcador inicial: T1E1 com minutagem zero — "volte do começo".
    const series = await this.seriesRepository.create({
      id: randomUUID(),
      userId,
      name,
      state: 'watching',
      season,
      episode,
      positionSeconds,
    })

    return { series }
  }
}
