import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

interface DeleteStudyModuleInput {
  moduleId: string
  userId: string
}

export class DeleteStudyModuleUseCase {
  constructor(
    private readonly studyModulesRepository: StudyModulesRepository,
  ) {}

  async execute({
    moduleId,
    userId,
  }: DeleteStudyModuleInput): Promise<void> {
    try {
      await this.studyModulesRepository.delete(moduleId, userId)
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
