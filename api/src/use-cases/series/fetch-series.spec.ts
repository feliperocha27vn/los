import { beforeEach, describe, expect, it } from 'vitest'
import { InMemorySeriesRepository } from '@in-memory/in-memory-series-repository'
import type { SeriesState } from '@repositories/series-repository'
import { FetchSeriesUseCase } from './fetch-series'

async function seed(
  repository: InMemorySeriesRepository,
  id: string,
  name: string,
  state: SeriesState,
  userId = 'user-1',
) {
  return repository.create({
    id,
    userId,
    name,
    state,
    season: 1,
    episode: 1,
    positionSeconds: 0,
  })
}

describe('fetch series use case', () => {
  let repository: InMemorySeriesRepository

  beforeEach(() => {
    repository = new InMemorySeriesRepository()
  })

  it('should list only series from the given user', async () => {
    await seed(repository, 's1', 'Mine', 'watching')
    await seed(repository, 's2', 'Theirs', 'watching', 'user-2')

    const useCase = new FetchSeriesUseCase(repository)
    const { series } = await useCase.execute({ userId: 'user-1' })

    expect(series).toHaveLength(1)
    expect(series[0].name).toBe('Mine')
  })

  it('should return most recently touched series first', async () => {
    await seed(repository, 's1', 'Older', 'watching')
    await seed(repository, 's2', 'Newer', 'watching')
    await repository.update('s1', 'user-1', { positionSeconds: 60 })

    const useCase = new FetchSeriesUseCase(repository)
    const { series } = await useCase.execute({ userId: 'user-1' })

    expect(series.map((s) => s.name)).toEqual(['Older', 'Newer'])
  })

  it('should filter by state', async () => {
    await seed(repository, 's1', 'Watching', 'watching')
    await seed(repository, 's2', 'Paused', 'paused')
    await seed(repository, 's3', 'Finished', 'finished')

    const useCase = new FetchSeriesUseCase(repository)
    const { series } = await useCase.execute({ userId: 'user-1', state: 'paused' })

    expect(series).toHaveLength(1)
    expect(series[0].name).toBe('Paused')
  })

  it('should return every state when no filter is given', async () => {
    await seed(repository, 's1', 'Watching', 'watching')
    await seed(repository, 's2', 'Paused', 'paused')
    await seed(repository, 's3', 'Finished', 'finished')

    const useCase = new FetchSeriesUseCase(repository)
    const { series } = await useCase.execute({ userId: 'user-1' })

    expect(series).toHaveLength(3)
  })

  it('should return an empty list for a user with no series', async () => {
    const useCase = new FetchSeriesUseCase(repository)
    const { series } = await useCase.execute({ userId: 'user-1' })

    expect(series).toEqual([])
  })
})
