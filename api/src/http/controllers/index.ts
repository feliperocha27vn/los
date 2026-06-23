import type { FastifyPluginAsync } from 'fastify'
import type { UsersRepository } from '@repositories/users-repository'
import { makeAuthController } from './auth/auth-controller'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { makeCofreController } from './cofre/cofre-controller'
import { makeNotesController } from './notes/notes-controller'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'
import type { NotesRepository } from '@repositories/notes-repository'

interface ControllersDeps {
  usersRepository: UsersRepository
  cofreEntriesRepository?: CofreEntriesRepository
  notesRepository?: NotesRepository
}

export function controllers(deps: ControllersDeps): FastifyPluginAsync {
  const cofreEntriesRepo = deps.cofreEntriesRepository ?? new InMemoryCofreEntriesRepository()
  const notesRepo = deps.notesRepository ?? new InMemoryNotesRepository()

  return async (app) => {
    await app.register(makeAuthController(deps.usersRepository))
    await app.register(makeCofreController(deps.usersRepository, cofreEntriesRepo))
    await app.register(makeNotesController(notesRepo))
  }
}
