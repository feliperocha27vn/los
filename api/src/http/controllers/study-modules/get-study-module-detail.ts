import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetStudyModuleDetailUseCase } from '@use-cases/study-modules/get-study-module-detail'
import { moduleResponseSchema, toResponse } from './module-response'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function getStudyModuleDetailRoute(
  studyModulesRepository: StudyModulesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
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
  }
}
