import type {
  StudyModuleRecord,
  StudyModulesRepository,
} from '@repositories/study-modules-repository'

interface FetchStudyModulesInput {
  userId: string
  courseId?: string
}

interface FetchStudyModulesOutput {
  modules: StudyModuleRecord[]
}

export class FetchStudyModulesUseCase {
  constructor(
    private readonly studyModulesRepository: StudyModulesRepository,
  ) {}

  async execute({
    userId,
    courseId,
  }: FetchStudyModulesInput): Promise<FetchStudyModulesOutput> {
    const records = await this.studyModulesRepository.findManyByUserId(userId, {
      courseId,
    })
    return { modules: records }
  }
}
