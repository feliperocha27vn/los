import { InMemoryAgendaCalendarsRepository } from '@in-memory/in-memory-agenda-calendars-repository'
import { InMemoryAgendaEventExceptionsRepository } from '@in-memory/in-memory-agenda-event-exceptions-repository'
import { InMemoryAgendaEventsRepository } from '@in-memory/in-memory-agenda-events-repository'
import { InMemoryAgendaTelegramLinksRepository } from '@in-memory/in-memory-agenda-telegram-links-repository'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { InMemoryFinanceCategoriesRepository } from '@in-memory/in-memory-finance-categories-repository'
import { InMemoryFinanceCreditCardExpensesRepository } from '@in-memory/in-memory-finance-credit-card-expenses-repository'
import { InMemoryFinanceTransactionsRepository } from '@in-memory/in-memory-finance-transactions-repository'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { InMemoryTrackerRecordsRepository } from '@in-memory/in-memory-tracker-records-repository'
import { InMemoryUserPreferencesRepository } from '@in-memory/in-memory-user-preferences-repository'
import { TelegramClient } from '@lib/telegram/telegram-client'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import type { NotesRepository } from '@repositories/notes-repository'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'
import type { TasksRepository } from '@repositories/tasks-repository'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'
import type { UsersRepository } from '@repositories/users-repository'
import type { FastifyInstance, FastifyPluginAsync } from 'fastify'
import { env } from '../../env'
import { registerAuthRoutes } from './auth/index.routes'
import { registerCofreRoutes } from './cofre/index.routes'
import { registerFinanceRoutes } from './finance/index.routes'
import { registerNotesRoutes } from './notes/index.routes'
import { registerStudyCoursesRoutes } from './study-courses/index.routes'
import { registerStudyModulesRoutes } from './study-modules/index.routes'
import { registerStudyPagesRoutes } from './study-pages/index.routes'
import { registerTasksRoutes } from './tasks/index.routes'
import { registerTrackerHabitsRoutes } from './tracker/habits.routes'
import { registerTrackerRecordsRoutes } from './tracker/records.routes'
import { registerTrackerViewsRoutes } from './tracker/views.routes'
import { registerAgendaRoutes } from './agenda/index.routes'

interface ControllersDeps {
  usersRepository: UsersRepository
  cofreEntriesRepository?: CofreEntriesRepository
  notesRepository?: NotesRepository
  tasksRepository?: TasksRepository
  studyCoursesRepository?: StudyCoursesRepository
  studyModulesRepository?: StudyModulesRepository
  studyPagesRepository?: StudyPagesRepository
  trackerHabitsRepository?: TrackerHabitsRepository
  trackerRecordsRepository?: TrackerRecordsRepository
  financeCategoriesRepository?: FinanceCategoriesRepository
  financeTransactionsRepository?: FinanceTransactionsRepository
  financeCreditCardExpensesRepository?: FinanceCreditCardExpensesRepository
  agendaCalendarsRepository?: AgendaCalendarsRepository
  agendaEventsRepository?: AgendaEventsRepository
  agendaEventExceptionsRepository?: AgendaEventExceptionsRepository
  agendaTelegramLinksRepository?: AgendaTelegramLinksRepository
  userPreferencesRepository?: UserPreferencesRepository
}

export function controllers(deps: ControllersDeps): FastifyPluginAsync {
  const cofreEntriesRepo = deps.cofreEntriesRepository ?? new InMemoryCofreEntriesRepository()
  const notesRepo = deps.notesRepository ?? new InMemoryNotesRepository()
  const tasksRepo = deps.tasksRepository ?? new InMemoryTasksRepository()
  const studyCoursesRepo = deps.studyCoursesRepository ?? new InMemoryStudyCoursesRepository()
  const studyModulesRepo = deps.studyModulesRepository ?? new InMemoryStudyModulesRepository()
  const studyPagesRepo = deps.studyPagesRepository ?? new InMemoryStudyPagesRepository()
  const trackerHabitsRepo = deps.trackerHabitsRepository ?? new InMemoryTrackerHabitsRepository()
  const trackerRecordsRepo = deps.trackerRecordsRepository ?? new InMemoryTrackerRecordsRepository()
  const financeCategoriesRepo =
    deps.financeCategoriesRepository ?? new InMemoryFinanceCategoriesRepository()
  const financeTransactionsRepo =
    deps.financeTransactionsRepository ?? new InMemoryFinanceTransactionsRepository()
  const financeCreditCardExpensesRepo =
    deps.financeCreditCardExpensesRepository ?? new InMemoryFinanceCreditCardExpensesRepository()
  const agendaCalendarsRepo =
    deps.agendaCalendarsRepository ?? new InMemoryAgendaCalendarsRepository()
  const agendaEventsRepo =
    deps.agendaEventsRepository ?? new InMemoryAgendaEventsRepository()
  const agendaEventExceptionsRepo =
    deps.agendaEventExceptionsRepository ?? new InMemoryAgendaEventExceptionsRepository()
  const agendaTelegramLinksRepo =
    deps.agendaTelegramLinksRepository ?? new InMemoryAgendaTelegramLinksRepository()
  const userPreferencesRepo =
    deps.userPreferencesRepository ?? new InMemoryUserPreferencesRepository()

  const telegramClient = new TelegramClient(env.TELEGRAM_BOT_TOKEN ?? '')

  return async (app: FastifyInstance) => {
    registerAuthRoutes(app, deps.usersRepository)
    registerCofreRoutes(app, deps.usersRepository, cofreEntriesRepo)
    registerNotesRoutes(app, notesRepo)
    registerTasksRoutes(app, tasksRepo)
    registerStudyCoursesRoutes(app, studyCoursesRepo)
    registerStudyModulesRoutes(app, studyModulesRepo, studyCoursesRepo)
    registerStudyPagesRoutes(app, studyPagesRepo, studyModulesRepo, studyCoursesRepo)
    registerTrackerHabitsRoutes(app, trackerHabitsRepo)
    registerTrackerRecordsRoutes(app, trackerRecordsRepo, trackerHabitsRepo)
    registerTrackerViewsRoutes(app, trackerRecordsRepo, trackerHabitsRepo)
    registerFinanceRoutes(app, {
      financeCategoriesRepository: financeCategoriesRepo,
      financeTransactionsRepository: financeTransactionsRepo,
      financeCreditCardExpensesRepository: financeCreditCardExpensesRepo,
    })
    registerAgendaRoutes(app, {
      agendaCalendarsRepository: agendaCalendarsRepo,
      agendaEventsRepository: agendaEventsRepo,
      agendaEventExceptionsRepository: agendaEventExceptionsRepo,
      agendaTelegramLinksRepository: agendaTelegramLinksRepo,
      userPreferencesRepository: userPreferencesRepo,
      telegramClient,
      jwtSign: (payload, options) =>
        app.jwt.sign(payload, options as { expiresIn?: string } | undefined),
      verifyTokenJwt: (token: string) => {
        try {
          const payload = app.jwt.verify(token) as { sub: string }
          return { sub: payload.sub }
        } catch {
          return null
        }
      },
      botUsername: env.TELEGRAM_BOT_USERNAME ?? '',
      telegramWebhookSecret: env.TELEGRAM_WEBHOOK_SECRET ?? '',
    })
  }
}

