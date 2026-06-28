import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GenerateTelegramLinkUseCase } from '@use-cases/agenda/telegram/generate-telegram-link'
import { TelegramNotConfiguredError } from '@errors/telegram-not-configured-error'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'
import type { TelegramClient } from '@lib/telegram/telegram-client'

export function getAgendaTelegramLinkRoute(
  agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
  telegramClient: TelegramClient,
  jwtSign: (payload: object, options?: { expiresIn?: string }) => string,
  botUsername: string,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/agenda/telegram/link', {
      schema: {
        tags: ['Agenda'],
        summary: 'Generate Telegram deep link',
        response: {
          200: z.object({ link: z.string() }),
          503: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        if (!telegramClient.isConfigured() || !botUsername) {
          return reply
            .status(503)
            .send({ message: 'Telegram não está configurado no servidor' })
        }
        const useCase = new GenerateTelegramLinkUseCase(
          agendaTelegramLinksRepository,
        )
        const { link } = await useCase.execute({
          userId,
          botUsername,
          jwtSecret: '',
          jwtSign,
        })
        return reply.status(200).send({ link })
      } catch (error) {
        if (error instanceof TelegramNotConfiguredError) {
          return reply.status(503).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
