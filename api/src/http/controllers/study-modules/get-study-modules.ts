import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchStudyModulesUseCase } from '@use-cases/study-modules/fetch-study-modules'
import { moduleResponseSchema, toResponse } from './module-response'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'

export function getStudyModulesRoute(
  studyModulesRepository: StudyModulesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/modules', {
      schema: {
        tags: ['StudyModules'],
        summary: 'List study modules',
        querystring: z.object({ courseId: z.string().optional() }),
        response: { 200: z.object({ modules: moduleResponseSchema.array() }) },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { courseId } = request.query
      const useCase = new FetchStudyModulesUseCase(studyModulesRepository)
      const { modules } = await useCase.execute({ userId, courseId })
      return reply.status(200).send({ modules: modules.map(toResponse) })
    })
  }
}
