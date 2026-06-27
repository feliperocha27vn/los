import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchStudyPagesUseCase } from '@use-cases/study-pages/fetch-study-pages'
import { pageResponseSchema, toResponse } from './page-response'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function getStudyPagesRoute(
  studyPagesRepository: StudyPagesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/pages', {
      schema: {
        tags: ['StudyPages'],
        summary: 'List study pages',
        querystring: z.object({ moduleId: z.string().optional() }),
        response: { 200: z.object({ pages: pageResponseSchema.array() }) },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { moduleId } = request.query
      const useCase = new FetchStudyPagesUseCase(studyPagesRepository)
      const { pages } = await useCase.execute({ userId, moduleId })
      return reply.status(200).send({ pages: pages.map(toResponse) })
    })
  }
}
