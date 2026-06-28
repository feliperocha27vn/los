import type { FastifyInstance } from 'fastify'
import { registerAgendaCalendarsRoutes } from './calendars/index.routes'
import { registerAgendaEventsRoutes } from './events/index.routes'
import { registerAgendaExceptionsRoutes } from './exceptions/index.routes'
import { registerAgendaPreferencesRoutes } from './preferences/index.routes'
import { registerAgendaTelegramRoutes } from './telegram/index.routes'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'
import type { AgendaEventExceptionsRepository } from '@repositories/agenda-event-exceptions-repository'
import type { AgendaEventsRepository } from '@repositories/agenda-events-repository'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'
import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'
import type { TelegramClient } from '@lib/telegram/telegram-client'

export interface AgendaRoutesDeps {
  agendaCalendarsRepository: AgendaCalendarsRepository
  agendaEventsRepository: AgendaEventsRepository
  agendaEventExceptionsRepository: AgendaEventExceptionsRepository
  agendaTelegramLinksRepository: AgendaTelegramLinksRepository
  userPreferencesRepository: UserPreferencesRepository
  telegramClient: TelegramClient
  jwtSign: (payload: object, options?: { expiresIn?: string }) => string
  verifyTokenJwt: (token: string) => { sub: string } | null
  botUsername: string
  telegramWebhookSecret: string
}

export function registerAgendaRoutes(
  app: FastifyInstance,
  deps: AgendaRoutesDeps,
): void {
  registerAgendaCalendarsRoutes(app, deps.agendaCalendarsRepository)
  registerAgendaEventsRoutes(
    app,
    deps.agendaEventsRepository,
    deps.agendaEventExceptionsRepository,
    deps.agendaCalendarsRepository,
  )
  registerAgendaExceptionsRoutes(
    app,
    deps.agendaEventsRepository,
    deps.agendaEventExceptionsRepository,
  )
  registerAgendaPreferencesRoutes(app, deps.userPreferencesRepository)
  registerAgendaTelegramRoutes(
    app,
    deps.agendaTelegramLinksRepository,
    deps.telegramClient,
    deps.jwtSign,
    deps.verifyTokenJwt,
    deps.botUsername,
    deps.telegramWebhookSecret,
  )
}
