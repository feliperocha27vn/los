import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string
let testCourseId: string

beforeAll(async () => {
  const usersRepository = new InMemoryUsersRepository()
  const studyCoursesRepository = new InMemoryStudyCoursesRepository()
  const studyModulesRepository = new InMemoryStudyModulesRepository()

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

  const created = await studyCoursesRepository.create({
    id: 'c1',
    userId: 'user-1',
    name: 'React',
    position: '1.0',
  })
  testCourseId = created.id

  app = createApp(
    usersRepository,
    undefined,
    undefined,
    undefined,
    studyCoursesRepository,
    studyModulesRepository
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

describe('POST /modules', () => {
  it('should create a module in course', async () => {
    const response = await supertest(app.server)
      .post('/modules')
      .set('Cookie', authCookie)
      .send({ courseId: testCourseId, name: 'Intro' })

    expect(response.status).toBe(201)
    expect(response.body.module.courseId).toBe(testCourseId)
    expect(response.body.module.name).toBe('Intro')
  })

  it('should return 404 if courseId does not exist', async () => {
    const response = await supertest(app.server)
      .post('/modules')
      .set('Cookie', authCookie)
      .send({ courseId: 'nonexistent', name: 'X' })
    expect(response.status).toBe(404)
  })

  it('should return 404 if courseId belongs to other user', async () => {
    const otherCourse = await supertest(app.server)
      .post('/courses')
      .set('Cookie', otherAuthCookie)
      .send({ name: 'Other Course' })

    const response = await supertest(app.server)
      .post('/modules')
      .set('Cookie', authCookie)
      .send({ courseId: otherCourse.body.course.id, name: 'X' })
    expect(response.status).toBe(404)
  })
})

describe('GET /modules', () => {
  it('should list modules of a course', async () => {
    const res = await supertest(app.server)
      .get(`/modules?courseId=${testCourseId}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.modules)).toBe(true)
  })
})

describe('GET /modules/:id', () => {
  it('should return module detail', async () => {
    const created = await supertest(app.server)
      .post('/modules')
      .set('Cookie', authCookie)
      .send({ courseId: testCourseId, name: 'Detail' })
    const res = await supertest(app.server)
      .get(`/modules/${created.body.module.id}`)
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.module.name).toBe('Detail')
  })

  it('should return 404 for nonexistent', async () => {
    const res = await supertest(app.server)
      .get('/modules/nonexistent')
      .set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })
})

describe('PUT /modules/:id', () => {
  it('should update module', async () => {
    const created = await supertest(app.server)
      .post('/modules')
      .set('Cookie', authCookie)
      .send({ courseId: testCourseId, name: 'Old' })
    const res = await supertest(app.server)
      .put(`/modules/${created.body.module.id}`)
      .set('Cookie', authCookie)
      .send({ name: 'New' })

    expect(res.status).toBe(200)
    expect(res.body.module.name).toBe('New')
  })
})

describe('PATCH /modules/:id/reorder', () => {
  it('should reorder', async () => {
    const created = await supertest(app.server)
      .post('/modules')
      .set('Cookie', authCookie)
      .send({ courseId: testCourseId, name: 'Reorder' })
    const res = await supertest(app.server)
      .patch(`/modules/${created.body.module.id}/reorder`)
      .set('Cookie', authCookie)
      .send({ position: 3 })

    expect(res.status).toBe(200)
    expect(res.body.module.position).toBe(3)
  })
})

describe('DELETE /modules/:id', () => {
  it('should delete module', async () => {
    const created = await supertest(app.server)
      .post('/modules')
      .set('Cookie', authCookie)
      .send({ courseId: testCourseId, name: 'Delete' })
    const res = await supertest(app.server)
      .delete(`/modules/${created.body.module.id}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(204)
  })
})
