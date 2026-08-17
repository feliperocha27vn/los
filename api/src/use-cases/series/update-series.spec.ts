import { beforeEach, describe, expect, it } from 'vitest'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { InMemorySeriesRepository } from '@in-memory/in-memory-series-repository'
import { UpdateSeriesUseCase } from './update-series'

describe('update series use case', () => {
  let repository: InMemorySeriesRepository

  beforeEach(async () => {
    repository = new InMemorySeriesRepository()
    await repository.create({
      id: 's1',
      userId: 'user-1',
      name: 'Westworld',
      state: 'watching',
      season: 1,
      episode: 1,
      positionSeconds: 0,
    })
  })

  it('should move the marcador to an arbitrary point', async () => {
    const useCase = new UpdateSeriesUseCase(repository)
    const { series } = await useCase.execute({
      seriesId: 's1',
      userId: 'user-1',
      season: 3,
      episode: 4,
      positionSeconds: 1500,
    })

    expect(series.season).toBe(3)
    expect(series.episode).toBe(4)
    expect(series.positionSeconds).toBe(1500)
  })

  it('should leave untouched fields alone', async () => {
    const useCase = new UpdateSeriesUseCase(repository)
    const { series } = await useCase.execute({
      seriesId: 's1',
      userId: 'user-1',
      positionSeconds: 300,
    })

    expect(series.name).toBe('Westworld')
    expect(series.season).toBe(1)
    expect(series.episode).toBe(1)
    expect(series.state).toBe('watching')
  })

  it('should change the state', async () => {
    const useCase = new UpdateSeriesUseCase(repository)
    const { series } = await useCase.execute({
      seriesId: 's1',
      userId: 'user-1',
      state: 'paused',
    })

    expect(series.state).toBe('paused')
  })

  it('should freeze the marcador when the series is finished', async () => {
    const useCase = new UpdateSeriesUseCase(repository)
    await useCase.execute({
      seriesId: 's1',
      userId: 'user-1',
      season: 5,
      episode: 16,
      positionSeconds: 0,
    })
    const { series } = await useCase.execute({
      seriesId: 's1',
      userId: 'user-1',
      state: 'finished',
    })

    expect(series.state).toBe('finished')
    expect(series.season).toBe(5)
    expect(series.episode).toBe(16)
  })

  it('should throw ResourceNotFoundError for another user', async () => {
    const useCase = new UpdateSeriesUseCase(repository)
    await expect(() =>
      useCase.execute({ seriesId: 's1', userId: 'user-2', name: 'Hack' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })
})
