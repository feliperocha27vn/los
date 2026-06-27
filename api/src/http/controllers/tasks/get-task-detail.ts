import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetTaskDetailUseCase } from '@use-cases/get-task-detail'
import { taskResponseSchema, toResponse } from './task-response'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TasksRepository } from '@repositories/tasks-repository'

export function getTaskDetailRoute(
  tasksRepository: TasksRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/tasks/:id', {
      schema: {
        tags: ['Tasks'],
        summary: 'Get task detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ task: taskResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params

        const useCase = new GetTaskDetailUseCase(tasksRepository)
        const { task } = await useCase.execute({ taskId: id, userId })

        return reply.status(200).send({ task: toResponse(task) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
