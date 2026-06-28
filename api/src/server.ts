import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { and, eq, gte, inArray, lte } from 'drizzle-orm'
import { agendaEvents, agendaTelegramLinks } from '@db/schema'
import { db } from '@lib/db'
import { createApp } from './app'
import { env } from './env'
import { usersRepository } from '@repositories/adapters/drizzle/drizzle-users-repository'
import { cofreEntriesRepository } from '@repositories/adapters/drizzle/drizzle-cofre-entries-repository'
import { notesRepository } from '@repositories/adapters/drizzle/drizzle-notes-repository'
import { tasksRepository } from '@repositories/adapters/drizzle/drizzle-tasks-repository'
import { studyCoursesRepository } from '@repositories/adapters/drizzle/drizzle-study-courses-repository'
import { studyModulesRepository } from '@repositories/adapters/drizzle/drizzle-study-modules-repository'
import { studyPagesRepository } from '@repositories/adapters/drizzle/drizzle-study-pages-repository'
import { trackerHabitsRepository } from '@repositories/adapters/drizzle/drizzle-tracker-habits-repository'
import { trackerRecordsRepository } from '@repositories/adapters/drizzle/drizzle-tracker-records-repository'
import { financeCategoriesRepository } from '@repositories/adapters/drizzle/drizzle-finance-categories-repository'
import { financeTransactionsRepository } from '@repositories/adapters/drizzle/drizzle-finance-transactions-repository'
import { financeCreditCardExpensesRepository } from '@repositories/adapters/drizzle/drizzle-finance-credit-card-expenses-repository'
import { agendaCalendarsRepository } from '@repositories/adapters/drizzle/drizzle-agenda-calendars-repository'
import { agendaEventsRepository } from '@repositories/adapters/drizzle/drizzle-agenda-events-repository'
import { agendaEventExceptionsRepository } from '@repositories/adapters/drizzle/drizzle-agenda-event-exceptions-repository'
import { agendaTelegramLinksRepository } from '@repositories/adapters/drizzle/drizzle-agenda-telegram-links-repository'
import { userPreferencesRepository } from '@repositories/adapters/drizzle/drizzle-user-preferences-repository'
import { TelegramClient } from './lib/telegram/telegram-client'
import { AgendaNotificationService } from './lib/telegram/agenda-notification-service'
import { TelegramPollingService } from './lib/telegram/telegram-polling-service'

const telegramClient = new TelegramClient(env.TELEGRAM_BOT_TOKEN ?? '')

const app = createApp(
  usersRepository,
  cofreEntriesRepository,
  notesRepository,
  tasksRepository,
  studyCoursesRepository,
  studyModulesRepository,
  studyPagesRepository,
  trackerHabitsRepository,
  trackerRecordsRepository,
  financeCategoriesRepository,
  financeTransactionsRepository,
  financeCreditCardExpensesRepository,
  agendaCalendarsRepository,
  agendaEventsRepository,
  agendaEventExceptionsRepository,
  agendaTelegramLinksRepository,
  userPreferencesRepository,
)

const notificationService = new AgendaNotificationService(
  agendaTelegramLinksRepository,
  userPreferencesRepository,
  agendaEventExceptionsRepository,
  telegramClient,
)

async function loadUpcomingEvents() {
  const now = new Date()
  const farFuture = new Date(now.getTime() + 7 * 24 * 60 * 60_000)
  const linkRows = await db
    .select({ userId: agendaTelegramLinks.userId })
    .from(agendaTelegramLinks)
  const userIds = linkRows.map((r) => r.userId)
  if (userIds.length === 0) return []
  const rows = await db
    .select()
    .from(agendaEvents)
    .where(
      and(
        inArray(agendaEvents.userId, userIds),
        gte(agendaEvents.endAt, now),
        lte(agendaEvents.startAt, farFuture),
        eq(agendaEvents.status, 'scheduled'),
      ),
    )
  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    calendarId: r.calendarId,
    title: r.title,
    description: r.description,
    location: r.location,
    startAt: r.startAt,
    endAt: r.endAt,
    allDay: r.allDay,
    recurrence: r.recurrence as 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceInterval: r.recurrenceInterval,
    recurrenceCount: r.recurrenceCount,
    recurrenceEndsAt: r.recurrenceEndsAt,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`HTTP server running on port ${env.PORT}`)
    console.log(`Documentation: http://localhost:${env.PORT}/docs`)
    if (telegramClient.isConfigured()) {
      console.log('Telegram bot polling enabled (receiving updates)')
      console.log('Telegram notifications enabled (polling every 60s)')
      const pollingService = new TelegramPollingService(
        telegramClient,
        agendaTelegramLinksRepository,
      )
      pollingService.start()
      setInterval(() => {
        void loadUpcomingEvents().then((events) =>
          notificationService.dispatchUpcomingEvents(events),
        )
      }, 60_000)
    } else {
      console.log(
        'Telegram not configured (TELEGRAM_BOT_TOKEN missing) — notifications disabled',
      )
    }
  })

if (env.NODE_ENV === 'development') {
  const specFile = resolve(process.cwd(), 'swagger.json')
  app.ready().then(() => {
    const spec = JSON.stringify(app.swagger(), null, 2)
    writeFile(specFile, spec).then(() => {
      console.log('Swagger spec generated → swagger.json')
    })
  })
}
