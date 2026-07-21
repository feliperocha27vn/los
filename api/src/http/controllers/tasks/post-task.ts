import { TaskLimitExceededError } from '@errors/task-limit-exceeded-error'
import type { TasksRepository } from '@repositories/tasks-repository'
import { CreateTaskUseCase } from '@use-cases/create-task'
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import {
  taskCategorySchema,
  taskColumnSchema,
  taskResponseSchema,
  toResponse,
} from './task-response'

export function postTaskRoute(tasksRepository: TasksRepository): FastifyPluginAsyncZod {
  return async (app) => {
    app.post(
      '/tasks',
      {
        schema: {
          tags: ['Tasks'],
          summary: 'Create task',
          body: z.object({
            title: z.string().min(1).max(200),
            description: z.string().max(2000).nullable().optional(),
            column: taskColumnSchema.optional(),
            category: taskCategorySchema.optional(),
          }),
          response: {
            201: z.object({ task: taskResponseSchema }),
            400: z.object({ message: z.string() }),
          },
        },
      },
      async (request, reply) => {
        try {
          const { sub: userId } = request.user as { sub: string }
          const { title, description, column, category } = request.body

          const useCase = new CreateTaskUseCase(tasksRepository)
          const { task } = await useCase.execute({
            userId,
            title,
            description,
            column,
            category,
          })

          return reply.status(201).send({ task: toResponse(task) })
        } catch (error) {
          if (error instanceof TaskLimitExceededError) {
            return reply.status(400).send({ message: error.message })
          }
          throw error
        }
      },
    )
  }
}
