import { eq } from 'drizzle-orm'
import { agendaTelegramLinks } from '@db/schema'
import { db } from '@lib/db'
import type {
  AgendaTelegramLinkRecord,
  AgendaTelegramLinksRepository,
  CreateAgendaTelegramLinkInput,
} from '@repositories/agenda-telegram-links-repository'

function toRecord(
  row: typeof agendaTelegramLinks.$inferSelect,
): AgendaTelegramLinkRecord {
  return {
    id: row.id,
    userId: row.userId,
    chatId: row.chatId,
    linkedAt: row.linkedAt,
  }
}

class DrizzleAgendaTelegramLinksRepository
  implements AgendaTelegramLinksRepository
{
  async findByUserId(
    userId: string,
  ): Promise<AgendaTelegramLinkRecord | null> {
    const rows = await db
      .select()
      .from(agendaTelegramLinks)
      .where(eq(agendaTelegramLinks.userId, userId))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findByChatId(
    chatId: number,
  ): Promise<AgendaTelegramLinkRecord | null> {
    const rows = await db
      .select()
      .from(agendaTelegramLinks)
      .where(eq(agendaTelegramLinks.chatId, chatId))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async create(
    input: CreateAgendaTelegramLinkInput,
  ): Promise<AgendaTelegramLinkRecord> {
    const [row] = await db.insert(agendaTelegramLinks).values(input).returning()
    return toRecord(row)
  }

  async deleteByUserId(userId: string): Promise<void> {
    const result = await db
      .delete(agendaTelegramLinks)
      .where(eq(agendaTelegramLinks.userId, userId))
    if (result.count === 0) throw new Error('AgendaTelegramLink not found')
  }
}

export const agendaTelegramLinksRepository =
  new DrizzleAgendaTelegramLinksRepository()
