import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteStudyModuleUseCase } from '@use-cases/study-modules/delete-study-module'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function deleteStudyModuleRoute(
  studyModulesRepository: StudyModulesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
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
