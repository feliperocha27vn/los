import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupTasksE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string

beforeAll(async () => {
  const ctx = await setupTasksE2E()
  app = ctx.app
  authCookie = ctx.authCookie
})

afterAll(async () => {
  await app.close()
})

describe('DELETE /tasks/:id', () => {
  it('should delete task', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Bye' })
    const res = await supertest(app.server)
      .delete(`/tasks/${created.body.task.id}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(204)
  })
})
