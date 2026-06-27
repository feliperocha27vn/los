import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateStudyCourseUseCase } from '@use-cases/study-courses/create-study-course'
import { courseResponseSchema, toResponse } from './course-response'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

export function postStudyCourseRoute(
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/courses', {
      schema: {
        tags: ['StudyCourses'],
        summary: 'Create study course',
        body: z.object({ name: z.string().min(1).max(100) }),
        response: {
          201: z.object({ course: courseResponseSchema }),
          400: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { name } = request.body
      const useCase = new CreateStudyCourseUseCase(studyCoursesRepository)
      try {
        const { course } = await useCase.execute({ userId, name })
        return reply.status(201).send({ course: toResponse(course) })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro'
        return reply.status(400).send({ message })
      }
    })
  }
}
