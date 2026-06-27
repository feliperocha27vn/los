import type { FastifyInstance } from 'fastify'
import { getStudyCoursesRoute } from './get-study-courses'
import { postStudyCourseRoute } from './post-study-course'
import { getStudyCourseDetailRoute } from './get-study-course-detail'
import { putStudyCourseRoute } from './put-study-course'
import { patchStudyCourseReorderRoute } from './patch-study-course-reorder'
import { deleteStudyCourseRoute } from './delete-study-course'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

export function registerStudyCoursesRoutes(
  app: FastifyInstance,
  studyCoursesRepository: StudyCoursesRepository
): void {
  app
    .register(getStudyCoursesRoute(studyCoursesRepository))
    .register(postStudyCourseRoute(studyCoursesRepository))
    .register(getStudyCourseDetailRoute(studyCoursesRepository))
    .register(putStudyCourseRoute(studyCoursesRepository))
    .register(patchStudyCourseReorderRoute(studyCoursesRepository))
    .register(deleteStudyCourseRoute(studyCoursesRepository))
}
