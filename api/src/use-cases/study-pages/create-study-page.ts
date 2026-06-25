import { randomUUID } from 'node:crypto'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type {
  StudyPageRecord,
  StudyPagesRepository,
} from '@repositories/study-pages-repository'

const STUDY_PAGE_LIMIT = 200
const POSITION_STEP = 1.0

interface CreateStudyPageInput {
  userId: string
  moduleId: string
  title: string
  content?: string
}

interface CreateStudyPageOutput {
  page: StudyPageRecord
}

export class CreateStudyPageUseCase {
  constructor(
    private readonly studyPagesRepository: StudyPagesRepository,
    private readonly studyModulesRepository: StudyModulesRepository,
  ) {}

  async execute({
    userId,
    moduleId,
    title,
    content,
  }: CreateStudyPageInput): Promise<CreateStudyPageOutput> {
    const module = await this.studyModulesRepository.findById(moduleId, userId)
    if (!module) throw new ResourceNotFoundError()

    const count = await this.studyPagesRepository.countByModuleId(
      moduleId,
      userId,
    )
    if (count >= STUDY_PAGE_LIMIT) {
      throw new Error('Limite de páginas atingido (200)')
    }

    const pages = await this.studyPagesRepository.findManyByUserId(userId, {
      moduleId,
    })
    const maxPosition = pages.reduce((max, p) => {
      const n = Number(p.position)
      return Number.isFinite(n) && n > max ? n : max
    }, 0)
    const nextPosition = (maxPosition + POSITION_STEP).toFixed(10)

    const page = await this.studyPagesRepository.create({
      id: randomUUID(),
      moduleId,
      userId,
      title,
      content: content ?? '',
      position: nextPosition,
    })
    return { page }
  }
}
