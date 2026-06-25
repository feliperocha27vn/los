import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { FetchTasksUseCase } from '@use-cases/fetch-tasks'
import { GetTaskDetailUseCase } from '@use-cases/get-task-detail'
import { CreateTaskUseCase } from '@use-cases/create-task'
import { UpdateTaskUseCase } from '@use-cases/update-task'
import { MoveTaskUseCase } from '@use-cases/move-task'
import { DeleteTaskUseCase } from '@use-cases/delete-task'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { TaskLimitExceededError } from '@errors/task-limit-exceeded-error'
import { PositionConflictError } from '@errors/position-conflict-error'
import type { TasksRepository } from '@repositories/tasks-repository'

const taskColumnSchema = z.enum(['todo', 'in_progress', 'done'])

const taskResponseSchema = z.object({
  id: z.string(),
  column: taskColumnSchema,
  title: z.string(),
  description: z.string().nullable(),
  position: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function toResponse(record: {
  id: string
  column: 'todo' | 'in_progress' | 'done'
  title: string
  description: string | null
  position: string
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    column: record.column,
    title: record.title,
    description: record.description,
    position: Number(record.position),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function makeTasksController(
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
        response: {
          200: z.object({
            tasks: taskResponseSchema.array(),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { column, search } = request.query

      const useCase = new FetchTasksUseCase(tasksRepository)
      const { tasks } = await useCase.execute({ userId, column, search })

      return reply.status(200).send({ tasks: tasks.map(toResponse) })
    })

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

    app.post('/tasks', {
      schema: {
        tags: ['Tasks'],
        summary: 'Create task',
        body: z.object({
          title: z.string().min(1).max(200),
          description: z.string().max(2000).nullable().optional(),
          column: taskColumnSchema.optional(),
        }),
        response: {
          201: z.object({ task: taskResponseSchema }),
          400: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { title, description, column } = request.body

        const useCase = new CreateTaskUseCase(tasksRepository)
        const { task } = await useCase.execute({
          userId,
          title,
          description,
          column,
        })

        return reply.status(201).send({ task: toResponse(task) })
      } catch (error) {
        if (error instanceof TaskLimitExceededError) {
          return reply.status(400).send({ message: error.message })
        }
        throw error
      }
    })

    app.put('/tasks/:id', {
      schema: {
        tags: ['Tasks'],
        summary: 'Update task',
        params: z.object({ id: z.string() }),
        body: z.object({
          title: z.string().min(1).max(200).optional(),
          description: z.string().max(2000).nullable().optional(),
        }),
        response: {
          200: z.object({
            task: z.object({
              id: z.string(),
              title: z.string(),
              description: z.string().nullable(),
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
        const { title, description } = request.body

        const useCase = new UpdateTaskUseCase(tasksRepository)
        const { task } = await useCase.execute({
          taskId: id,
          userId,
          title,
          description,
        })

        return reply.status(200).send({
          task: {
            id: task.id,
            title: task.title,
            description: task.description,
            updatedAt: task.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.patch('/tasks/:id/move', {
      schema: {
        tags: ['Tasks'],
        summary: 'Move task to a column with explicit position',
        params: z.object({ id: z.string() }),
        body: z.object({
          column: taskColumnSchema,
          position: z.number().positive(),
        }),
        response: {
          200: z.object({
            task: z.object({
              id: z.string(),
              column: taskColumnSchema,
              position: z.number(),
              updatedAt: z.string(),
            }),
          }),
          404: z.object({ message: z.string() }),
          409: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { column, position } = request.body

        const useCase = new MoveTaskUseCase(tasksRepository)
        const { task } = await useCase.execute({
          taskId: id,
          userId,
          column,
          position,
        })

        return reply.status(200).send({
          task: {
            id: task.id,
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
    })

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
