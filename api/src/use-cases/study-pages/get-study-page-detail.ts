import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type {
  StudyPageRecord,
  StudyPagesRepository,
} from '@repositories/study-pages-repository'

interface BreadcrumbItem {
  id: string
  name: string
}

interface GetStudyPageDetailOutput {
  page: StudyPageRecord
  breadcrumbs: {
    course?: BreadcrumbItem
    module?: BreadcrumbItem
    page: BreadcrumbItem
  }
}

export class GetStudyPageDetailUseCase {
  constructor(
    private readonly studyPagesRepository: StudyPagesRepository,
    private readonly studyModulesRepository: StudyModulesRepository,
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    pageId,
    userId,
  }: {
    pageId: string
    userId: string
  }): Promise<GetStudyPageDetailOutput> {
    const page = await this.studyPagesRepository.findById(pageId, userId)
    if (!page) throw new ResourceNotFoundError()

    const module = await this.studyModulesRepository.findById(
      page.moduleId,
      userId,
    )
    const course = module
      ? await this.studyCoursesRepository.findById(module.courseId, userId)
      : null

    return {
      page,
      breadcrumbs: {
        course: course ? { id: course.id, name: course.name } : undefined,
        module: module ? { id: module.id, name: module.name } : undefined,
        page: { id: page.id, name: page.title },
      },
    }
  }
}
