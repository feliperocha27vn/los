import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UnlinkTelegramUseCase } from '@use-cases/agenda/telegram/unlink-telegram'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'

export function deleteAgendaTelegramLinkRoute(
  agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete('/agenda/telegram/link', {
      schema: {
        tags: ['Agenda'],
        summary: 'Unlink Telegram account',
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const useCase = new UnlinkTelegramUseCase(
          agendaTelegramLinksRepository,
        )
        await useCase.execute({ userId })
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
