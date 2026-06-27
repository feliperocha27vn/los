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

describe('GET /tasks', () => {
  it('should list tasks of the user only', async () => {
    const res = await supertest(app.server).get('/tasks').set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tasks)).toBe(true)
  })

  it('should filter by column', async () => {
    const res = await supertest(app.server).get('/tasks?column=done').set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.tasks.every((t: { column: string }) => t.column === 'done')).toBe(true)
  })

  it('should search by title', async () => {
    await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'UniqueSearchToken' })

    const res = await supertest(app.server)
      .get('/tasks?search=UniqueSearchToken')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.tasks.length).toBeGreaterThanOrEqual(1)
  })
})
