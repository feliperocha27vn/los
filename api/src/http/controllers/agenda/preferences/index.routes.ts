import type { FastifyInstance } from 'fastify'
import { getAgendaPreferencesRoute } from './get-agenda-preferences'
import { putAgendaPreferencesRoute } from './put-agenda-preferences'
import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'

export function registerAgendaPreferencesRoutes(
  app: FastifyInstance,
  userPreferencesRepository: UserPreferencesRepository,
): void {
  app
    .register(getAgendaPreferencesRoute(userPreferencesRepository))
    .register(putAgendaPreferencesRoute(userPreferencesRepository))
}
