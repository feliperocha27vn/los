import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateStudyPageUseCase } from '@use-cases/study-pages/update-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function putStudyPageRoute(
  studyPagesRepository: StudyPagesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.put('/pages/:id', {
      schema: {
        tags: ['StudyPages'],
        summary: 'Update study page',
        params: z.object({ id: z.string() }),
        body: z.object({
          title: z.string().min(1).max(200).optional(),
          content: z.string().optional(),
        }),
        response: {
          200: z.object({
            page: z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
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
        const { title, content } = request.body
        const useCase = new UpdateStudyPageUseCase(studyPagesRepository)
        const { page } = await useCase.execute({ pageId: id, userId, title, content })
        return reply.status(200).send({
          page: { id: page.id, title: page.title, content: page.content, updatedAt: page.updatedAt.toISOString() },
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
