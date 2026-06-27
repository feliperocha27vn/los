import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { InMemoryTrackerRecordsRepository } from '@in-memory/in-memory-tracker-records-repository'
import { GetTrackerDaysUseCase } from './get-tracker-days'

describe('get tracker days use case', () => {
  let habitsRepo: InMemoryTrackerHabitsRepository
  let recordsRepo: InMemoryTrackerRecordsRepository

  beforeEach(async () => {
    habitsRepo = new InMemoryTrackerHabitsRepository()
    recordsRepo = new InMemoryTrackerRecordsRepository()
    await habitsRepo.create({
      id: 'h1',
      userId: 'user-1',
      name: 'A',
      icon: 'sun',
      position: '1.0',
    })
  })

  it('should return days with records', async () => {
    await recordsRepo.create({
      id: 'r1',
      userId: 'user-1',
      habitId: 'h1',
      date: '2026-06-25',
      completed: true,
      energy: null,
      quality: null,
      note: null,
    })
    await recordsRepo.create({
      id: 'r2',
      userId: 'user-1',
      habitId: 'h1',
      date: '2026-06-24',
      completed: false,
      energy: null,
      quality: null,
      note: null,
    })

    const useCase = new GetTrackerDaysUseCase(habitsRepo, recordsRepo)
    const result = await useCase.execute({
      userId: 'user-1',
      from: '2026-06-01',
      to: '2026-06-30',
    })

    expect(result.days).toHaveLength(2)
    expect(result.days[0].date).toBe('2026-06-24')
    expect(result.days[1].date).toBe('2026-06-25')
  })

  it('should throw on invalid range (from > to)', async () => {
    const useCase = new GetTrackerDaysUseCase(habitsRepo, recordsRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', from: '2026-06-30', to: '2026-06-01' }),
    ).rejects.toThrow('Range inválido: from > to')
  })

  it('should throw on range > 90 days', async () => {
    const useCase = new GetTrackerDaysUseCase(habitsRepo, recordsRepo)
    await expect(() =>
      useCase.execute({ userId: 'user-1', from: '2026-01-01', to: '2026-06-01' }),
    ).rejects.toThrow('Range máximo de 90 dias')
  })
})
