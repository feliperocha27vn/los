import { describe, expect, it } from 'vitest'
import { expandRecurrence } from './expand-recurrence'
import type { AgendaEventRecord } from '@repositories/agenda-events-repository'

function makeEvent(
  overrides: Partial<AgendaEventRecord> = {},
): AgendaEventRecord {
  return {
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
    status: 'scheduled',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('expandRecurrence', () => {
  it('returns single occurrence for recurrence=none', () => {
    const event = makeEvent({ recurrence: 'none' })
    const result = expandRecurrence(
      event,
      { from: new Date('2026-07-01'), to: new Date('2026-07-31') },
      new Map(),
    )
    expect(result).toHaveLength(1)
  })

  it('expands weekly occurrence within range', () => {
    const event = makeEvent({ recurrence: 'weekly', recurrenceCount: 4 })
    const result = expandRecurrence(
      event,
      { from: new Date('2026-07-01'), to: new Date('2026-08-31') },
      new Map(),
    )
    expect(result).toHaveLength(4)
  })

  it('respects cancel exception', () => {
    const event = makeEvent({ recurrence: 'weekly', recurrenceCount: 3 })
    const exceptions = new Map([
      ['2026-07-13', { action: 'cancel' as const, newStartsAt: null, newEndsAt: null }],
    ])
    const result = expandRecurrence(
      event,
      { from: new Date('2026-07-01'), to: new Date('2026-08-31') },
      exceptions,
    )
    expect(result).toHaveLength(2)
  })

  it('applies reschedule exception', () => {
    const event = makeEvent({ recurrence: 'weekly', recurrenceCount: 3 })
    const exceptions = new Map([
      [
        '2026-07-13',
        {
          action: 'reschedule' as const,
          newStartsAt: new Date('2026-07-13T11:00:00Z'),
          newEndsAt: new Date('2026-07-13T11:30:00Z'),
        },
      ],
    ])
    const result = expandRecurrence(
      event,
      { from: new Date('2026-07-01'), to: new Date('2026-08-31') },
      exceptions,
    )
    expect(result).toHaveLength(3)
    const rescheduled = result.find((o) => o.startAt.getUTCHours() === 11)
    expect(rescheduled).toBeDefined()
  })
})
