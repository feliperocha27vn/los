import type { FastifyInstance } from 'fastify'
import { getAgendaTelegramLinkRoute } from './get-agenda-telegram-link'
import { postAgendaTelegramWebhookRoute } from './post-agenda-telegram-webhook'
import { deleteAgendaTelegramLinkRoute } from './delete-agenda-telegram-link'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'
import type { TelegramClient } from '@lib/telegram/telegram-client'

export function registerAgendaTelegramRoutes(
  app: FastifyInstance,
  agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
  telegramClient: TelegramClient,
  jwtSign: (payload: object, options?: { expiresIn?: string }) => string,
  verifyTokenJwt: (token: string) => { sub: string } | null,
  botUsername: string,
  webhookSecret: string,
): void {
  app.register(
    getAgendaTelegramLinkRoute(
      agendaTelegramLinksRepository,
      telegramClient,
      jwtSign,
      botUsername,
    ),
  )
  app.register(
    postAgendaTelegramWebhookRoute(
      agendaTelegramLinksRepository,
      telegramClient,
      verifyTokenJwt,
      webhookSecret,
    ),
  )
  app.register(
    deleteAgendaTelegramLinkRoute(agendaTelegramLinksRepository),
  )
}
