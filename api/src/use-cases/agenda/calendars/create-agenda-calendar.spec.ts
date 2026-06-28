import { InMemoryAgendaCalendarsRepository } from '@in-memory/in-memory-agenda-calendars-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateAgendaCalendarUseCase } from './create-agenda-calendar'
import { AgendaCalendarLimitExceededError } from '@errors/agenda-calendar-limit-exceeded-error'

describe('create agenda calendar use case', () => {
  let repository: InMemoryAgendaCalendarsRepository
  let useCase: CreateAgendaCalendarUseCase

  beforeEach(() => {
    repository = new InMemoryAgendaCalendarsRepository()
    useCase = new CreateAgendaCalendarUseCase(repository)
  })

  it('should create a calendar', async () => {
    const { calendar } = await useCase.execute({
      userId: 'user-1',
      name: 'Trabalho',
      color: '#3b82f6',
    })
    expect(calendar.id).toBeDefined()
    expect(calendar.name).toBe('Trabalho')
    expect(calendar.color).toBe('#3b82f6')
  })

  it('should reject invalid hex color', async () => {
    await expect(() =>
      useCase.execute({ userId: 'user-1', name: 'X', color: 'red' }),
    ).rejects.toThrow(/color deve ser hex/)
  })

  it('should throw limit exceeded when 20 calendars', async () => {
    for (let i = 0; i < 20; i++) {
      await repository.create({
        id: `c${i}`,
        userId: 'user-1',
        name: `C${i}`,
        color: '#000000',
      })
    }
    await expect(() =>
      useCase.execute({ userId: 'user-1', name: 'X', color: '#000000' }),
    ).rejects.toThrow(AgendaCalendarLimitExceededError)
  })
})
