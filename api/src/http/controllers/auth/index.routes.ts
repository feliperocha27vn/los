import type { FastifyInstance } from 'fastify'
import { postAuthLoginRoute } from './post-auth-login'
import { getAuthMeRoute } from './get-auth-me'
import { postAuthLogoutRoute } from './post-auth-logout'
import type { UsersRepository } from '@repositories/users-repository'

export function registerAuthRoutes(
  app: FastifyInstance,
  usersRepository: UsersRepository
): void {
  void app.register(postAuthLoginRoute(usersRepository))
  void app.register(getAuthMeRoute(usersRepository))
  void app.register(postAuthLogoutRoute)
}
