import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { UnlockCofreUseCase } from '@use-cases/unlock-cofre'
import { FetchCofreEntriesUseCase } from '@use-cases/fetch-cofre-entries'
import { GetCofreEntryDetailUseCase } from '@use-cases/get-cofre-entry-detail'
import { CreateCofreEntryUseCase } from '@use-cases/create-cofre-entry'
import { UpdateCofreEntryUseCase } from '@use-cases/update-cofre-entry'
import { DeleteCofreEntryUseCase } from '@use-cases/delete-cofre-entry'
import { CofreLockedError } from '@errors/cofre-locked-error'
import { InvalidCofrePinError } from '@errors/invalid-cofre-pin-error'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import { encrypt, decrypt, deriveKey } from '@utils/cofre-encryption'
import type { UsersRepository } from '@repositories/users-repository'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'
import { env } from '../../../env'

export function makeCofreController(
  usersRepository: UsersRepository,
  cofreEntriesRepository: CofreEntriesRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.addHook('preHandler', async (request, reply) => {
      if (request.routeOptions.url === '/cofre/unlock' && request.routeOptions.method === 'POST') {
        return
      }

      const cofreToken = request.cookies?.cofre_token

      if (!cofreToken) {
        return reply.status(401).send({ message: 'Cofre bloqueado. Faça o unlock primeiro.' })
      }

      try {
        const payload = app.jwt.verify(cofreToken)
        ;(request as Record<string, unknown>).cofrePayload = payload
      } catch {
        return reply.status(401).send({ message: 'Sessão do cofre expirada. Faça o unlock novamente.' })
      }
    })

    app.post('/cofre/unlock', {
      schema: {
        tags: ['Cofre'],
        summary: 'Unlock cofre with PIN',
        body: z.object({
          pin: z.string().min(1),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          401: z.object({ message: z.string() }),
          423: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }

        const unlockUseCase = new UnlockCofreUseCase(usersRepository)

        const { pinHash } = await unlockUseCase.execute({
          userId,
          pin: request.body.pin,
        })

        const cofreToken = app.jwt.sign(
          { sub: userId, pinHash },
          { secret: env.COFRE_JWT_SECRET, expiresIn: '5min' }
        )

        reply.setCookie('cofre_token', cofreToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/cofre',
          maxAge: 60 * 5,
        })

        return reply.status(200).send({ message: 'Cofre desbloqueado' })
      } catch (error) {
        if (error instanceof InvalidCofrePinError) {
          return reply.status(401).send({ message: error.message })
        }
        if (error instanceof CofreLockedError) {
          return reply.status(423).send({ message: error.message })
        }
        throw error
      }
    })

    app.post('/cofre/lock', {
      schema: {
        tags: ['Cofre'],
        summary: 'Lock cofre (clear session)',
        response: {
          200: z.object({ message: z.string() }),
        },
      },
    }, async (_request, reply) => {
      reply.clearCookie('cofre_token', { path: '/cofre' })

      return reply.status(200).send({ message: 'Cofre bloqueado' })
    })

    app.get('/cofre/entries', {
      schema: {
        tags: ['Cofre'],
        summary: 'List cofre entries',
        querystring: z.object({
          category: z.enum(['credential', 'secure_note', 'api_key']).optional(),
          search: z.string().optional(),
        }),
        response: {
          200: z.object({
            entries: z
              .object({
                id: z.string(),
                category: z.enum(['credential', 'secure_note', 'api_key']),
                title: z.string(),
                url: z.string().nullable(),
                username: z.string().nullable(),
                provider: z.string().nullable(),
                createdAt: z.string(),
                updatedAt: z.string(),
              })
              .array(),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { category, search } = request.query

      const useCase = new FetchCofreEntriesUseCase(cofreEntriesRepository)

      const { entries } = await useCase.execute({ userId, category, search })

      return reply.status(200).send({
        entries: entries.map((e) => ({
          ...e,
          createdAt: e.createdAt.toISOString(),
          updatedAt: e.updatedAt.toISOString(),
        })),
      })
    })

    app.get('/cofre/entries/:id', {
      schema: {
        tags: ['Cofre'],
        summary: 'Get cofre entry detail with decrypted fields',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            entry: z.object({
              id: z.string(),
              category: z.enum(['credential', 'secure_note', 'api_key']),
              title: z.string(),
              url: z.string().nullable(),
              username: z.string().nullable(),
              password: z.string().nullable(),
              content: z.string().nullable(),
              provider: z.string().nullable(),
              token: z.string().nullable(),
              createdAt: z.string(),
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
        const { pinHash } = (request as Record<string, unknown>).cofrePayload as { pinHash: string }

        const key = deriveKey(pinHash)

        const useCase = new GetCofreEntryDetailUseCase(cofreEntriesRepository)

        const { entry } = await useCase.execute({ entryId: id, userId })

        return reply.status(200).send({
          entry: {
            id: entry.id,
            category: entry.category,
            title: entry.title,
            url: entry.url,
            username: entry.username,
            password: entry.passwordEnc ? decrypt(entry.passwordEnc, key) : null,
            content: entry.contentEnc ? decrypt(entry.contentEnc, key) : null,
            provider: entry.provider,
            token: entry.tokenEnc ? decrypt(entry.tokenEnc, key) : null,
            createdAt: entry.createdAt.toISOString(),
            updatedAt: entry.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.post('/cofre/entries', {
      schema: {
        tags: ['Cofre'],
        summary: 'Create cofre entry',
        body: z.object({
          category: z.enum(['credential', 'secure_note', 'api_key']),
          title: z.string().min(1),
          url: z.string().nullable().optional(),
          username: z.string().nullable().optional(),
          password: z.string().nullable().optional(),
          content: z.string().nullable().optional(),
          provider: z.string().nullable().optional(),
          token: z.string().nullable().optional(),
        }),
        response: {
          201: z.object({
            entry: z.object({
              id: z.string(),
              category: z.enum(['credential', 'secure_note', 'api_key']),
              title: z.string(),
              createdAt: z.string(),
            }),
          }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { pinHash } = (request as Record<string, unknown>).cofrePayload as { pinHash: string }
      const { category, title, url, username, password, content, provider, token } = request.body

      const key = deriveKey(pinHash)

      const useCase = new CreateCofreEntryUseCase(cofreEntriesRepository)

      const { entry } = await useCase.execute({
        userId,
        category,
        title,
        url,
        username,
        passwordEnc: password ? encrypt(password, key) : null,
        contentEnc: content ? encrypt(content, key) : null,
        provider,
        tokenEnc: token ? encrypt(token, key) : null,
      })

      return reply.status(201).send({
        entry: {
          id: entry.id,
          category: entry.category,
          title: entry.title,
          createdAt: entry.createdAt.toISOString(),
        },
      })
    })

    app.put('/cofre/entries/:id', {
      schema: {
        tags: ['Cofre'],
        summary: 'Update cofre entry',
        params: z.object({ id: z.string() }),
        body: z.object({
          title: z.string().min(1).optional(),
          url: z.string().nullable().optional(),
          username: z.string().nullable().optional(),
          password: z.string().nullable().optional(),
          content: z.string().nullable().optional(),
          provider: z.string().nullable().optional(),
          token: z.string().nullable().optional(),
        }),
        response: {
          200: z.object({
            entry: z.object({
              id: z.string(),
              title: z.string(),
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
        const { pinHash } = (request as Record<string, unknown>).cofrePayload as { pinHash: string }
        const { title, url, username, password, content, provider, token } = request.body

        const key = deriveKey(pinHash)

        const useCase = new UpdateCofreEntryUseCase(cofreEntriesRepository)

        const { entry } = await useCase.execute({
          entryId: id,
          userId,
          title,
          url,
          username,
          passwordEnc: password !== undefined ? (password ? encrypt(password, key) : null) : undefined,
          contentEnc: content !== undefined ? (content ? encrypt(content, key) : null) : undefined,
          provider,
          tokenEnc: token !== undefined ? (token ? encrypt(token, key) : null) : undefined,
        })

        return reply.status(200).send({
          entry: {
            id: entry.id,
            title: entry.title,
            updatedAt: entry.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.delete('/cofre/entries/:id', {
      schema: {
        tags: ['Cofre'],
        summary: 'Delete cofre entry',
        params: z.object({ id: z.string() }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params

        const useCase = new DeleteCofreEntryUseCase(cofreEntriesRepository)

        await useCase.execute({ entryId: id, userId })

        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
