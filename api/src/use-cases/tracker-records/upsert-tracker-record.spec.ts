import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { InMemoryTrackerRecordsRepository } from '@in-memory/in-memory-tracker-records-repository'
import { UpsertTrackerRecordUseCase } from './upsert-tracker-record'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('upsert tracker record use case', () => {
  let habitsRepo: InMemoryTrackerHabitsRepository
  let recordsRepo: InMemoryTrackerRecordsRepository

  beforeEach(async () => {
    habitsRepo = new InMemoryTrackerHabitsRepository()
    recordsRepo = new InMemoryTrackerRecordsRepository()
    await habitsRepo.create({
      id: 'h1',
      userId: 'user-1',
      name: 'Test',
      icon: 'sun',
      position: '1.0',
    })
  })

  it('should create a new record when none exists', async () => {
    const useCase = new UpsertTrackerRecordUseCase(recordsRepo, habitsRepo)
    const result = await useCase.execute({
      userId: 'user-1',
      habitId: 'h1',
      date: '2026-06-25',
      completed: true,
    })

    expect(result.record.id).toBeDefined()
    expect(result.record.completed).toBe(true)
    expect(result.record.energy).toBeNull()
  })

  it('should update existing record (idempotent)', async () => {
    const useCase = new UpsertTrackerRecordUseCase(recordsRepo, habitsRepo)
    await useCase.execute({
      userId: 'user-1',
      habitId: 'h1',
      date: '2026-06-25',
      completed: false,
    })
    const result = await useCase.execute({
      userId: 'user-1',
      habitId: 'h1',
      date: '2026-06-25',
      completed: true,
    })

    expect(result.record.completed).toBe(true)
    const all = await recordsRepo.findManyByUserId('user-1')
    expect(all).toHaveLength(1)
  })

  it('should throw ResourceNotFoundError when habit does not exist', async () => {
    const useCase = new UpsertTrackerRecordUseCase(recordsRepo, habitsRepo)
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        habitId: 'none',
        date: '2026-06-25',
        completed: true,
      }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw ResourceNotFoundError when habit belongs to other user', async () => {
    await habitsRepo.create({
      id: 'h2',
      userId: 'other',
      name: 'Other',
      icon: 'sun',
      position: '1.0',
    })
    const useCase = new UpsertTrackerRecordUseCase(recordsRepo, habitsRepo)
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        habitId: 'h2',
        date: '2026-06-25',
        completed: true,
      }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw when user has 10000 records', async () => {
    await habitsRepo.create({
      id: 'h2',
      userId: 'user-1',
      name: 'A',
      icon: 'sun',
      position: '2.0',
    })
    for (let i = 0; i < 10_000; i++) {
      await recordsRepo.create({
        id: `r${i}`,
        userId: 'user-1',
        habitId: 'h2',
        date: '2026-01-01',
        completed: false,
        energy: null,
        quality: null,
        note: null,
      })
    }
    const useCase = new UpsertTrackerRecordUseCase(recordsRepo, habitsRepo)
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        habitId: 'h1',
        date: '2026-06-25',
        completed: true,
      }),
    ).rejects.toThrow('Limite de registros atingido (10000)')
  })
})
