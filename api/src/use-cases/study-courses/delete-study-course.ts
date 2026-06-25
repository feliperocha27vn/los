import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

interface DeleteStudyCourseInput {
  courseId: string
  userId: string
}

export class DeleteStudyCourseUseCase {
  constructor(
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    courseId,
    userId,
  }: DeleteStudyCourseInput): Promise<void> {
    try {
      await this.studyCoursesRepository.delete(courseId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
