import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getStudyModulesRoute } from './get-study-modules'
import { postStudyModuleRoute } from './post-study-module'
import { getStudyModuleDetailRoute } from './get-study-module-detail'
import { putStudyModuleRoute } from './put-study-module'
import { patchStudyModuleReorderRoute } from './patch-study-module-reorder'
import { deleteStudyModuleRoute } from './delete-study-module'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function makeStudyModulesController(
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(getStudyModulesRoute(studyModulesRepository))
    await app.register(postStudyModuleRoute(studyModulesRepository, studyCoursesRepository))
    await app.register(getStudyModuleDetailRoute(studyModulesRepository))
    await app.register(putStudyModuleRoute(studyModulesRepository))
    await app.register(patchStudyModuleReorderRoute(studyModulesRepository))
    await app.register(deleteStudyModuleRoute(studyModulesRepository))
  }
}
