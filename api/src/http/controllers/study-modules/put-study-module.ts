import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateStudyModuleUseCase } from '@use-cases/study-modules/update-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function putStudyModuleRoute(
  studyModulesRepository: StudyModulesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
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
  }
}
