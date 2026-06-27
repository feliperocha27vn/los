import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateStudyModuleUseCase } from '@use-cases/study-modules/create-study-module'
import { moduleResponseSchema, toResponse } from './module-response'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function postStudyModuleRoute(
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
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
      const useCase = new CreateStudyModuleUseCase(
        studyModulesRepository,
        studyCoursesRepository
      )
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
  }
}
