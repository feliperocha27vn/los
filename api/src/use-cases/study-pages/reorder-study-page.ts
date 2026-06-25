import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyPageRecord,
  StudyPagesRepository,
} from '@repositories/study-pages-repository'

interface ReorderStudyPageInput {
  pageId: string
  userId: string
  position: number
}

interface ReorderStudyPageOutput {
  page: StudyPageRecord
}

export class ReorderStudyPageUseCase {
  constructor(
    private readonly studyPagesRepository: StudyPagesRepository,
  ) {}

  async execute({
    pageId,
    userId,
    position,
  }: ReorderStudyPageInput): Promise<ReorderStudyPageOutput> {
    const existing = await this.studyPagesRepository.findById(pageId, userId)
    if (!existing) throw new ResourceNotFoundError()
    const page = await this.studyPagesRepository.reorder(pageId, userId, {
      position: position.toFixed(10),
    })
    return { page }
  }
}
