import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetAgendaPreferencesUseCase } from '@use-cases/agenda/preferences/get-agenda-preferences'
import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'

export function getAgendaPreferencesRoute(
  userPreferencesRepository: UserPreferencesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/agenda/preferences', {
      schema: {
        tags: ['Agenda'],
        summary: 'Get agenda preferences',
        response: {
          200: z.object({
            preferences: z.object({
              notificationOffsetMinutes: z.number(),
              timezone: z.string(),
            }),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const useCase = new GetAgendaPreferencesUseCase(
        userPreferencesRepository,
      )
      const { preferences } = await useCase.execute({ userId })
      return reply.status(200).send({ preferences })
    })
  }
}
