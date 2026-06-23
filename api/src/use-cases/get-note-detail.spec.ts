import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { GetNoteDetailUseCase } from './get-note-detail'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('get note detail use case', () => {
  let repository: InMemoryNotesRepository

  beforeEach(async () => {
    repository = new InMemoryNotesRepository()
    await repository.create({ id: 'n1', userId: 'user-1', title: 'Test', content: 'Full markdown **content**' })
  })

  it('should return full note with content', async () => {
    const useCase = new GetNoteDetailUseCase(repository)
    const result = await useCase.execute({ noteId: 'n1', userId: 'user-1' })

    expect(result.note.title).toBe('Test')
    expect(result.note.content).toBe('Full markdown **content**')
  })

  it('should throw when not found', async () => {
    const useCase = new GetNoteDetailUseCase(repository)
    await expect(() =>
      useCase.execute({ noteId: 'none', userId: 'user-1' })
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
