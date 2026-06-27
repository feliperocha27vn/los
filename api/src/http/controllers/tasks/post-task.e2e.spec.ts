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

describe('POST /tasks', () => {
  it('should create a task in todo by default', async () => {
    const response = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'My Task' })

    expect(response.status).toBe(201)
    expect(response.body.task.title).toBe('My Task')
    expect(response.body.task.column).toBe('todo')
    expect(response.body.task.position).toBe(1)
  })

  it('should create a task with explicit column', async () => {
    const response = await supertest(app.server)
      .post('/tasks')
      .set('Cookie', authCookie)
      .send({ title: 'Doing it', column: 'in_progress' })

    expect(response.status).toBe(201)
    expect(response.body.task.column).toBe('in_progress')
  })

  it('should return 401 without auth', async () => {
    const response = await supertest(app.server).post('/tasks').send({ title: 'X' })
    expect(response.status).toBe(401)
  })
})
