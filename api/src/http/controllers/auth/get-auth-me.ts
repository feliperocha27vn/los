import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { GetUserProfileUseCase } from '@use-cases/get-user-profile'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { UsersRepository } from '@repositories/users-repository'

export function getAuthMeRoute(
  usersRepository: UsersRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/auth/me', {
      schema: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
            }),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const useCase = new GetUserProfileUseCase(usersRepository)
        const { user } = await useCase.execute({ userId })
        return reply.status(200).send({ user })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
