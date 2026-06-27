import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateStudyPageUseCase } from '@use-cases/study-pages/create-study-page'
import { pageResponseSchema, toResponse } from './page-response'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function postStudyPageRoute(
  studyPagesRepository: StudyPagesRepository,
  studyModulesRepository: StudyModulesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/pages', {
      schema: {
        tags: ['StudyPages'],
        summary: 'Create study page',
        body: z.object({
          moduleId: z.string(),
          title: z.string().min(1).max(200),
          content: z.string().optional(),
        }),
        response: {
          201: z.object({ page: pageResponseSchema }),
          400: z.object({ message: z.string() }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { moduleId, title, content } = request.body
      const useCase = new CreateStudyPageUseCase(studyPagesRepository, studyModulesRepository)
      try {
        const { page } = await useCase.execute({ userId, moduleId, title, content })
        return reply.status(201).send({ page: toResponse(page) })
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
