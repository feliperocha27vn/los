import type { FastifyInstance } from 'fastify'
import { getStudyPagesRoute } from './get-study-pages'
import { postStudyPageRoute } from './post-study-page'
import { getStudyPageDetailRoute } from './get-study-page-detail'
import { putStudyPageRoute } from './put-study-page'
import { patchStudyPageReorderRoute } from './patch-study-page-reorder'
import { deleteStudyPageRoute } from './delete-study-page'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function registerStudyPagesRoutes(
  app: FastifyInstance,
  studyPagesRepository: StudyPagesRepository,
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
): void {
  void app.register(getStudyPagesRoute(studyPagesRepository))
  void app.register(
    postStudyPageRoute(studyPagesRepository, studyModulesRepository)
  )
  void app.register(
    getStudyPageDetailRoute(
      studyPagesRepository,
      studyModulesRepository,
      studyCoursesRepository
    )
  )
  void app.register(putStudyPageRoute(studyPagesRepository))
  void app.register(patchStudyPageReorderRoute(studyPagesRepository))
  void app.register(deleteStudyPageRoute(studyPagesRepository))
}
