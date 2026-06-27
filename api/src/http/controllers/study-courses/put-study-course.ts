import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateStudyCourseUseCase } from '@use-cases/study-courses/update-study-course'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

export function putStudyCourseRoute(
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/courses/:id', {
      schema: {
        tags: ['StudyCourses'],
        summary: 'Update study course',
        params: z.object({ id: z.string() }),
        body: z.object({ name: z.string().min(1).max(100) }),
        response: {
          200: z.object({
            course: z.object({
              id: z.string(),
              name: z.string(),
              updatedAt: z.string(),
            }),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { name } = request.body
        const useCase = new UpdateStudyCourseUseCase(studyCoursesRepository)
        const { course } = await useCase.execute({ courseId: id, userId, name })
        return reply.status(200).send({
          course: { id: course.id, name: course.name, updatedAt: course.updatedAt.toISOString() },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
