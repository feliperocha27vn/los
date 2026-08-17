export type SeriesState = 'watching' | 'paused' | 'finished'

export interface SeriesRecord {
  id: string
  userId: string
  name: string
  state: SeriesState
  season: number
  episode: number
  positionSeconds: number
  createdAt: Date
  updatedAt: Date
}

export type CreateSeriesInput = Pick<
  SeriesRecord,
  'id' | 'userId' | 'name' | 'state' | 'season' | 'episode' | 'positionSeconds'
>

export type UpdateSeriesInput = Partial<
  Pick<SeriesRecord, 'name' | 'state' | 'season' | 'episode' | 'positionSeconds'>
>

export interface FindManySeriesFilter {
  state?: SeriesState
}

export interface SeriesRepository {
  findById(id: string, userId: string): Promise<SeriesRecord | null>
  findManyByUserId(userId: string, filter?: FindManySeriesFilter): Promise<SeriesRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateSeriesInput): Promise<SeriesRecord>
  update(id: string, userId: string, input: UpdateSeriesInput): Promise<SeriesRecord>
  delete(id: string, userId: string): Promise<void>
}
