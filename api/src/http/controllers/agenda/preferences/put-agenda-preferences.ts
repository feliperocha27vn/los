import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateAgendaPreferencesUseCase } from '@use-cases/agenda/preferences/update-agenda-preferences'
import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'

export function putAgendaPreferencesRoute(
  userPreferencesRepository: UserPreferencesRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/agenda/preferences', {
      schema: {
        tags: ['Agenda'],
        summary: 'Update agenda preferences',
        body: z
          .object({
            notificationOffsetMinutes: z.number().int().min(0).max(1440).optional(),
            timezone: z.string().min(1).optional(),
          })
          .refine(
            (b) =>
              b.notificationOffsetMinutes !== undefined ||
              b.timezone !== undefined,
            { message: 'Pelo menos um campo deve ser fornecido' },
          ),
        response: {
          200: z.object({
            preferences: z.object({
              notificationOffsetMinutes: z.number(),
              timezone: z.string(),
            }),
          }),
          400: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { notificationOffsetMinutes, timezone } = request.body
        const useCase = new UpdateAgendaPreferencesUseCase(
          userPreferencesRepository,
        )
        const { preferences } = await useCase.execute({
          userId,
          notificationOffsetMinutes,
          timezone,
        })
        return reply.status(200).send({ preferences })
      } catch (error) {
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
