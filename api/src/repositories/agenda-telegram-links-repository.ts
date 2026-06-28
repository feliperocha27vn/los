export interface AgendaTelegramLinkRecord {
  id: string
  userId: string
  chatId: number
  linkedAt: Date
}

export type CreateAgendaTelegramLinkInput = Pick<
  AgendaTelegramLinkRecord,
  'id' | 'userId' | 'chatId'
>

export interface AgendaTelegramLinksRepository {
  findByUserId(userId: string): Promise<AgendaTelegramLinkRecord | null>
  findByChatId(chatId: number): Promise<AgendaTelegramLinkRecord | null>
  create(input: CreateAgendaTelegramLinkInput): Promise<AgendaTelegramLinkRecord>
  deleteByUserId(userId: string): Promise<void>
}
