import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyModuleRecord,
  StudyModulesRepository,
} from '@repositories/study-modules-repository'

interface GetStudyModuleDetailInput {
  moduleId: string
  userId: string
}

interface GetStudyModuleDetailOutput {
  module: StudyModuleRecord
}

export class GetStudyModuleDetailUseCase {
  constructor(
    private readonly studyModulesRepository: StudyModulesRepository,
  ) {}

  async execute({
    moduleId,
    userId,
  }: GetStudyModuleDetailInput): Promise<GetStudyModuleDetailOutput> {
    const module = await this.studyModulesRepository.findById(moduleId, userId)
    if (!module) throw new ResourceNotFoundError()
    return { module }
  }
}
