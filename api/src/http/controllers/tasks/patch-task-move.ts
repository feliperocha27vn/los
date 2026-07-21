import { PositionConflictError } from '@errors/position-conflict-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TasksRepository } from '@repositories/tasks-repository'
import { MoveTaskUseCase } from '@use-cases/move-task'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { taskCategorySchema, taskColumnSchema } from './task-response'

export function patchTaskMoveRoute(tasksRepository: TasksRepository): FastifyPluginAsyncZod {
  return async (app) => {
    app.patch(
      '/tasks/:id/move',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Move task to a column with explicit position',
          params: z.object({ id: z.string() }),
          body: z.object({
            category: taskCategorySchema,
            column: taskColumnSchema,
            position: z.number().positive(),
          }),
          response: {
            200: z.object({
              task: z.object({
                id: z.string(),
                category: taskCategorySchema,
                column: taskColumnSchema,
                position: z.number(),
                updatedAt: z.string(),
              }),
            }),
            404: z.object({ message: z.string() }),
            409: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { id } = request.params
          const { category, column, position } = request.body

          const useCase = new MoveTaskUseCase(tasksRepository)
          const { task } = await useCase.execute({
            taskId: id,
            userId,
            category,
            column,
            position,
          })

          return reply.status(200).send({
            task: {
              id: task.id,
              category: task.category,
              column: task.column,
              position: Number(task.position),
              updatedAt: task.updatedAt.toISOString(),
            },
          })
        } catch (error) {
          if (error instanceof ResourceNotFoundError) {
            return reply.status(404).send({ message: error.message })
          }
          if (error instanceof PositionConflictError) {
            return reply.status(409).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
