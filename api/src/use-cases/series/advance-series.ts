import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { SeriesRecord, SeriesRepository } from '@repositories/series-repository'

interface AdvanceSeriesInput {
  seriesId: string
  userId: string
  /**
   * Quando o episódio recém-terminado era o último da temporada. O app não
   * conhece o catálogo — quem sabe que a temporada acabou é o usuário.
   */
  nextSeason?: boolean
}

interface AdvanceSeriesOutput {
  series: SeriesRecord
}

export class AdvanceSeriesUseCase {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async execute({
    seriesId,
    userId,
    nextSeason = false,
  }: AdvanceSeriesInput): Promise<AdvanceSeriesOutput> {
    const current = await this.seriesRepository.findById(seriesId, userId)
    if (!current) throw new ResourceNotFoundError()

    const series = await this.seriesRepository.update(seriesId, userId, {
      season: nextSeason ? current.season + 1 : current.season,
      episode: nextSeason ? 1 : current.episode + 1,
      // O Marcador é ponto de retomada: o episódio novo ainda não foi aberto.
      positionSeconds: 0,
      // Avançar é o ato de assistir. Uma Série Pausada ou Concluída que recebe
      // um Avanço voltou a ser assistida.
      state: 'watching',
    })

    return { series }
  }
}
