import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { InMemoryTrackerRecordsRepository } from '@in-memory/in-memory-tracker-records-repository'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'
import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../../../app'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string
let habitId: string

beforeAll(async () => {
  const usersRepository = new InMemoryUsersRepository()
  const trackerHabitsRepository = new InMemoryTrackerHabitsRepository()
  const trackerRecordsRepository = new InMemoryTrackerRecordsRepository()

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

  const created = await trackerHabitsRepository.create({
    id: 'h1',
    userId: 'user-1',
    name: 'Treino',
    icon: 'dumbbell',
    position: '1.0',
  })
  habitId = created.id

  app = createApp(
    usersRepository,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    trackerHabitsRepository,
    trackerRecordsRepository,
  )
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
  otherAuthCookie = otherCookies.find((c: string) => c.startsWith('token='))!.split(';')[0]
})

afterAll(async () => {
  await app.close()
})

describe('POST /tracker/habits', () => {
  it('should create a habit', async () => {
    const response = await supertest(app.server)
      .post('/tracker/habits')
      .set('Cookie', authCookie)
      .send({ name: 'Read', icon: 'book' })

    expect(response.status).toBe(201)
    expect(response.body.habit.name).toBe('Read')
    expect(response.body.habit.icon).toBe('book')
    expect(response.body.habit.archived).toBe(false)
  })

  it('should return 401 without auth', async () => {
    const response = await supertest(app.server)
      .post('/tracker/habits')
      .send({ name: 'X', icon: 'x' })
    expect(response.status).toBe(401)
  })
})

describe('GET /tracker/habits', () => {
  it('should list user habits', async () => {
    const res = await supertest(app.server).get('/tracker/habits').set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.habits)).toBe(true)
  })
})

describe('GET /tracker/habits/:id', () => {
  it('should return habit detail', async () => {
    const res = await supertest(app.server)
      .get(`/tracker/habits/${habitId}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.habit.name).toBe('Treino')
  })

  it('should return 404 for nonexistent', async () => {
    const res = await supertest(app.server)
      .get('/tracker/habits/nonexistent')
      .set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })
})

describe('PUT /tracker/habits/:id', () => {
  it('should update habit', async () => {
    const res = await supertest(app.server)
      .put(`/tracker/habits/${habitId}`)
      .set('Cookie', authCookie)
      .send({ name: 'Treino Pesado', icon: 'dumbbell' })

    expect(res.status).toBe(200)
    expect(res.body.habit.name).toBe('Treino Pesado')
  })
})

describe('PATCH /tracker/habits/:id/reorder', () => {
  it('should reorder', async () => {
    const res = await supertest(app.server)
      .patch(`/tracker/habits/${habitId}/reorder`)
      .set('Cookie', authCookie)
      .send({ position: 5 })

    expect(res.status).toBe(200)
    expect(res.body.habit.position).toBe(5)
  })
})

describe('DELETE /tracker/habits/:id (archive)', () => {
  it('should soft delete (archive)', async () => {
    const created = await supertest(app.server)
      .post('/tracker/habits')
      .set('Cookie', authCookie)
      .send({ name: 'Delete me', icon: 'trash' })

    const res = await supertest(app.server)
      .delete(`/tracker/habits/${created.body.habit.id}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(204)

    const list = await supertest(app.server).get('/tracker/habits').set('Cookie', authCookie)
    expect(
      list.body.habits.find((h: { id: string }) => h.id === created.body.habit.id),
    ).toBeUndefined()
  })
})

describe('PATCH /tracker/habits/:id/restore', () => {
  it('should restore archived habit', async () => {
    const created = await supertest(app.server)
      .post('/tracker/habits')
      .set('Cookie', authCookie)
      .send({ name: 'Restore me', icon: 'undo' })

    await supertest(app.server)
      .delete(`/tracker/habits/${created.body.habit.id}`)
      .set('Cookie', authCookie)

    const res = await supertest(app.server)
      .patch(`/tracker/habits/${created.body.habit.id}/restore`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.habit.archived).toBe(false)
  })
})

describe('PUT /tracker/records', () => {
  it('should create a record', async () => {
    const res = await supertest(app.server)
      .put('/tracker/records')
      .set('Cookie', authCookie)
      .send({ habitId, date: '2026-06-25', completed: true, energy: 'medium' })

    expect(res.status).toBe(200)
    expect(res.body.record.completed).toBe(true)
    expect(res.body.record.energy).toBe('medium')
  })

  it('should upsert (idempotent)', async () => {
    await supertest(app.server)
      .put('/tracker/records')
      .set('Cookie', authCookie)
      .send({ habitId, date: '2026-06-26', completed: false })

    const res = await supertest(app.server)
      .put('/tracker/records')
      .set('Cookie', authCookie)
      .send({ habitId, date: '2026-06-26', completed: true })

    expect(res.status).toBe(200)
    expect(res.body.record.completed).toBe(true)
  })

  it('should return 404 if habitId belongs to other user', async () => {
    const res = await supertest(app.server)
      .put('/tracker/records')
      .set('Cookie', authCookie)
      .send({ habitId: 'nonexistent', date: '2026-06-25', completed: true })
    expect(res.status).toBe(404)
  })
})

describe('GET /tracker/today', () => {
  it('should return today view', async () => {
    const res = await supertest(app.server).get('/tracker/today').set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.date).toBeDefined()
    expect(Array.isArray(res.body.habits)).toBe(true)
  })
})

describe('GET /tracker/days', () => {
  it('should return days range', async () => {
    const res = await supertest(app.server)
      .get('/tracker/days?from=2026-06-01&to=2026-06-30')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.days)).toBe(true)
  })
})

describe('cross-tenant isolation', () => {
  it('user-2 cannot access user-1 habit', async () => {
    const res = await supertest(app.server)
      .get(`/tracker/habits/${habitId}`)
      .set('Cookie', otherAuthCookie)
    expect(res.status).toBe(404)
  })
})
