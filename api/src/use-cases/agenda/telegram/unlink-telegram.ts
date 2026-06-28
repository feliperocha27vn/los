import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'

interface UnlinkTelegramInput {
  userId: string
}

export class UnlinkTelegramUseCase {
  constructor(
    private readonly agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
  ) {}

  async execute(input: UnlinkTelegramInput): Promise<void> {
    try {
      await this.agendaTelegramLinksRepository.deleteByUserId(input.userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
