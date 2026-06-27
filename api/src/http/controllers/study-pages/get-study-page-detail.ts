import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetStudyPageDetailUseCase } from '@use-cases/study-pages/get-study-page-detail'
import { pageResponseSchema, breadcrumbSchema, toResponse } from './page-response'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

export function getStudyPageDetailRoute(
  studyPagesRepository: StudyPagesRepository,
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/pages/:id', {
      schema: {
        tags: ['StudyPages'],
        summary: 'Get study page detail (with breadcrumb)',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ page: pageResponseSchema, breadcrumbs: breadcrumbSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new GetStudyPageDetailUseCase(
          studyPagesRepository,
          studyModulesRepository,
          studyCoursesRepository
        )
        const { page, breadcrumbs } = await useCase.execute({ pageId: id, userId })
        return reply.status(200).send({ page: toResponse(page), breadcrumbs })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
