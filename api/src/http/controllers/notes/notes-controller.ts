import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchNotesUseCase } from '@use-cases/fetch-notes'
import { GetNoteDetailUseCase } from '@use-cases/get-note-detail'
import { CreateNoteUseCase } from '@use-cases/create-note'
import { UpdateNoteUseCase } from '@use-cases/update-note'
import { DeleteNoteUseCase } from '@use-cases/delete-note'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { NotesRepository } from '@repositories/notes-repository'

export function makeNotesController(
  notesRepository: NotesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/notes', {
      schema: {
        tags: ['Notes'],
        summary: 'List notes',
        querystring: z.object({
          search: z.string().optional(),
        }),
        response: {
          200: z.object({
            notes: z
              .object({
                id: z.string(),
                title: z.string(),
                snippet: z.string(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
              .array(),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { search } = request.query

      const useCase = new FetchNotesUseCase(notesRepository)
      const { notes } = await useCase.execute({ userId, search })

      return reply.status(200).send({
        notes: notes.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
        })),
      })
    })

    app.get('/notes/:id', {
      schema: {
        tags: ['Notes'],
        summary: 'Get note detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            note: z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              createdAt: z.string(),
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

        const useCase = new GetNoteDetailUseCase(notesRepository)
        const { note } = await useCase.execute({ noteId: id, userId })

        return reply.status(200).send({
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt.toISOString(),
            updatedAt: note.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.post('/notes', {
      schema: {
        tags: ['Notes'],
        summary: 'Create note',
        body: z.object({
          title: z.string().min(1),
        }),
        response: {
          201: z.object({
            note: z.object({
              id: z.string(),
              title: z.string(),
              content: z.string(),
              createdAt: z.string(),
              updatedAt: z.string(),
            }),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { title } = request.body

      const useCase = new CreateNoteUseCase(notesRepository)
      const { note } = await useCase.execute({ userId, title })

      return reply.status(201).send({
        note: {
          id: note.id,
          title: note.title,
          content: note.content,
          createdAt: note.createdAt.toISOString(),
          updatedAt: note.updatedAt.toISOString(),
        },
      })
    })

    app.put('/notes/:id', {
      schema: {
        tags: ['Notes'],
        summary: 'Update note',
        params: z.object({ id: z.string() }),
        body: z.object({
          title: z.string().min(1).optional(),
          content: z.string().optional(),
        }),
        response: {
          200: z.object({
            note: z.object({
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

        const useCase = new UpdateNoteUseCase(notesRepository)
        const { note } = await useCase.execute({ noteId: id, userId, title, content })

        return reply.status(200).send({
          note: {
            id: note.id,
            title: note.title,
            content: note.content,
            updatedAt: note.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.delete('/notes/:id', {
      schema: {
        tags: ['Notes'],
        summary: 'Delete note',
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

        const useCase = new DeleteNoteUseCase(notesRepository)
        await useCase.execute({ noteId: id, userId })

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
