import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyPageRecord,
  StudyPagesRepository,
  UpdateStudyPageInput,
} from '@repositories/study-pages-repository'

interface UpdateStudyPagePayload {
  pageId: string
  userId: string
  title?: string
  content?: string
}

interface UpdateStudyPageOutput {
  page: StudyPageRecord
}

export class UpdateStudyPageUseCase {
  constructor(
    private readonly studyPagesRepository: StudyPagesRepository,
  ) {}

  async execute({
    pageId,
    userId,
    ...data
  }: UpdateStudyPagePayload): Promise<UpdateStudyPageOutput> {
    const input: UpdateStudyPageInput = {}
    if (data.title !== undefined) input.title = data.title
    if (data.content !== undefined) input.content = data.content
    try {
      const page = await this.studyPagesRepository.update(pageId, userId, input)
      return { page }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
