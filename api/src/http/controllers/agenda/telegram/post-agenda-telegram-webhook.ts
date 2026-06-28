import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { HandleTelegramStartUseCase } from '@use-cases/agenda/telegram/handle-telegram-start'
import { TelegramNotConfiguredError } from '@errors/telegram-not-configured-error'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'
import type { TelegramClient, TelegramUpdate } from '@lib/telegram/telegram-client'

interface VerifyJwt {
  (token: string): { sub: string } | null
}

export function postAgendaTelegramWebhookRoute(
  agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
  telegramClient: TelegramClient,
  verifyTokenJwt: VerifyJwt,
  expectedSecret: string,
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/agenda/telegram/webhook', {
      schema: {
        tags: ['Agenda'],
        summary: 'Telegram bot webhook (authenticates via X-Telegram-Bot-Api-Secret-Token)',
        response: {
          200: z.object({ ok: z.boolean() }),
          401: z.object({ message: z.string() }),
          503: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      if (!telegramClient.isConfigured()) {
        return reply
          .status(503)
          .send({ message: 'Telegram não está configurado no servidor' })
      }
      const providedSecret = request.headers['x-telegram-bot-api-secret-token']
      if (
        !expectedSecret ||
        typeof providedSecret !== 'string' ||
        providedSecret !== expectedSecret
      ) {
        return reply
          .status(401)
          .send({ message: 'Telegram webhook não autorizado' })
      }

      const update = request.body as TelegramUpdate
      const message = update.message
      if (!message?.text) {
        return reply.status(200).send({ ok: true })
      }
      const text = message.text.trim()
      if (!text.startsWith('/start')) {
        return reply.status(200).send({ ok: true })
      }
      const tokenMatch = text.match(/^\/start(?:\s+(\S+))?$/)
      const token = tokenMatch?.[1]
      const tokenPayload = token ? verifyTokenJwt(token) : null

      const useCase = new HandleTelegramStartUseCase(
        agendaTelegramLinksRepository,
      )
      const result = await useCase.execute({
        chatId: message.chat.id,
        tokenPayload,
      })

      try {
        await telegramClient.sendMessage(message.chat.id, result.responseMessage)
      } catch {
        // ignore send errors
      }
      return reply.status(200).send({ ok: true })
    })
  }
}

export { TelegramNotConfiguredError }
