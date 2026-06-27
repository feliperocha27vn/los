import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { InMemoryTrackerRecordsRepository } from '@in-memory/in-memory-tracker-records-repository'
import { GetTrackerTodayUseCase } from './get-tracker-today'

describe('get tracker today use case', () => {
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
    await habitsRepo.create({
      id: 'h2',
      userId: 'user-1',
      name: 'B',
      icon: 'moon',
      position: '2.0',
    })
  })

  it('should return all active habits with completed=false when no records', async () => {
    const useCase = new GetTrackerTodayUseCase(habitsRepo, recordsRepo)
    const today = new Date().toISOString().slice(0, 10)
    const result = await useCase.executeForDate({ userId: 'user-1', date: today })

    expect(result.habits).toHaveLength(2)
    expect(result.habits.every((h) => h.completed === false)).toBe(true)
    expect(result.score).toEqual({ completed: 0, total: 2 })
  })

  it('should reflect completed records in score', async () => {
    const today = '2026-06-25'
    await recordsRepo.create({
      id: 'r1',
      userId: 'user-1',
      habitId: 'h1',
      date: today,
      completed: true,
      energy: 'medium',
      quality: 'ok',
      note: null,
    })

    const useCase = new GetTrackerTodayUseCase(habitsRepo, recordsRepo)
    const result = await useCase.executeForDate({ userId: 'user-1', date: today })

    expect(result.score).toEqual({ completed: 1, total: 2 })
    expect(result.energy).toBe('medium')
    expect(result.quality).toBe('ok')
  })
})
