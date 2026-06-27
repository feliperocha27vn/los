import type { FastifyInstance } from 'fastify'
import { cofreRoutes } from './cofre-auth'
import type { UsersRepository } from '@repositories/users-repository'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'

export function registerCofreRoutes(
  app: FastifyInstance,
  usersRepository: UsersRepository,
  cofreEntriesRepository: CofreEntriesRepository
): void {
  app.register(cofreRoutes({ usersRepository, cofreEntriesRepository }))
}
