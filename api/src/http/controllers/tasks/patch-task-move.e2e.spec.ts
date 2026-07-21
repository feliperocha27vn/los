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

describe('PATCH /tasks/:id/move', () => {
  it('should move task to another column (same category)', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Move me', category: 'work' })

    const res = await supertest(app.server)
      .patch(`/tasks/${created.body.task.id}/move`)
      .set('Cookie', authCookie)
      .send({ category: 'work', column: 'done', position: 5 })

    expect(res.status).toBe(200)
    expect(res.body.task.column).toBe('done')
    expect(res.body.task.category).toBe('work')
    expect(res.body.task.position).toBe(5)
  })

  it('should move task to a different category (cross-tab move)', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Cross tab', category: 'work' })

    const res = await supertest(app.server)
      .patch(`/tasks/${created.body.task.id}/move`)
      .set('Cookie', authCookie)
      .send({ category: 'personal', column: 'todo', position: 1 })

    expect(res.status).toBe(200)
    expect(res.body.task.category).toBe('personal')
    expect(res.body.task.column).toBe('todo')
  })

  it('should return 409 on position conflict in same (category, column)', async () => {
    const a = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'A', category: 'work' })
    const existing = await supertest(app.server)
      .get('/tasks?category=work&column=done')
      .set('Cookie', authCookie)
    const occupiedPosition = existing.body.tasks[0].position

    const res = await supertest(app.server)
      .patch(`/tasks/${a.body.task.id}/move`)
      .set('Cookie', authCookie)
      .send({ category: 'work', column: 'done', position: occupiedPosition })

    expect(res.status).toBe(409)
  })
})
