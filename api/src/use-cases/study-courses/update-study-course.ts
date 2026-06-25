import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyCourseRecord,
  StudyCoursesRepository,
  UpdateStudyCourseInput,
} from '@repositories/study-courses-repository'

interface UpdateStudyCoursePayload {
  courseId: string
  userId: string
  name?: string
}

interface UpdateStudyCourseOutput {
  course: StudyCourseRecord
}

export class UpdateStudyCourseUseCase {
  constructor(
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    courseId,
    userId,
    ...data
  }: UpdateStudyCoursePayload): Promise<UpdateStudyCourseOutput> {
    const input: UpdateStudyCourseInput = {}
    if (data.name !== undefined) input.name = data.name
    try {
      const course = await this.studyCoursesRepository.update(
        courseId,
        userId,
        input,
      )
      return { course }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
