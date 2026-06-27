import type { FastifyInstance } from 'fastify'
import { postAuthLoginRoute } from './post-auth-login'
import { getAuthMeRoute } from './get-auth-me'
import { postAuthLogoutRoute } from './post-auth-logout'
import type { UsersRepository } from '@repositories/users-repository'

export function registerAuthRoutes(
  app: FastifyInstance,
  usersRepository: UsersRepository
): void {
  app
    .register(postAuthLoginRoute(usersRepository))
    .register(getAuthMeRoute(usersRepository))
    .register(postAuthLogoutRoute)
}
