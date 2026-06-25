import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateStudyModuleUseCase } from '@use-cases/study-modules/create-study-module'
import { FetchStudyModulesUseCase } from '@use-cases/study-modules/fetch-study-modules'
import { GetStudyModuleDetailUseCase } from '@use-cases/study-modules/get-study-module-detail'
import { UpdateStudyModuleUseCase } from '@use-cases/study-modules/update-study-module'
import { DeleteStudyModuleUseCase } from '@use-cases/study-modules/delete-study-module'
import { ReorderStudyModuleUseCase } from '@use-cases/study-modules/reorder-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

const moduleResponseSchema = z.object({
  id: z.string(),
  courseId: z.string(),
  name: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function toResponse(record: {
  id: string
  courseId: string
  name: string
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    courseId: record.courseId,
    name: record.name,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function makeStudyModulesController(
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/modules', {
      schema: {
        tags: ['StudyModules'],
        summary: 'List study modules',
        querystring: z.object({ courseId: z.string().optional() }),
        response: { 200: z.object({ modules: moduleResponseSchema.array() }) },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { courseId } = request.query
      const useCase = new FetchStudyModulesUseCase(studyModulesRepository)
      const { modules } = await useCase.execute({ userId, courseId })
      return reply.status(200).send({ modules: modules.map(toResponse) })
    })

    app.post('/modules', {
      schema: {
        tags: ['StudyModules'],
        summary: 'Create study module',
        body: z.object({
          courseId: z.string(),
          name: z.string().min(1).max(100),
        }),
        response: {
          201: z.object({ module: moduleResponseSchema }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { courseId, name } = request.body
      const useCase = new CreateStudyModuleUseCase(studyModulesRepository, studyCoursesRepository)
      try {
        const { module } = await useCase.execute({ userId, courseId, name })
        return reply.status(201).send({ module: toResponse(module) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        const message = error instanceof Error ? error.message : 'Erro'
        return reply.status(400).send({ message })
      }
    })

    app.get('/modules/:id', {
      schema: {
        tags: ['StudyModules'],
        summary: 'Get study module detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ module: moduleResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new GetStudyModuleDetailUseCase(studyModulesRepository)
        const { module } = await useCase.execute({ moduleId: id, userId })
        return reply.status(200).send({ module: toResponse(module) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.put('/modules/:id', {
      schema: {
        tags: ['StudyModules'],
        summary: 'Update study module',
        params: z.object({ id: z.string() }),
        body: z.object({ name: z.string().min(1).max(100) }),
        response: {
          200: z.object({
            module: z.object({
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
        const useCase = new UpdateStudyModuleUseCase(studyModulesRepository)
        const { module } = await useCase.execute({ moduleId: id, userId, name })
        return reply.status(200).send({
          module: { id: module.id, name: module.name, updatedAt: module.updatedAt.toISOString() },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.patch('/modules/:id/reorder', {
      schema: {
        tags: ['StudyModules'],
        summary: 'Reorder study module',
        params: z.object({ id: z.string() }),
        body: z.object({ position: z.number().positive() }),
        response: {
          200: z.object({
            module: z.object({
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
        const useCase = new ReorderStudyModuleUseCase(studyModulesRepository)
        const { module } = await useCase.execute({ moduleId: id, userId, position })
        return reply.status(200).send({
          module: { id: module.id, position: Number(module.position), updatedAt: module.updatedAt.toISOString() },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.delete('/modules/:id', {
      schema: {
        tags: ['StudyModules'],
        summary: 'Delete study module (cascade)',
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
        const useCase = new DeleteStudyModuleUseCase(studyModulesRepository)
        await useCase.execute({ moduleId: id, userId })
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
