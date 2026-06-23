import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { UpdateNoteUseCase } from './update-note'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('update note use case', () => {
  let repository: InMemoryNotesRepository

  beforeEach(async () => {
    repository = new InMemoryNotesRepository()
    await repository.create({ id: 'n1', userId: 'user-1', title: 'Old', content: 'Old content' })
  })

  it('should update title and content', async () => {
    const useCase = new UpdateNoteUseCase(repository)
    const result = await useCase.execute({ noteId: 'n1', userId: 'user-1', title: 'New', content: 'New content' })

    expect(result.note.title).toBe('New')
    expect(result.note.content).toBe('New content')
  })

  it('should partial update', async () => {
    const useCase = new UpdateNoteUseCase(repository)
    const result = await useCase.execute({ noteId: 'n1', userId: 'user-1', content: 'Updated only' })

    expect(result.note.title).toBe('Old')
    expect(result.note.content).toBe('Updated only')
  })

  it('should throw when not found', async () => {
    const useCase = new UpdateNoteUseCase(repository)
    await expect(() =>
      useCase.execute({ noteId: 'none', userId: 'user-1', title: 'X' })
    ).rejects.toThrow(ResourceNotFoundError)
  })
})
