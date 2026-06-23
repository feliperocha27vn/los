import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  CofreEntriesRepository,
  CofreEntryRecord,
  UpdateCofreEntryInput,
} from '@repositories/cofre-entries-repository'

interface UpdateCofreEntryPayload {
  entryId: string
  userId: string
  title?: string
  url?: string | null
  username?: string | null
  passwordEnc?: string | null
  contentEnc?: string | null
  provider?: string | null
  tokenEnc?: string | null
}

interface UpdateCofreEntryOutput {
  entry: CofreEntryRecord
}

export class UpdateCofreEntryUseCase {
  constructor(private readonly entriesRepository: CofreEntriesRepository) {}

  async execute({
    entryId,
    userId,
    ...data
  }: UpdateCofreEntryPayload): Promise<UpdateCofreEntryOutput> {
    const input: UpdateCofreEntryInput = {}

    if (data.title !== undefined) input.title = data.title
    if (data.url !== undefined) input.url = data.url
    if (data.username !== undefined) input.username = data.username
    if (data.passwordEnc !== undefined) input.passwordEnc = data.passwordEnc
    if (data.contentEnc !== undefined) input.contentEnc = data.contentEnc
    if (data.provider !== undefined) input.provider = data.provider
    if (data.tokenEnc !== undefined) input.tokenEnc = data.tokenEnc

    try {
      const entry = await this.entriesRepository.update(entryId, userId, input)
      return { entry }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
