import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

interface DeleteStudyPageInput {
  pageId: string
  userId: string
}

export class DeleteStudyPageUseCase {
  constructor(
    private readonly studyPagesRepository: StudyPagesRepository,
  ) {}

  async execute({ pageId, userId }: DeleteStudyPageInput): Promise<void> {
    try {
      await this.studyPagesRepository.delete(pageId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
