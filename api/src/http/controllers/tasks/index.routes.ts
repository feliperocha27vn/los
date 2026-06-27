import type { FastifyInstance } from 'fastify'
import { getTasksRoute } from './get-tasks'
import { getTaskDetailRoute } from './get-task-detail'
import { postTaskRoute } from './post-task'
import { putTaskRoute } from './put-task'
import { patchTaskMoveRoute } from './patch-task-move'
import { deleteTaskRoute } from './delete-task'
import type { TasksRepository } from '@repositories/tasks-repository'

export function registerTasksRoutes(
  app: FastifyInstance,
  tasksRepository: TasksRepository
): void {
  app
    .register(getTasksRoute(tasksRepository))
    .register(getTaskDetailRoute(tasksRepository))
    .register(postTaskRoute(tasksRepository))
    .register(putTaskRoute(tasksRepository))
    .register(patchTaskMoveRoute(tasksRepository))
    .register(deleteTaskRoute(tasksRepository))
}
