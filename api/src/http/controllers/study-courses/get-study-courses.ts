import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchStudyCoursesUseCase } from '@use-cases/study-courses/fetch-study-courses'
import { courseResponseSchema, toResponse } from './course-response'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

export function getStudyCoursesRoute(
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/courses', {
      schema: {
        tags: ['StudyCourses'],
        summary: 'List study courses',
        response: { 200: z.object({ courses: courseResponseSchema.array() }) },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const useCase = new FetchStudyCoursesUseCase(studyCoursesRepository)
      const { courses } = await useCase.execute({ userId })
      return reply.status(200).send({ courses: courses.map(toResponse) })
    })
  }
}
