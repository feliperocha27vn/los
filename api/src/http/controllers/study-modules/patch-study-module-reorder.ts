import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ReorderStudyModuleUseCase } from '@use-cases/study-modules/reorder-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function patchStudyModuleReorderRoute(
  studyModulesRepository: StudyModulesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
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
  }
}
