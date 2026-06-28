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
  timezone: string
}

function startOfWindow(now: Date, offsetMinutes: number): Date {
  return new Date(now.getTime() + (offsetMinutes - 2) * 60_000)
}

function endOfWindow(now: Date, offsetMinutes: number): Date {
  return new Date(now.getTime() + (offsetMinutes + 1) * 60_000)
}

function formatLocal(date: Date, timezone: string): string {
  try {
    const fmt = new Intl.DateTimeFormat('pt-BR', {
      timeZone: timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return fmt.format(date)
  } catch {
    return date.toISOString().replace('T', ' ').slice(0, 16)
  }
}

function buildMessage(
  event: AgendaEventRecord,
  startAt: Date,
  endAt: Date,
  timezone: string,
): string {
  const tzLabel = timezone === 'America/Sao_Paulo' ? 'BRT' : timezone
  const start = formatLocal(startAt, timezone)
  const end = formatLocal(endAt, timezone)
  const title = event.title
  const location = event.location ?? null
  const description = event.description ?? null

  const lines: string[] = []
  lines.push(`[Lembrete de Compromisso]`)
  lines.push('')
  lines.push(`*${title}*`)
  lines.push('')
  lines.push(`Quando: _${start}_`)
  lines.push(`Ate:    _${end}_`)
  lines.push(`Fuso:   ${tzLabel}`)
  if (location) {
    lines.push(`Local:  ${location}`)
  }
  if (description) {
    lines.push('')
    lines.push(description)
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
      const timezone = prefs?.timezone ?? 'America/Sao_Paulo'
      targetsByUser.set(event.userId, {
        userId: event.userId,
        chatId: link.chatId,
        offsetMinutes: offset,
        timezone,
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
        const message = buildMessage(
          event,
          occ.startAt,
          occ.endAt,
          target.timezone,
        )
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
