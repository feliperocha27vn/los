import type {
  SeriesRecord,
  SeriesRepository,
  SeriesState,
} from '@repositories/series-repository'

interface FetchSeriesInput {
  userId: string
  state?: SeriesState
}

interface FetchSeriesOutput {
  series: SeriesRecord[]
}

export class FetchSeriesUseCase {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute({ userId, state }: FetchSeriesInput): Promise<FetchSeriesOutput> {
    const records = await this.seriesRepository.findManyByUserId(userId, { state })
    return { series: records }
  }
}
