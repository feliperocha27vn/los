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

  it('should reclassify category', async () => {
    const created = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Reclassify me' })
    const res = await supertest(app.server)
      .put(`/tasks/${created.body.task.id}`)
      .set('Cookie', authCookie)
      .send({ category: 'personal' })

    expect(res.status).toBe(200)
    expect(res.body.task.category).toBe('personal')
  })
})
