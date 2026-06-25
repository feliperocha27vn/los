import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyModuleRecord,
  StudyModulesRepository,
} from '@repositories/study-modules-repository'

interface ReorderStudyModuleInput {
  moduleId: string
  userId: string
  position: number
}

interface ReorderStudyModuleOutput {
  module: StudyModuleRecord
}

export class ReorderStudyModuleUseCase {
  constructor(
    private readonly studyModulesRepository: StudyModulesRepository,
  ) {}

  async execute({
    moduleId,
    userId,
    position,
  }: ReorderStudyModuleInput): Promise<ReorderStudyModuleOutput> {
    const existing = await this.studyModulesRepository.findById(moduleId, userId)
    if (!existing) throw new ResourceNotFoundError()
    const module = await this.studyModulesRepository.reorder(moduleId, userId, {
      position: position.toFixed(10),
    })
    return { module }
  }
}
