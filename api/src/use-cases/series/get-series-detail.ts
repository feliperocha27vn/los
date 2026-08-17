import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { SeriesRecord, SeriesRepository } from '@repositories/series-repository'

interface GetSeriesDetailInput {
  seriesId: string
  userId: string
}

interface GetSeriesDetailOutput {
  series: SeriesRecord
}

export class GetSeriesDetailUseCase {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute({
    seriesId,
    userId,
  }: GetSeriesDetailInput): Promise<GetSeriesDetailOutput> {
    const series = await this.seriesRepository.findById(seriesId, userId)
    if (!series) throw new ResourceNotFoundError()
    return { series }
  }
}
