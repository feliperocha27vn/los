import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string

beforeAll(async () => {
  const usersRepository = new InMemoryUsersRepository()
  const tasksRepository = new InMemoryTasksRepository()

  await usersRepository.create({
    id: 'user-1',
    name: 'Admin',
    email: 'admin@lifeos.com',
    passwordHash: await hash('12345678'),
  })
  await usersRepository.create({
    id: 'user-2',
    name: 'Other',
    email: 'other@lifeos.com',
    passwordHash: await hash('12345678'),
  })

  app = createApp(usersRepository, undefined, undefined, tasksRepository)
  await app.ready()

  const loginRes = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'admin@lifeos.com', password: '12345678' })
  const cookies = loginRes.headers['set-cookie'] as string[]
  authCookie = cookies.find((c: string) => c.startsWith('token='))!.split(';')[0]

  const otherLogin = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'other@lifeos.com', password: '12345678' })
  const otherCookies = otherLogin.headers['set-cookie'] as string[]
  otherAuthCookie = otherCookies
    .find((c: string) => c.startsWith('token='))!
    .split(';')[0]
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
    const response = await supertest(app.server)
      .post('/tasks')
      .send({ title: 'X' })
    expect(response.status).toBe(401)
  })
})

describe('GET /tasks', () => {
  it('should list tasks of the user only', async () => {
    const res = await supertest(app.server)
      .get('/tasks')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tasks)).toBe(true)
  })

  it('should filter by column', async () => {
    const res = await supertest(app.server)
      .get('/tasks?column=done')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(
      res.body.tasks.every((t: { column: string }) => t.column === 'done')
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
    const res = await supertest(app.server)
      .get('/tasks/nonexistent')
      .set('Cookie', authCookie)
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
    const existing = await supertest(app.server)
      .get('/tasks?column=done')
      .set('Cookie', authCookie)
    const occupiedPosition = existing.body.tasks[0].position

    const res = await supertest(app.server)
      .patch(`/tasks/${a.body.task.id}/move`)
      .set('Cookie', authCookie)
      .send({ column: 'done', position: occupiedPosition })

    expect(res.status).toBe(409)
  })
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
