import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateStudyPageUseCase } from '@use-cases/study-pages/create-study-page'
import { FetchStudyPagesUseCase } from '@use-cases/study-pages/fetch-study-pages'
import { GetStudyPageDetailUseCase } from '@use-cases/study-pages/get-study-page-detail'
import { UpdateStudyPageUseCase } from '@use-cases/study-pages/update-study-page'
import { DeleteStudyPageUseCase } from '@use-cases/study-pages/delete-study-page'
import { ReorderStudyPageUseCase } from '@use-cases/study-pages/reorder-study-page'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'

const pageResponseSchema = z.object({
  id: z.string(),
  moduleId: z.string(),
  title: z.string(),
  content: z.string(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const breadcrumbSchema = z.object({
  course: z.object({ id: z.string(), name: z.string() }).optional(),
  module: z.object({ id: z.string(), name: z.string() }).optional(),
  page: z.object({ id: z.string(), name: z.string() }),
})

function toResponse(record: {
  id: string
  moduleId: string
  title: string
  content: string
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    moduleId: record.moduleId,
    title: record.title,
    content: record.content,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function makeStudyPagesController(
  studyPagesRepository: StudyPagesRepository,
  studyModulesRepository: StudyModulesRepository,
  studyCoursesRepository: StudyCoursesRepository
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
