import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { FetchNotesUseCase } from './fetch-notes'

describe('fetch notes use case', () => {
  let repository: InMemoryNotesRepository

  beforeEach(async () => {
    repository = new InMemoryNotesRepository()
    await repository.create({ id: 'n1', userId: 'user-1', title: 'Alpha', content: 'first note content' })
    await repository.create({ id: 'n2', userId: 'user-1', title: 'Beta', content: 'second note about ideas' })
    await repository.create({ id: 'n3', userId: 'other', title: 'Gamma', content: 'other user note' })
  })

  it('should list notes sorted by updatedAt desc', async () => {
    const useCase = new FetchNotesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.notes).toHaveLength(2)
  })

  it('should return snippet truncated to 120 chars', async () => {
    const useCase = new FetchNotesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.notes[0].snippet.length).toBeLessThanOrEqual(120)
    expect(result.notes[0].snippet).toBe('first note content')
  })

  it('should not return full content', async () => {
    const useCase = new FetchNotesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1' })

    const note = result.notes[0] as Record<string, unknown>
    expect(note.content).toBeUndefined()
  })

  it('should search by title', async () => {
    const useCase = new FetchNotesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', search: 'alpha' })

    expect(result.notes).toHaveLength(1)
    expect(result.notes[0].title).toBe('Alpha')
  })

  it('should search by content', async () => {
    const useCase = new FetchNotesUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', search: 'ideas' })

    expect(result.notes).toHaveLength(1)
    expect(result.notes[0].title).toBe('Beta')
  })
})
