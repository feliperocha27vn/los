import { beforeEach, describe, expect, it } from 'vitest'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { InMemorySeriesRepository } from '@in-memory/in-memory-series-repository'
import { DeleteSeriesUseCase } from './delete-series'

describe('delete series use case', () => {
  let repository: InMemorySeriesRepository

  beforeEach(async () => {
    repository = new InMemorySeriesRepository()
    await repository.create({
      id: 's1',
      userId: 'user-1',
      name: 'Lost',
      state: 'watching',
      season: 1,
      episode: 1,
      positionSeconds: 0,
    })
  })

  it('should delete the series', async () => {
    const useCase = new DeleteSeriesUseCase(repository)
    await useCase.execute({ seriesId: 's1', userId: 'user-1' })

    expect(await repository.findById('s1', 'user-1')).toBeNull()
  })

  it('should throw ResourceNotFoundError when it does not exist', async () => {
    const useCase = new DeleteSeriesUseCase(repository)
    await expect(() =>
      useCase.execute({ seriesId: 'nope', userId: 'user-1' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
  })

  it('should not let another user delete it', async () => {
    const useCase = new DeleteSeriesUseCase(repository)
    await expect(() =>
      useCase.execute({ seriesId: 's1', userId: 'user-2' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError)
    expect(await repository.findById('s1', 'user-1')).not.toBeNull()
  })
})
