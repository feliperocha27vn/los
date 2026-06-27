import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteStudyPageUseCase } from '@use-cases/study-pages/delete-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function deleteStudyPageRoute(
  studyPagesRepository: StudyPagesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete('/pages/:id', {
      schema: {
        tags: ['StudyPages'],
        summary: 'Delete study page',
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
        const useCase = new DeleteStudyPageUseCase(studyPagesRepository)
        await useCase.execute({ pageId: id, userId })
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
