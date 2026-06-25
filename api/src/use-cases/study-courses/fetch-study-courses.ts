import type {
  StudyCourseRecord,
  StudyCoursesRepository,
} from '@repositories/study-courses-repository'

interface FetchStudyCoursesInput {
  userId: string
}

interface FetchStudyCoursesOutput {
  courses: StudyCourseRecord[]
}

export class FetchStudyCoursesUseCase {
  constructor(
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    userId,
  }: FetchStudyCoursesInput): Promise<FetchStudyCoursesOutput> {
    const records = await this.studyCoursesRepository.findManyByUserId(userId)
    return { courses: records }
  }
}
