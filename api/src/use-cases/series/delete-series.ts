import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { SeriesRepository } from '@repositories/series-repository'

interface DeleteSeriesInput {
  seriesId: string
  userId: string
}

export class DeleteSeriesUseCase {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute({ seriesId, userId }: DeleteSeriesInput): Promise<void> {
    try {
      await this.seriesRepository.delete(seriesId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
