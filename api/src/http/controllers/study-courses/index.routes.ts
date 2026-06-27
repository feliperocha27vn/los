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
  void app.register(getStudyCoursesRoute(studyCoursesRepository))
  void app.register(postStudyCourseRoute(studyCoursesRepository))
  void app.register(getStudyCourseDetailRoute(studyCoursesRepository))
  void app.register(putStudyCourseRoute(studyCoursesRepository))
  void app.register(patchStudyCourseReorderRoute(studyCoursesRepository))
  void app.register(deleteStudyCourseRoute(studyCoursesRepository))
}
