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
  void app.register(getTasksRoute(tasksRepository))
  void app.register(getTaskDetailRoute(tasksRepository))
  void app.register(postTaskRoute(tasksRepository))
  void app.register(putTaskRoute(tasksRepository))
  void app.register(patchTaskMoveRoute(tasksRepository))
  void app.register(deleteTaskRoute(tasksRepository))
}
