import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'

export const postAuthLogoutRoute: FastifyPluginAsyncZod = async (app) => {
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
