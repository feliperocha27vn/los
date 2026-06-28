import { randomUUID } from 'node:crypto'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'

interface HandleTelegramStartInput {
  chatId: number
  tokenPayload: { sub: string } | null
}

interface HandleTelegramStartOutput {
  userId: string | null
  alreadyLinked: boolean
  responseMessage: string
}

export class HandleTelegramStartUseCase {
  constructor(
    private readonly agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
  ) {}

  async execute(
    input: HandleTelegramStartInput,
  ): Promise<HandleTelegramStartOutput> {
    if (!input.tokenPayload) {
      return {
        userId: null,
        alreadyLinked: false,
        responseMessage:
          '👋 Olá! Para vincular sua conta Life OS, abra o app e gere um link de vinculação em Configurações > Agenda > Telegram. Depois clique nesse link aqui e aperte Enviar.',
      }
    }
    const userId = input.tokenPayload.sub

    const existing = await this.agendaTelegramLinksRepository.findByUserId(
      userId,
    )
    if (existing) {
      return {
        userId,
        alreadyLinked: true,
        responseMessage:
          '✅ Sua conta já está vinculada ao Life OS. Você receberá lembretes de compromissos aqui.',
      }
    }

    const existingByChat = await this.agendaTelegramLinksRepository.findByChatId(
      input.chatId,
    )
    if (existingByChat) {
      return {
        userId: null,
        alreadyLinked: true,
        responseMessage:
          '⚠️ Este chat já está vinculado a outra conta. Desvincule primeiro nas configurações.',
      }
    }

    await this.agendaTelegramLinksRepository.create({
      id: randomUUID(),
      userId,
      chatId: input.chatId,
    })
    return {
      userId,
      alreadyLinked: false,
      responseMessage:
        '✅ Conta Life OS vinculada com sucesso! Você receberá lembretes de compromissos aqui.',
    }
  }
}
