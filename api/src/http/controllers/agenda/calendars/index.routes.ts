import type { FastifyInstance } from 'fastify'
import { getAgendaCalendarsRoute } from './get-agenda-calendars'
import { postAgendaCalendarRoute } from './post-agenda-calendar'
import { getAgendaCalendarDetailRoute } from './get-agenda-calendar-detail'
import { putAgendaCalendarRoute } from './put-agenda-calendar'
import { deleteAgendaCalendarRoute } from './delete-agenda-calendar'
import type { AgendaCalendarsRepository } from '@repositories/agenda-calendars-repository'

export function registerAgendaCalendarsRoutes(
  app: FastifyInstance,
  agendaCalendarsRepository: AgendaCalendarsRepository,
): void {
  app
    .register(getAgendaCalendarsRoute(agendaCalendarsRepository))
    .register(postAgendaCalendarRoute(agendaCalendarsRepository))
    .register(getAgendaCalendarDetailRoute(agendaCalendarsRepository))
    .register(putAgendaCalendarRoute(agendaCalendarsRepository))
    .register(deleteAgendaCalendarRoute(agendaCalendarsRepository))
}
