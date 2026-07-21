import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupTasksE2E } from './e2e-helpers'

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

  it('should filter by category', async () => {
    const res = await supertest(app.server).get('/tasks?category=work').set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.tasks.every((t: { category: string }) => t.category === 'work')).toBe(true)
  })

  it('should filter by category and column combined', async () => {
    const res = await supertest(app.server)
      .get('/tasks?category=other&column=todo')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(
      res.body.tasks.every(
        (t: { category: string; column: string }) => t.category === 'other' && t.column === 'todo',
      ),
    ).toBe(true)
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
