import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { CreateTrackerHabitUseCase } from './create-tracker-habit'

describe('create tracker habit use case', () => {
  let repository: InMemoryTrackerHabitsRepository

  beforeEach(() => {
    repository = new InMemoryTrackerHabitsRepository()
  })

  it('should create a habit with default position 1.0', async () => {
    const useCase = new CreateTrackerHabitUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      name: 'Treino',
      icon: 'dumbbell',
    })

    expect(result.habit.id).toBeDefined()
    expect(result.habit.name).toBe('Treino')
    expect(result.habit.icon).toBe('dumbbell')
    expect(Number(result.habit.position)).toBe(1.0)
    expect(result.habit.archived).toBe(false)
  })

  it('should place new habit at end (max + 1.0)', async () => {
    await repository.create({
      id: 'h1',
      userId: 'user-1',
      name: 'A',
      icon: 'sun',
      position: '5.0',
    })
    await repository.create({
      id: 'h2',
      userId: 'user-1',
      name: 'B',
      icon: 'sun',
      position: '10.0',
    })

    const useCase = new CreateTrackerHabitUseCase(repository)
    const result = await useCase.execute({
      userId: 'user-1',
      name: 'C',
      icon: 'sun',
    })

    expect(Number(result.habit.position)).toBe(11.0)
  })

  it('should throw when user has 20 habits', async () => {
    for (let i = 0; i < 20; i++) {
      await repository.create({
        id: `h${i}`,
        userId: 'user-1',
        name: `h${i}`,
        icon: 'sun',
        position: String(i + 1),
      })
    }

    const useCase = new CreateTrackerHabitUseCase(repository)
    await expect(() =>
      useCase.execute({ userId: 'user-1', name: 'overflow', icon: 'sun' }),
    ).rejects.toThrow('Limite de hábitos atingido (20)')
  })
})
