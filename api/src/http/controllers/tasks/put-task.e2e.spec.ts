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

describe('PUT /tasks/:id', () => {
  it('should update title and description', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Old' })
    const res = await supertest(app.server)
      .put(`/tasks/${created.body.task.id}`)
      .set('Cookie', authCookie)
      .send({ title: 'New', description: 'd' })

    expect(res.status).toBe(200)
    expect(res.body.task.title).toBe('New')
    expect(res.body.task.description).toBe('d')
  })
})
