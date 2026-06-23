import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { CreateNoteUseCase } from './create-note'

describe('create note use case', () => {
  let repository: InMemoryNotesRepository

  beforeEach(() => {
    repository = new InMemoryNotesRepository()
  })

  it('should create a note with title', async () => {
    const useCase = new CreateNoteUseCase(repository)
    const result = await useCase.execute({ userId: 'user-1', title: 'My Note' })

    expect(result.note.id).toBeDefined()
    expect(result.note.title).toBe('My Note')
    expect(result.note.content).toBe('')
  })
})
