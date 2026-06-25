import type {
  StudyPageRecord,
  StudyPagesRepository,
} from '@repositories/study-pages-repository'

interface FetchStudyPagesInput {
  userId: string
  moduleId?: string
}

interface FetchStudyPagesOutput {
  pages: StudyPageRecord[]
}

export class FetchStudyPagesUseCase {
  constructor(
    private readonly studyPagesRepository: StudyPagesRepository,
  ) {}

  async execute({
    userId,
    moduleId,
  }: FetchStudyPagesInput): Promise<FetchStudyPagesOutput> {
    const records = await this.studyPagesRepository.findManyByUserId(userId, {
      moduleId,
    })
    return { pages: records }
  }
}
