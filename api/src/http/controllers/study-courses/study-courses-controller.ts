import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { getStudyCoursesRoute } from './get-study-courses'
import { postStudyCourseRoute } from './post-study-course'
import { getStudyCourseDetailRoute } from './get-study-course-detail'
import { putStudyCourseRoute } from './put-study-course'
import { patchStudyCourseReorderRoute } from './patch-study-course-reorder'
import { deleteStudyCourseRoute } from './delete-study-course'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

export function makeStudyCoursesController(
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    await app.register(getStudyCoursesRoute(studyCoursesRepository))
    await app.register(postStudyCourseRoute(studyCoursesRepository))
    await app.register(getStudyCourseDetailRoute(studyCoursesRepository))
    await app.register(putStudyCourseRoute(studyCoursesRepository))
    await app.register(patchStudyCourseReorderRoute(studyCoursesRepository))
    await app.register(deleteStudyCourseRoute(studyCoursesRepository))
  }
}
