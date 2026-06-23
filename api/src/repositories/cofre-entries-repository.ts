export type CofreCategory = 'credential' | 'secure_note' | 'api_key'

export interface CofreEntryRecord {
  id: string
  userId: string
  category: CofreCategory
  title: string
  url: string | null
  username: string | null
  passwordEnc: string | null
  contentEnc: string | null
  provider: string | null
  tokenEnc: string | null
  createdAt: Date
  updatedAt: Date
}

export type CreateCofreEntryInput = Pick<
  CofreEntryRecord,
  'id' | 'userId' | 'category' | 'title'
> & {
  url?: string | null
  username?: string | null
  passwordEnc?: string | null
  contentEnc?: string | null
  provider?: string | null
  tokenEnc?: string | null
}

export type UpdateCofreEntryInput = Partial<
  Pick<
    CofreEntryRecord,
    | 'title'
    | 'url'
    | 'username'
    | 'passwordEnc'
    | 'contentEnc'
    | 'provider'
    | 'tokenEnc'
  >
>

export interface CofreEntriesRepository {
  findById(id: string, userId: string): Promise<CofreEntryRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { category?: CofreCategory; search?: string }
  ): Promise<CofreEntryRecord[]>
  create(input: CreateCofreEntryInput): Promise<CofreEntryRecord>
  update(id: string, userId: string, input: UpdateCofreEntryInput): Promise<CofreEntryRecord>
  delete(id: string, userId: string): Promise<void>
}
