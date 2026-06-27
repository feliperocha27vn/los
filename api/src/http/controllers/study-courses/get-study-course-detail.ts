import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetStudyCourseDetailUseCase } from '@use-cases/study-courses/get-study-course-detail'
import { courseResponseSchema, toResponse } from './course-response'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

export function getStudyCourseDetailRoute(
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/courses/:id', {
      schema: {
        tags: ['StudyCourses'],
        summary: 'Get study course detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ course: courseResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new GetStudyCourseDetailUseCase(studyCoursesRepository)
        const { course } = await useCase.execute({ courseId: id, userId })
        return reply.status(200).send({ course: toResponse(course) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
