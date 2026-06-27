import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupTasksE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string

beforeAll(async () => {
  const ctx = await setupTasksE2E()
  app = ctx.app
  authCookie = ctx.authCookie
  otherAuthCookie = ctx.otherAuthCookie
})

afterAll(async () => {
  await app.close()
})

describe('GET /tasks/:id', () => {
  it('should return task detail', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Detail me' })
    const res = await supertest(app.server)
      .get(`/tasks/${created.body.task.id}`)
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.task.title).toBe('Detail me')
  })

  it('should return 404 for nonexistent', async () => {
    const res = await supertest(app.server).get('/tasks/nonexistent').set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })

  it('should not allow other user to read this task', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Mine' })
    const res = await supertest(app.server)
      .get(`/tasks/${created.body.task.id}`)
      .set('Cookie', otherAuthCookie)
    expect(res.status).toBe(404)
  })
})
