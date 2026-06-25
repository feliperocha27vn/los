import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyCourseRecord,
  StudyCoursesRepository,
} from '@repositories/study-courses-repository'

interface ReorderStudyCourseInput {
  courseId: string
  userId: string
  position: number
}

interface ReorderStudyCourseOutput {
  course: StudyCourseRecord
}

export class ReorderStudyCourseUseCase {
  constructor(
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    courseId,
    userId,
    position,
  }: ReorderStudyCourseInput): Promise<ReorderStudyCourseOutput> {
    const existing = await this.studyCoursesRepository.findById(courseId, userId)
    if (!existing) throw new ResourceNotFoundError()
    const course = await this.studyCoursesRepository.reorder(courseId, userId, {
      position: position.toFixed(10),
    })
    return { course }
  }
}
