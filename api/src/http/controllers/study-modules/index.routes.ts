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
  app
    .register(getStudyModulesRoute(studyModulesRepository))
    .register(postStudyModuleRoute(studyModulesRepository, studyCoursesRepository))
    .register(getStudyModuleDetailRoute(studyModulesRepository))
    .register(putStudyModuleRoute(studyModulesRepository))
    .register(patchStudyModuleReorderRoute(studyModulesRepository))
    .register(deleteStudyModuleRoute(studyModulesRepository))
}
