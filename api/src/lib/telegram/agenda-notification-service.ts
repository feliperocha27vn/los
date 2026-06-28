import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'
import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'
import type { TelegramClient } from '@lib/telegram/telegram-client'
import type { AgendaEventRecord } from '@repositories/agenda-events-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import { expandRecurrence } from '@use-cases/agenda/rrule/expand-recurrence'

interface NotificationTarget {
  userId: string
  chatId: number
  offsetMinutes: number
}

function startOfWindow(now: Date, offsetMinutes: number): Date {
  return new Date(now.getTime() + (offsetMinutes - 2) * 60_000)
}

function endOfWindow(now: Date, offsetMinutes: number): Date {
  return new Date(now.getTime() + (offsetMinutes + 1) * 60_000)
}

function buildMessage(event: AgendaEventRecord): string {
  const lines: string[] = []
  lines.push('📅 *Lembrete*')
  lines.push('')
  lines.push(`*${event.title}*`)
  if (event.description) {
    lines.push('')
    lines.push(event.description)
  }
  return lines.join('\n')
}

export class AgendaNotificationService {
  constructor(
    private readonly agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
    private readonly userPreferencesRepository: UserPreferencesRepository,
    private readonly agendaEventExceptionsRepository: AgendaEventExceptionsRepository,
    private readonly telegramClient: TelegramClient,
  ) {}

  async dispatchUpcomingEvents(
    events: AgendaEventRecord[],
    now: Date = new Date(),
  ): Promise<{ sent: number; skipped: number; errors: number }> {
    if (!this.telegramClient.isConfigured() || events.length === 0) {
      return { sent: 0, skipped: 0, errors: 0 }
    }

    let sent = 0
    let skipped = 0
    let errors = 0

    const targetsByUser = new Map<string, NotificationTarget>()
    for (const event of events) {
      const target = targetsByUser.get(event.userId)
      if (target) continue
      const link = await this.agendaTelegramLinksRepository.findByUserId(
        event.userId,
      )
      if (!link) {
        skipped++
        continue
      }
      const prefs = await this.userPreferencesRepository.getByUserId(
        event.userId,
      )
      const offset = prefs?.notificationOffsetMinutes ?? 15
      targetsByUser.set(event.userId, {
        userId: event.userId,
        chatId: link.chatId,
        offsetMinutes: offset,
      })
    }

    for (const event of events) {
      const target = targetsByUser.get(event.userId)
      if (!target) continue

      const windowStart = startOfWindow(now, target.offsetMinutes)
      const windowEnd = endOfWindow(now, target.offsetMinutes)

      const exceptions =
        await this.agendaEventExceptionsRepository.findManyByEventId(event.id)
      const exceptionMap = new Map<
        string,
        { action: 'cancel' | 'reschedule'; newStartsAt: Date | null; newEndsAt: Date | null }
      >()
      for (const ex of exceptions) {
        exceptionMap.set(ex.originalDate, {
          action: ex.action,
          newStartsAt: ex.newStartsAt,
          newEndsAt: ex.newEndsAt,
        })
      }

      const occurrences = expandRecurrence(
        event,
        { from: windowStart, to: windowEnd },
        exceptionMap,
      )
      for (const occ of occurrences) {
        const message = buildMessage(event)
        try {
          const res = await this.telegramClient.sendMessage(
            target.chatId,
            message,
            'Markdown',
          )
          if (res.ok) sent++
          else errors++
        } catch {
          errors++
        }
      }
    }

    return { sent, skipped, errors }
  }
}
