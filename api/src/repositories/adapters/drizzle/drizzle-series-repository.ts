import { and, desc, eq } from 'drizzle-orm'
import { series } from '@db/schema'
import { db } from '@lib/db'
import type {
  CreateSeriesInput,
  FindManySeriesFilter,
  SeriesRecord,
  SeriesRepository,
  UpdateSeriesInput,
} from '@repositories/series-repository'

function toRecord(row: typeof series.$inferSelect): SeriesRecord {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    state: row.state,
    season: row.season,
    episode: row.episode,
    positionSeconds: row.positionSeconds,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

class DrizzleSeriesRepository implements SeriesRepository {
  async findById(id: string, userId: string): Promise<SeriesRecord | null> {
    const rows = await db
      .select()
      .from(series)
      .where(and(eq(series.id, id), eq(series.userId, userId)))
      .limit(1)
    return rows[0] ? toRecord(rows[0]) : null
  }

  async findManyByUserId(
    userId: string,
    filter?: FindManySeriesFilter,
  ): Promise<SeriesRecord[]> {
    // Ordenação por updatedAt desc: a Série mexida mais recentemente é a que o
    // usuário está assistindo agora. Não há ordenação manual neste módulo.
    const rows = await db
      .select()
      .from(series)
      .where(
        filter?.state
          ? and(eq(series.userId, userId), eq(series.state, filter.state))
          : eq(series.userId, userId),
      )
      .orderBy(desc(series.updatedAt))
    return rows.map(toRecord)
  }

  async countByUserId(userId: string): Promise<number> {
    const rows = await db
      .select({ id: series.id })
      .from(series)
      .where(eq(series.userId, userId))
    return rows.length
  }

  async create(input: CreateSeriesInput): Promise<SeriesRecord> {
    const [row] = await db.insert(series).values(input).returning()
    return toRecord(row)
  }

  async update(
    id: string,
    userId: string,
    input: UpdateSeriesInput,
  ): Promise<SeriesRecord> {
    const [row] = await db
      .update(series)
      .set({ ...input, updatedAt: new Date() })
      .where(and(eq(series.id, id), eq(series.userId, userId)))
      .returning()
    if (!row) throw new Error('Series not found')
    return toRecord(row)
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await db
      .delete(series)
      .where(and(eq(series.id, id), eq(series.userId, userId)))
    if (result.count === 0) throw new Error('Series not found')
  }
}

export const seriesRepository = new DrizzleSeriesRepository()
