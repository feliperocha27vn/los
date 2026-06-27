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

describe('PATCH /tasks/:id/move', () => {
  it('should move task to another column', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Move me' })

    const res = await supertest(app.server)
      .patch(`/tasks/${created.body.task.id}/move`)
      .set('Cookie', authCookie)
      .send({ column: 'done', position: 5 })

    expect(res.status).toBe(200)
    expect(res.body.task.column).toBe('done')
    expect(res.body.task.position).toBe(5)
  })

  it('should return 409 on position conflict', async () => {
    const a = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'A' })
    const existing = await supertest(app.server).get('/tasks?column=done').set('Cookie', authCookie)
    const occupiedPosition = existing.body.tasks[0].position

    const res = await supertest(app.server)
      .patch(`/tasks/${a.body.task.id}/move`)
      .set('Cookie', authCookie)
      .send({ column: 'done', position: occupiedPosition })

    expect(res.status).toBe(409)
  })
})
