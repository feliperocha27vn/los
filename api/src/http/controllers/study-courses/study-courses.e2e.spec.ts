import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string

beforeAll(async () => {
  const usersRepository = new InMemoryUsersRepository()
  const studyCoursesRepository = new InMemoryStudyCoursesRepository()

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

  app = createApp(
    usersRepository,
    undefined,
    undefined,
    undefined,
    studyCoursesRepository
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
  otherAuthCookie = otherCookies
    .find((c: string) => c.startsWith('token='))!
    .split(';')[0]
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  // Clear courses between tests by recreating the app's repository
  // Since in-memory is shared, we'll just rely on unique course names per test
})

describe('POST /courses', () => {
  it('should create a course with position 1.0', async () => {
    const response = await supertest(app.server)
      .post('/courses')
      .set('Cookie', authCookie)
      .send({ name: 'React' })

    expect(response.status).toBe(201)
    expect(response.body.course.name).toBe('React')
    expect(response.body.course.position).toBe(1)
  })

  it('should return 401 without auth', async () => {
    const response = await supertest(app.server)
      .post('/courses')
      .send({ name: 'X' })
    expect(response.status).toBe(401)
  })
})

describe('GET /courses', () => {
  it('should list user courses', async () => {
    const res = await supertest(app.server)
      .get('/courses')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.courses)).toBe(true)
  })
})

describe('GET /courses/:id', () => {
  it('should return course detail', async () => {
    const created = await supertest(app.server)
      .post('/courses')
      .set('Cookie', authCookie)
      .send({ name: 'Detail Test' })
    const res = await supertest(app.server)
      .get(`/courses/${created.body.course.id}`)
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.course.name).toBe('Detail Test')
  })

  it('should return 404 for nonexistent', async () => {
    const res = await supertest(app.server)
      .get('/courses/nonexistent')
      .set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })

  it('should not allow other user to read', async () => {
    const created = await supertest(app.server)
      .post('/courses')
      .set('Cookie', authCookie)
      .send({ name: 'Mine' })
    const res = await supertest(app.server)
      .get(`/courses/${created.body.course.id}`)
      .set('Cookie', otherAuthCookie)
    expect(res.status).toBe(404)
  })
})

describe('PUT /courses/:id', () => {
  it('should update course', async () => {
    const created = await supertest(app.server)
      .post('/courses')
      .set('Cookie', authCookie)
      .send({ name: 'Old' })
    const res = await supertest(app.server)
      .put(`/courses/${created.body.course.id}`)
      .set('Cookie', authCookie)
      .send({ name: 'New' })

    expect(res.status).toBe(200)
    expect(res.body.course.name).toBe('New')
  })
})

describe('PATCH /courses/:id/reorder', () => {
  it('should reorder', async () => {
    const created = await supertest(app.server)
      .post('/courses')
      .set('Cookie', authCookie)
      .send({ name: 'Reorder' })
    const res = await supertest(app.server)
      .patch(`/courses/${created.body.course.id}/reorder`)
      .set('Cookie', authCookie)
      .send({ position: 5 })

    expect(res.status).toBe(200)
    expect(res.body.course.position).toBe(5)
  })
})

describe('DELETE /courses/:id', () => {
  it('should delete course', async () => {
    const created = await supertest(app.server)
      .post('/courses')
      .set('Cookie', authCookie)
      .send({ name: 'Delete me' })
    const res = await supertest(app.server)
      .delete(`/courses/${created.body.course.id}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(204)
  })
})
