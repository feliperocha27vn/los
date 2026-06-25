import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type {
  StudyModuleRecord,
  StudyModulesRepository,
  UpdateStudyModuleInput,
} from '@repositories/study-modules-repository'

interface UpdateStudyModulePayload {
  moduleId: string
  userId: string
  name?: string
}

interface UpdateStudyModuleOutput {
  module: StudyModuleRecord
}

export class UpdateStudyModuleUseCase {
  constructor(
    private readonly studyModulesRepository: StudyModulesRepository,
  ) {}

  async execute({
    moduleId,
    userId,
    ...data
  }: UpdateStudyModulePayload): Promise<UpdateStudyModuleOutput> {
    const input: UpdateStudyModuleInput = {}
    if (data.name !== undefined) input.name = data.name
    try {
      const module = await this.studyModulesRepository.update(
        moduleId,
        userId,
        input,
      )
      return { module }
    } catch {
      throw new ResourceNotFoundError()
    }
  }
}
