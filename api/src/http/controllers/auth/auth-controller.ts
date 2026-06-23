import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { makeLoginUseCase } from '@factories/make-login-use-case'
import { GetUserProfileUseCase } from '@use-cases/get-user-profile'
import { InvalidCredentialsError } from '@errors/invalid-credentials-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { UsersRepository } from '@repositories/users-repository'

export function makeAuthController(usersRepository: UsersRepository): FastifyPluginAsyncZod {
  return async (app) => {
    app.post('/auth/login', {
      config: { public: true },
      schema: {
        tags: ['Auth'],
        summary: 'Login with email and password',
        body: z.object({
          email: z.string().email(),
          password: z.string().min(8),
        }),
        response: {
          200: z.object({
            user: z.object({
              id: z.string(),
              name: z.string(),
              email: z.string().email(),
            }),
          }),
          401: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { email, password } = request.body

        const loginUseCase = makeLoginUseCase(usersRepository)

        const { user } = await loginUseCase.execute({ email, password })

        const token = await reply.jwtSign({ sub: user.id })

        reply.setCookie('token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
        })

        return reply.status(200).send({ user })
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          return reply.status(401).send({ message: error.message })
        }
        throw error
      }
    })

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

    app.post('/auth/logout', {
      schema: {
        tags: ['Auth'],
        summary: 'Logout and clear token cookie',
        response: {
          200: z.object({ message: z.string() }),
        },
      },
    }, async (_request, reply) => {
      reply.clearCookie('token', { path: '/' })

      return reply.status(200).send({ message: 'Logout realizado' })
    })
  }
}
