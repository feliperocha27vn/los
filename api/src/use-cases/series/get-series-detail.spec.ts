import { beforeEach, describe, expect, it } from 'vitest'
import { InMemorySeriesRepository } from '@in-memory/in-memory-series-repository'
import { GetSeriesDetailUseCase } from './get-series-detail'

describe('get series detail use case', () => {
  let repository: InMemorySeriesRepository

  beforeEach(async () => {
    repository = new InMemorySeriesRepository()
    await repository.create({
      id: 's1',
      userId: 'user-1',
      name: 'Severance',
      state: 'watching',
      season: 2,
      episode: 4,
      positionSeconds: 900,
    })
  })

  it('should return the series with its marcador', async () => {
    const useCase = new GetSeriesDetailUseCase(repository)
    const { series } = await useCase.execute({ seriesId: 's1', userId: 'user-1' })

    expect(series.name).toBe('Severance')
    expect(series.season).toBe(2)
    expect(series.episode).toBe(4)
    expect(series.positionSeconds).toBe(900)
  })

  it('should throw when the series does not exist', async () => {
    const useCase = new GetSeriesDetailUseCase(repository)
    await expect(() =>
      useCase.execute({ seriesId: 'nope', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(Error)
  })

  it('should not expose a series belonging to another user', async () => {
    const useCase = new GetSeriesDetailUseCase(repository)
    await expect(() =>
      useCase.execute({ seriesId: 's1', userId: 'user-2' }),
    ).rejects.toBeInstanceOf(Error)
  })
})
