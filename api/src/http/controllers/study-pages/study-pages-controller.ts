import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getStudyPagesRoute } from './get-study-pages'
import { postStudyPageRoute } from './post-study-page'
import { getStudyPageDetailRoute } from './get-study-page-detail'
import { putStudyPageRoute } from './put-study-page'
import { patchStudyPageReorderRoute } from './patch-study-page-reorder'
import { deleteStudyPageRoute } from './delete-study-page'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function makeStudyPagesController(
  studyPagesRepository: StudyPagesRepository,
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(getStudyPagesRoute(studyPagesRepository))
    await app.register(
      postStudyPageRoute(studyPagesRepository, studyModulesRepository)
    )
    await app.register(
      getStudyPageDetailRoute(
        studyPagesRepository,
        studyModulesRepository,
        studyCoursesRepository
      )
    )
    await app.register(putStudyPageRoute(studyPagesRepository))
    await app.register(patchStudyPageReorderRoute(studyPagesRepository))
    await app.register(deleteStudyPageRoute(studyPagesRepository))
  }
}
