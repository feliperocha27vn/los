import type { AgendaEventRecord } from '@repositories/agenda-events-repository'

export interface ExpandedOccurrence {
  startAt: Date
  endAt: Date
  isException: boolean
  exceptionId: string | null
  rescheduled: boolean
}

interface RRuleBounds {
  from: Date
  to: Date
}

const MAX_OCCURRENCES = 1000

function addInterval(date: Date, recurrence: string, interval: number): Date {
  const next = new Date(date)
  switch (recurrence) {
    case 'daily':
      next.setUTCDate(next.getUTCDate() + interval)
      break
    case 'weekly':
      next.setUTCDate(next.getUTCDate() + interval * 7)
      break
    case 'monthly':
      next.setUTCMonth(next.getUTCMonth() + interval)
      break
    case 'yearly':
      next.setUTCFullYear(next.getUTCFullYear() + interval)
      break
    default:
      break
  }
  return next
}

function diffMs(start: Date, end: Date): number {
  return end.getTime() - start.getTime()
}

export function expandRecurrence(
  event: AgendaEventRecord,
  bounds: RRuleBounds,
  exceptions: Map<string, { action: 'cancel' | 'reschedule'; newStartsAt: Date | null; newEndsAt: Date | null }>,
): ExpandedOccurrence[] {
  if (event.recurrence === 'none') {
    if (
      event.endAt < bounds.from ||
      event.startAt > bounds.to
    ) {
      return []
    }
    return [
      {
        startAt: event.startAt,
        endAt: event.endAt,
        isException: false,
        exceptionId: null,
        rescheduled: false,
      },
    ]
  }

  const occurrences: ExpandedOccurrence[] = []
  const duration = diffMs(event.startAt, event.endAt)
  let current = new Date(event.startAt)
  let count = 0

  const endByCount = event.recurrenceCount ?? null
  const endByDate = event.recurrenceEndsAt ?? null
  const maxIterations = endByCount ?? MAX_OCCURRENCES

  while (count < maxIterations) {
    if (endByDate && current > endByDate) break
    if (current > bounds.to) break

    const occStart = new Date(current)
    const occEnd = new Date(occStart.getTime() + duration)
    const originalDateKey = occStart.toISOString().slice(0, 10)
    const exception = exceptions.get(originalDateKey)

    if (exception?.action === 'cancel') {
      count++
      current = addInterval(current, event.recurrence, event.recurrenceInterval)
      continue
    }

    if (occEnd >= bounds.from && occStart <= bounds.to) {
      if (exception?.action === 'reschedule' && exception.newStartsAt) {
        const newStart = exception.newStartsAt
        const newEnd = exception.newEndsAt ?? new Date(newStart.getTime() + duration)
        if (newEnd >= bounds.from && newStart <= bounds.to) {
          occurrences.push({
            startAt: newStart,
            endAt: newEnd,
            isException: true,
            exceptionId: null,
            rescheduled: true,
          })
        }
      } else {
        occurrences.push({
          startAt: occStart,
          endAt: occEnd,
          isException: false,
          exceptionId: null,
          rescheduled: false,
        })
      }
    }

    count++
    current = addInterval(current, event.recurrence, event.recurrenceInterval)
  }

  return occurrences
}
