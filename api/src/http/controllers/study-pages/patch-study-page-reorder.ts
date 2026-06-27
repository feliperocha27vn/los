import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { ReorderStudyPageUseCase } from '@use-cases/study-pages/reorder-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function patchStudyPageReorderRoute(
  studyPagesRepository: StudyPagesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch('/pages/:id/reorder', {
      schema: {
        tags: ['StudyPages'],
        summary: 'Reorder study page',
        params: z.object({ id: z.string() }),
        body: z.object({ position: z.number().positive() }),
        response: {
          200: z.object({
            page: z.object({
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
        const useCase = new ReorderStudyPageUseCase(studyPagesRepository)
        const { page } = await useCase.execute({ pageId: id, userId, position })
        return reply.status(200).send({
          page: { id: page.id, position: Number(page.position), updatedAt: page.updatedAt.toISOString() },
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
