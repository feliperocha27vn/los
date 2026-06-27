import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchTasksUseCase } from '@use-cases/fetch-tasks'
import { taskResponseSchema, taskColumnSchema, toResponse } from './task-response'
import type { TasksRepository } from '@repositories/tasks-repository'

export function getTasksRoute(
  tasksRepository: TasksRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/tasks', {
      schema: {
        tags: ['Tasks'],
        summary: 'List tasks',
        querystring: z.object({
          column: taskColumnSchema.optional(),
          search: z.string().min(1).optional(),
        }),
        response: { 200: z.object({ tasks: taskResponseSchema.array() }) },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { column, search } = request.query

      const useCase = new FetchTasksUseCase(tasksRepository)
      const { tasks } = await useCase.execute({ userId, column, search })

      return reply.status(200).send({ tasks: tasks.map(toResponse) })
    })
  }
}
