import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyCourseRecord,
  StudyCoursesRepository,
} from '@repositories/study-courses-repository'

interface GetStudyCourseDetailInput {
  courseId: string
  userId: string
}

interface GetStudyCourseDetailOutput {
  course: StudyCourseRecord
}

export class GetStudyCourseDetailUseCase {
  constructor(
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    courseId,
    userId,
  }: GetStudyCourseDetailInput): Promise<GetStudyCourseDetailOutput> {
    const course = await this.studyCoursesRepository.findById(courseId, userId)
    if (!course) throw new ResourceNotFoundError()
    return { course }
  }
}
