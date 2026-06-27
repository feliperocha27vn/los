import type { FastifyInstance } from 'fastify'
import { getStudyModulesRoute } from './get-study-modules'
import { postStudyModuleRoute } from './post-study-module'
import { getStudyModuleDetailRoute } from './get-study-module-detail'
import { putStudyModuleRoute } from './put-study-module'
import { patchStudyModuleReorderRoute } from './patch-study-module-reorder'
import { deleteStudyModuleRoute } from './delete-study-module'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function registerStudyModulesRoutes(
  app: FastifyInstance,
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
): void {
  void app.register(getStudyModulesRoute(studyModulesRepository))
  void app.register(
    postStudyModuleRoute(studyModulesRepository, studyCoursesRepository)
  )
  void app.register(getStudyModuleDetailRoute(studyModulesRepository))
  void app.register(putStudyModuleRoute(studyModulesRepository))
  void app.register(patchStudyModuleReorderRoute(studyModulesRepository))
  void app.register(deleteStudyModuleRoute(studyModulesRepository))
}
