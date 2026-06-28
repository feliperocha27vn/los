import { InMemoryAgendaEventsRepository } from '@in-memory/in-memory-agenda-events-repository'
import { InMemoryAgendaCalendarsRepository } from '@in-memory/in-memory-agenda-calendars-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateAgendaEventUseCase } from './create-agenda-event'
import { AgendaEventLimitExceededError } from '@errors/agenda-event-limit-exceeded-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('create agenda event use case', () => {
  let eventsRepo: InMemoryAgendaEventsRepository
  let calendarsRepo: InMemoryAgendaCalendarsRepository
  let useCase: CreateAgendaEventUseCase

  beforeEach(async () => {
    eventsRepo = new InMemoryAgendaEventsRepository()
    calendarsRepo = new InMemoryAgendaCalendarsRepository()
    await calendarsRepo.create({
      id: 'cal-1',
      userId: 'user-1',
      name: 'Trabalho',
      color: '#3b82f6',
    })
    useCase = new CreateAgendaEventUseCase(eventsRepo, calendarsRepo)
  })

  it('should create a single event', async () => {
    const { event } = await useCase.execute({
      userId: 'user-1',
      title: 'Daily Standup',
      calendarId: 'cal-1',
      startAt: new Date('2026-07-15T09:00:00Z'),
      endAt: new Date('2026-07-15T09:30:00Z'),
    })
    expect(event.id).toBeDefined()
    expect(event.status).toBe('scheduled')
    expect(event.recurrence).toBe('none')
  })

  it('should create a recurring weekly event', async () => {
    const { event } = await useCase.execute({
      userId: 'user-1',
      title: 'Daily Standup',
      calendarId: 'cal-1',
      startAt: new Date('2026-07-15T09:00:00Z'),
      endAt: new Date('2026-07-15T09:30:00Z'),
      recurrence: 'weekly',
      recurrenceCount: 10,
    })
    expect(event.recurrence).toBe('weekly')
    expect(event.recurrenceCount).toBe(10)
  })

  it('should reject endAt <= startAt', async () => {
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        title: 'X',
        calendarId: 'cal-1',
        startAt: new Date('2026-07-15T10:00:00Z'),
        endAt: new Date('2026-07-15T09:00:00Z'),
      }),
    ).rejects.toThrow(/endAt deve ser maior/)
  })

  it('should throw when calendar does not exist', async () => {
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        title: 'X',
        calendarId: 'non-existent',
        startAt: new Date('2026-07-15T09:00:00Z'),
        endAt: new Date('2026-07-15T09:30:00Z'),
      }),
    ).rejects.toThrow(ResourceNotFoundError)
  })

  it('should throw when limit exceeded', async () => {
    for (let i = 0; i < 2000; i++) {
      await eventsRepo.create({
        id: `e${i}`,
        userId: 'user-1',
        calendarId: 'cal-1',
        title: `E${i}`,
        description: null,
        location: null,
        startAt: new Date('2026-01-01T00:00:00Z'),
        endAt: new Date('2026-01-01T01:00:00Z'),
        allDay: false,
        recurrence: 'none',
        recurrenceInterval: 1,
        recurrenceCount: null,
        recurrenceEndsAt: null,
      })
    }
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        title: 'X',
        calendarId: 'cal-1',
        startAt: new Date('2026-07-15T09:00:00Z'),
        endAt: new Date('2026-07-15T09:30:00Z'),
      }),
    ).rejects.toThrow(AgendaEventLimitExceededError)
  })

  it('should reject recurrenceEndsAt > 2 years', async () => {
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        title: 'X',
        calendarId: 'cal-1',
        startAt: new Date('2026-01-01T00:00:00Z'),
        endAt: new Date('2026-01-01T01:00:00Z'),
        recurrence: 'monthly',
        recurrenceEndsAt: new Date('2030-01-01T00:00:00Z'),
      }),
    ).rejects.toThrow(/2 anos/)
  })
})
