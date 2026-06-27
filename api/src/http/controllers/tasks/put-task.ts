import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UpdateTaskUseCase } from '@use-cases/update-task'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TasksRepository } from '@repositories/tasks-repository'

export function putTaskRoute(
  tasksRepository: TasksRepository
): FastifyPluginAsyncZod {
  return async (app) => {
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
  }
}
