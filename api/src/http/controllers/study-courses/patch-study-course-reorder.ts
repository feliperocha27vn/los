import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ReorderStudyCourseUseCase } from '@use-cases/study-courses/reorder-study-course'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

export function patchStudyCourseReorderRoute(
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch('/courses/:id/reorder', {
      schema: {
        tags: ['StudyCourses'],
        summary: 'Reorder study course',
        params: z.object({ id: z.string() }),
        body: z.object({ position: z.number().positive() }),
        response: {
          200: z.object({
            course: z.object({
              id: z.string(),
              position: z.number(),
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
        const { position } = request.body
        const useCase = new ReorderStudyCourseUseCase(studyCoursesRepository)
        const { course } = await useCase.execute({ courseId: id, userId, position })
        return reply.status(200).send({
          course: { id: course.id, position: Number(course.position), updatedAt: course.updatedAt.toISOString() },
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
