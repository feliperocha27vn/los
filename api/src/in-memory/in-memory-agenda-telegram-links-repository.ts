import type {
  AgendaTelegramLinkRecord,
  AgendaTelegramLinksRepository,
  CreateAgendaTelegramLinkInput,
} from '@repositories/agenda-telegram-links-repository'

export class InMemoryAgendaTelegramLinksRepository
  implements AgendaTelegramLinksRepository
{
  private links: AgendaTelegramLinkRecord[] = []

  async findByUserId(
    userId: string,
  ): Promise<AgendaTelegramLinkRecord | null> {
    return this.links.find((l) => l.userId === userId) ?? null
  }

  async findByChatId(
    chatId: number,
  ): Promise<AgendaTelegramLinkRecord | null> {
    return this.links.find((l) => l.chatId === chatId) ?? null
  }

  async create(
    input: CreateAgendaTelegramLinkInput,
  ): Promise<AgendaTelegramLinkRecord> {
    const record: AgendaTelegramLinkRecord = {
      id: input.id,
      userId: input.userId,
      chatId: input.chatId,
      linkedAt: new Date(),
    }
    this.links.push(record)
    return record
  }

  async deleteByUserId(userId: string): Promise<void> {
    const index = this.links.findIndex((l) => l.userId === userId)
    if (index === -1) throw new Error('AgendaTelegramLink not found')
    this.links.splice(index, 1)
  }
}
