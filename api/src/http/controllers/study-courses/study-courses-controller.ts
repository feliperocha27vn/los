import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateStudyCourseUseCase } from '@use-cases/study-courses/create-study-course'
import { FetchStudyCoursesUseCase } from '@use-cases/study-courses/fetch-study-courses'
import { GetStudyCourseDetailUseCase } from '@use-cases/study-courses/get-study-course-detail'
import { UpdateStudyCourseUseCase } from '@use-cases/study-courses/update-study-course'
import { DeleteStudyCourseUseCase } from '@use-cases/study-courses/delete-study-course'
import { ReorderStudyCourseUseCase } from '@use-cases/study-courses/reorder-study-course'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'

const courseResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function toResponse(record: {
  id: string
  name: string
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    name: record.name,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function makeStudyCoursesController(
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

    app.delete('/courses/:id', {
      schema: {
        tags: ['StudyCourses'],
        summary: 'Delete study course (cascade)',
        params: z.object({ id: z.string() }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new DeleteStudyCourseUseCase(studyCoursesRepository)
        await useCase.execute({ courseId: id, userId })
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
