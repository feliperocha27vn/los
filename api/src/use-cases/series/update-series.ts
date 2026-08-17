import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  SeriesRecord,
  SeriesRepository,
  SeriesState,
  UpdateSeriesInput,
} from '@repositories/series-repository'

interface UpdateSeriesPayload {
  seriesId: string
  userId: string
  name?: string
  state?: SeriesState
  season?: number
  episode?: number
  positionSeconds?: number
}

interface UpdateSeriesOutput {
  series: SeriesRecord
}

export class UpdateSeriesUseCase {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute({
    seriesId,
    userId,
    ...data
  }: UpdateSeriesPayload): Promise<UpdateSeriesOutput> {
    const input: UpdateSeriesInput = {}
    if (data.name !== undefined) input.name = data.name
    if (data.state !== undefined) input.state = data.state
    if (data.season !== undefined) input.season = data.season
    if (data.episode !== undefined) input.episode = data.episode
    if (data.positionSeconds !== undefined) {
      input.positionSeconds = data.positionSeconds
    }

    try {
      const series = await this.seriesRepository.update(seriesId, userId, input)
      return { series }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
