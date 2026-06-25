import { randomUUID } from 'node:crypto'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type {
  StudyModuleRecord,
  StudyModulesRepository,
} from '@repositories/study-modules-repository'

const STUDY_MODULE_LIMIT = 200
const POSITION_STEP = 1.0

interface CreateStudyModuleInput {
  userId: string
  courseId: string
  name: string
}

interface CreateStudyModuleOutput {
  module: StudyModuleRecord
}

export class CreateStudyModuleUseCase {
  constructor(
    private readonly studyModulesRepository: StudyModulesRepository,
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    userId,
    courseId,
    name,
  }: CreateStudyModuleInput): Promise<CreateStudyModuleOutput> {
    const course = await this.studyCoursesRepository.findById(courseId, userId)
    if (!course) throw new ResourceNotFoundError()

    const count = await this.studyModulesRepository.countByCourseId(
      courseId,
      userId,
    )
    if (count >= STUDY_MODULE_LIMIT) {
      throw new Error('Limite de módulos atingido (200)')
    }

    const modules = await this.studyModulesRepository.findManyByUserId(userId, {
      courseId,
    })
    const maxPosition = modules.reduce((max, m) => {
      const n = Number(m.position)
      return Number.isFinite(n) && n > max ? n : max
    }, 0)
    const nextPosition = (maxPosition + POSITION_STEP).toFixed(10)

    const module = await this.studyModulesRepository.create({
      id: randomUUID(),
      courseId,
      userId,
      name,
      position: nextPosition,
    })
    return { module }
  }
}
