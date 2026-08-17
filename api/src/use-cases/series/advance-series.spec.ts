import { beforeEach, describe, expect, it } from 'vitest'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { InMemorySeriesRepository } from '@in-memory/in-memory-series-repository'
import type { SeriesState } from '@repositories/series-repository'
import { AdvanceSeriesUseCase } from './advance-series'

describe('advance series use case', () => {
  let repository: InMemorySeriesRepository

  async function seed(
    season: number,
    episode: number,
    positionSeconds: number,
    state: SeriesState = 'watching',
  ) {
    await repository.create({
      id: 's1',
      userId: 'user-1',
      name: 'Breaking Bad',
      state,
      season,
      episode,
      positionSeconds,
    })
  }

  beforeEach(() => {
    repository = new InMemorySeriesRepository()
  })

  it('should move to the next episode and zero the minutagem', async () => {
    await seed(3, 7, 1440)

    const useCase = new AdvanceSeriesUseCase(repository)
    const { series } = await useCase.execute({ seriesId: 's1', userId: 'user-1' })

    expect(series.season).toBe(3)
    expect(series.episode).toBe(8)
    expect(series.positionSeconds).toBe(0)
  })

  it('should jump to the first episode of the next season', async () => {
    await seed(3, 13, 0)

    const useCase = new AdvanceSeriesUseCase(repository)
    const { series } = await useCase.execute({
      seriesId: 's1',
      userId: 'user-1',
      nextSeason: true,
    })

    expect(series.season).toBe(4)
    expect(series.episode).toBe(1)
    expect(series.positionSeconds).toBe(0)
  })

  it('should bring a paused series back to watching', async () => {
    await seed(2, 5, 600, 'paused')

    const useCase = new AdvanceSeriesUseCase(repository)
    const { series } = await useCase.execute({ seriesId: 's1', userId: 'user-1' })

    expect(series.state).toBe('watching')
    expect(series.episode).toBe(6)
  })

  it('should reopen a finished series', async () => {
    await seed(5, 16, 0, 'finished')

    const useCase = new AdvanceSeriesUseCase(repository)
    const { series } = await useCase.execute({ seriesId: 's1', userId: 'user-1' })

    expect(series.state).toBe('watching')
    expect(series.episode).toBe(17)
  })

  it('should discard a partial minutagem when advancing', async () => {
    await seed(1, 1, 2400)

    const useCase = new AdvanceSeriesUseCase(repository)
    const { series } = await useCase.execute({ seriesId: 's1', userId: 'user-1' })

    expect(series.positionSeconds).toBe(0)
  })

  it('should throw ResourceNotFoundError for another user', async () => {
    await seed(1, 1, 0)

    const useCase = new AdvanceSeriesUseCase(repository)
    await expect(() =>
      useCase.execute({ seriesId: 's1', userId: 'user-2' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })

  it('should throw ResourceNotFoundError when the series does not exist', async () => {
    const useCase = new AdvanceSeriesUseCase(repository)
    await expect(() =>
      useCase.execute({ seriesId: 'nope', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
