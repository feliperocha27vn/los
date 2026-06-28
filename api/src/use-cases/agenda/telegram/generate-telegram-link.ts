import { randomUUID } from 'node:crypto'
import { TelegramNotConfiguredError } from '@errors/telegram-not-configured-error'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'

interface GenerateTelegramLinkInput {
  userId: string
  botUsername: string
  jwtSecret: string
  jwtSign: (payload: object, options?: { expiresIn?: string }) => string
}

interface GenerateTelegramLinkOutput {
  link: string
}

const TOKEN_EXPIRY = '10m'

export class GenerateTelegramLinkUseCase {
  constructor(
    private readonly agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
  ) {}

  async execute(
    input: GenerateTelegramLinkInput,
  ): Promise<GenerateTelegramLinkOutput> {
    if (!input.botUsername) {
      throw new TelegramNotConfiguredError()
    }
    const token = input.jwtSign(
      { sub: input.userId, scope: 'telegram-link' },
      { expiresIn: TOKEN_EXPIRY },
    )
    const link = `https://t.me/${input.botUsername}?start=${token}`
    return { link }
  }
}
