import { beforeEach, describe, expect, it } from 'vitest'
import { InMemorySeriesRepository } from '@in-memory/in-memory-series-repository'
import { CreateSeriesUseCase } from './create-series'

describe('create series use case', () => {
  let repository: InMemorySeriesRepository

  beforeEach(() => {
    repository = new InMemorySeriesRepository()
  })

  it('should start the marcador at T1E1 with zero minutagem', async () => {
    const useCase = new CreateSeriesUseCase(repository)
    const { series } = await useCase.execute({
      userId: 'user-1',
      name: 'Breaking Bad',
    })

    expect(series.id).toBeDefined()
    expect(series.name).toBe('Breaking Bad')
    expect(series.season).toBe(1)
    expect(series.episode).toBe(1)
    expect(series.positionSeconds).toBe(0)
  })

  it('should always create the series as watching', async () => {
    const useCase = new CreateSeriesUseCase(repository)
    const { series } = await useCase.execute({ userId: 'user-1', name: 'Dark' })

    expect(series.state).toBe('watching')
  })

  it('should accept an explicit marcador for a series already in progress', async () => {
    const useCase = new CreateSeriesUseCase(repository)
    const { series } = await useCase.execute({
      userId: 'user-1',
      name: 'The Office',
      season: 3,
      episode: 7,
      positionSeconds: 1440,
    })

    expect(series.season).toBe(3)
    expect(series.episode).toBe(7)
    expect(series.positionSeconds).toBe(1440)
  })

  it('should throw when the user reaches 200 series', async () => {
    for (let i = 0; i < 200; i++) {
      await repository.create({
        id: `s${i}`,
        userId: 'user-1',
        name: `s${i}`,
        state: 'watching',
        season: 1,
        episode: 1,
        positionSeconds: 0,
      })
    }

    const useCase = new CreateSeriesUseCase(repository)
    await expect(() =>
      useCase.execute({ userId: 'user-1', name: 'overflow' }),
    ).rejects.toThrow('Limite de séries atingido (200)')
  })

  it('should not count series from another user towards the limit', async () => {
    for (let i = 0; i < 200; i++) {
      await repository.create({
        id: `s${i}`,
        userId: 'user-2',
        name: `s${i}`,
        state: 'watching',
        season: 1,
        episode: 1,
        positionSeconds: 0,
      })
    }

    const useCase = new CreateSeriesUseCase(repository)
    const { series } = await useCase.execute({ userId: 'user-1', name: 'Fine' })

    expect(series.name).toBe('Fine')
  })
})
