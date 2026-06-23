import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { DeleteNoteUseCase } from './delete-note'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('delete note use case', () => {
  let repository: InMemoryNotesRepository

  beforeEach(async () => {
    repository = new InMemoryNotesRepository()
    await repository.create({ id: 'n1', userId: 'user-1', title: 'Test' })
  })

  it('should delete note', async () => {
    const useCase = new DeleteNoteUseCase(repository)
    await useCase.execute({ noteId: 'n1', userId: 'user-1' })

    const note = await repository.findById('n1', 'user-1')
    expect(note).toBeNull()
  })

  it('should throw when not found', async () => {
    const useCase = new DeleteNoteUseCase(repository)
    await expect(() =>
      useCase.execute({ noteId: 'none', userId: 'user-1' })
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
