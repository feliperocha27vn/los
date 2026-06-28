import { InMemoryAgendaEventsRepository } from '@in-memory/in-memory-agenda-events-repository'
import { InMemoryAgendaEventExceptionsRepository } from '@in-memory/in-memory-agenda-event-exceptions-repository'
import { InMemoryAgendaCalendarsRepository } from '@in-memory/in-memory-agenda-calendars-repository'
import { beforeEach, describe, expect, it } from 'vitest'
import { CreateAgendaEventExceptionUseCase } from './create-agenda-event-exception'
import { AgendaExceptionAlreadyExistsError } from '@errors/agenda-exception-already-exists-error'

describe('create agenda event exception use case', () => {
  let eventsRepo: InMemoryAgendaEventsRepository
  let exceptionsRepo: InMemoryAgendaEventExceptionsRepository
  let calendarsRepo: InMemoryAgendaCalendarsRepository
  let useCase: CreateAgendaEventExceptionUseCase

  beforeEach(async () => {
    eventsRepo = new InMemoryAgendaEventsRepository()
    exceptionsRepo = new InMemoryAgendaEventExceptionsRepository()
    calendarsRepo = new InMemoryAgendaCalendarsRepository()
    await calendarsRepo.create({
      id: 'cal-1',
      userId: 'user-1',
      name: 'C',
      color: '#000000',
    })
    await eventsRepo.create({
      id: 'e1',
      userId: 'user-1',
      calendarId: 'cal-1',
      title: 'X',
      description: null,
      location: null,
      startAt: new Date('2026-07-06T09:00:00Z'),
      endAt: new Date('2026-07-06T09:30:00Z'),
      allDay: false,
      recurrence: 'weekly',
      recurrenceInterval: 1,
      recurrenceCount: 5,
      recurrenceEndsAt: null,
    })
    useCase = new CreateAgendaEventExceptionUseCase(
      eventsRepo,
      exceptionsRepo,
    )
  })

  it('should create cancel exception', async () => {
    const { exception } = await useCase.execute({
      userId: 'user-1',
      eventId: 'e1',
      originalDate: '2026-07-13',
      action: 'cancel',
    })
    expect(exception.action).toBe('cancel')
  })

  it('should throw when exception already exists for date', async () => {
    await useCase.execute({
      userId: 'user-1',
      eventId: 'e1',
      originalDate: '2026-07-13',
      action: 'cancel',
    })
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        eventId: 'e1',
        originalDate: '2026-07-13',
        action: 'cancel',
      }),
    ).rejects.toThrow(AgendaExceptionAlreadyExistsError)
  })

  it('should require newStartsAt/newEndsAt for reschedule', async () => {
    await expect(() =>
      useCase.execute({
        userId: 'user-1',
        eventId: 'e1',
        originalDate: '2026-07-13',
        action: 'reschedule',
      }),
    ).rejects.toThrow(/obrigatórios/)
  })

  it('should create reschedule exception', async () => {
    const { exception } = await useCase.execute({
      userId: 'user-1',
      eventId: 'e1',
      originalDate: '2026-07-13',
      action: 'reschedule',
      newStartsAt: new Date('2026-07-13T11:00:00Z'),
      newEndsAt: new Date('2026-07-13T11:30:00Z'),
    })
    expect(exception.action).toBe('reschedule')
    expect(exception.newStartsAt).toBeDefined()
  })
})
