import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { DeleteTaskUseCase } from '@use-cases/delete-task'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TasksRepository } from '@repositories/tasks-repository'

export function deleteTaskRoute(
  tasksRepository: TasksRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.delete('/tasks/:id', {
      schema: {
        tags: ['Tasks'],
        summary: 'Delete task',
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

        const useCase = new DeleteTaskUseCase(tasksRepository)
        await useCase.execute({ taskId: id, userId })

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
