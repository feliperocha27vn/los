import type {
  CreateSeriesInput,
  FindManySeriesFilter,
  SeriesRecord,
  SeriesRepository,
  UpdateSeriesInput,
} from '@repositories/series-repository'

export class InMemorySeriesRepository implements SeriesRepository {
  private series: SeriesRecord[] = []

  // A listagem ordena por updatedAt desc. Duas escritas no mesmo milissegundo
  // empatariam e tornariam a ordem indefinida nos testes, então o test double
  // garante um relógio estritamente crescente.
  private lastStamp = 0

  private nextStamp(): Date {
    this.lastStamp = Math.max(Date.now(), this.lastStamp + 1)
    return new Date(this.lastStamp)
  }

  async findById(id: string, userId: string): Promise<SeriesRecord | null> {
    return this.series.find((s) => s.id === id && s.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filter?: FindManySeriesFilter,
  ): Promise<SeriesRecord[]> {
    return this.series
      .filter((s) => s.userId === userId)
      .filter((s) => (filter?.state ? s.state === filter.state : true))
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  async countByUserId(userId: string): Promise<number> {
    return this.series.filter((s) => s.userId === userId).length
  }

  async create(input: CreateSeriesInput): Promise<SeriesRecord> {
    const stamp = this.nextStamp()
    const record: SeriesRecord = {
      id: input.id,
      userId: input.userId,
      name: input.name,
      state: input.state,
      season: input.season,
      episode: input.episode,
      positionSeconds: input.positionSeconds,
      createdAt: stamp,
      updatedAt: stamp,
    }
    this.series.push(record)
    return record
  }

  async update(
    id: string,
    userId: string,
    input: UpdateSeriesInput,
  ): Promise<SeriesRecord> {
    const record = this.series.find((s) => s.id === id && s.userId === userId)
    if (!record) throw new Error('Series not found')
    if (input.name !== undefined) record.name = input.name
    if (input.state !== undefined) record.state = input.state
    if (input.season !== undefined) record.season = input.season
    if (input.episode !== undefined) record.episode = input.episode
    if (input.positionSeconds !== undefined) {
      record.positionSeconds = input.positionSeconds
    }
    record.updatedAt = this.nextStamp()
    return record
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.series.findIndex((s) => s.id === id && s.userId === userId)
    if (index === -1) throw new Error('Series not found')
    this.series.splice(index, 1)
  }
}
