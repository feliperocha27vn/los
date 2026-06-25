import type { FastifyPluginAsync } from 'fastify'
import type { UsersRepository } from '@repositories/users-repository'
import { makeAuthController } from './auth/auth-controller'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { makeCofreController } from './cofre/cofre-controller'
import { makeNotesController } from './notes/notes-controller'
import { makeTasksController } from './tasks/tasks-controller'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'
import type { NotesRepository } from '@repositories/notes-repository'
import type { TasksRepository } from '@repositories/tasks-repository'

interface ControllersDeps {
  usersRepository: UsersRepository
  cofreEntriesRepository?: CofreEntriesRepository
  notesRepository?: NotesRepository
  tasksRepository?: TasksRepository
}

export function controllers(deps: ControllersDeps): FastifyPluginAsync {
  const cofreEntriesRepo = deps.cofreEntriesRepository ?? new InMemoryCofreEntriesRepository()
  const notesRepo = deps.notesRepository ?? new InMemoryNotesRepository()
  const tasksRepo = deps.tasksRepository ?? new InMemoryTasksRepository()

  return async (app) => {
    await app.register(makeAuthController(deps.usersRepository))
    await app.register(makeCofreController(deps.usersRepository, cofreEntriesRepo))
    await app.register(makeNotesController(notesRepo))
    await app.register(makeTasksController(tasksRepo))
  }
}
