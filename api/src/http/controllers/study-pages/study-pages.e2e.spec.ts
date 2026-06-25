import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string
let testModuleId: string
let otherModuleId: string

beforeAll(async () => {
  const usersRepository = new InMemoryUsersRepository()
  const studyCoursesRepository = new InMemoryStudyCoursesRepository()
  const studyModulesRepository = new InMemoryStudyModulesRepository()
  const studyPagesRepository = new InMemoryStudyPagesRepository()

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

  const course = await studyCoursesRepository.create({
    id: 'c1',
    userId: 'user-1',
    name: 'React',
    position: '1.0',
  })
  const otherCourse = await studyCoursesRepository.create({
    id: 'c2',
    userId: 'user-2',
    name: 'Other Course',
    position: '1.0',
  })

  const module = await studyModulesRepository.create({
    id: 'm1',
    userId: 'user-1',
    courseId: course.id,
    name: 'Intro',
    position: '1.0',
  })
  testModuleId = module.id

  const otherModule = await studyModulesRepository.create({
    id: 'm2',
    userId: 'user-2',
    courseId: otherCourse.id,
    name: 'Other Module',
    position: '1.0',
  })
  otherModuleId = otherModule.id

  app = createApp(
    usersRepository,
    undefined,
    undefined,
    undefined,
    studyCoursesRepository,
    studyModulesRepository,
    studyPagesRepository
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

describe('POST /pages', () => {
  it('should create a page in module', async () => {
    const response = await supertest(app.server)
      .post('/pages')
      .set('Cookie', authCookie)
      .send({ moduleId: testModuleId, title: 'Notes' })

    expect(response.status).toBe(201)
    expect(response.body.page.moduleId).toBe(testModuleId)
    expect(response.body.page.title).toBe('Notes')
    expect(response.body.page.content).toBe('')
  })

  it('should return 404 if moduleId does not exist', async () => {
    const response = await supertest(app.server)
      .post('/pages')
      .set('Cookie', authCookie)
      .send({ moduleId: 'nonexistent', title: 'X' })
    expect(response.status).toBe(404)
  })

  it('should return 404 if moduleId belongs to other user', async () => {
    const response = await supertest(app.server)
      .post('/pages')
      .set('Cookie', authCookie)
      .send({ moduleId: otherModuleId, title: 'X' })
    expect(response.status).toBe(404)
  })
})

describe('GET /pages', () => {
  it('should list pages of a module', async () => {
    const res = await supertest(app.server)
      .get(`/pages?moduleId=${testModuleId}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.pages)).toBe(true)
  })
})

describe('GET /pages/:id', () => {
  it('should return page detail with breadcrumb', async () => {
    const created = await supertest(app.server)
      .post('/pages')
      .set('Cookie', authCookie)
      .send({ moduleId: testModuleId, title: 'With BC' })
    const res = await supertest(app.server)
      .get(`/pages/${created.body.page.id}`)
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.page.title).toBe('With BC')
    expect(res.body.breadcrumbs.course).toEqual({ id: 'c1', name: 'React' })
    expect(res.body.breadcrumbs.module).toEqual({ id: 'm1', name: 'Intro' })
    expect(res.body.breadcrumbs.page).toEqual({ id: created.body.page.id, name: 'With BC' })
  })

  it('should return 404 for nonexistent', async () => {
    const res = await supertest(app.server)
      .get('/pages/nonexistent')
      .set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })
})

describe('PUT /pages/:id', () => {
  it('should update page content', async () => {
    const created = await supertest(app.server)
      .post('/pages')
      .set('Cookie', authCookie)
      .send({ moduleId: testModuleId, title: 'Update me' })
    const res = await supertest(app.server)
      .put(`/pages/${created.body.page.id}`)
      .set('Cookie', authCookie)
      .send({ content: 'New content' })

    expect(res.status).toBe(200)
    expect(res.body.page.content).toBe('New content')
  })
})

describe('PATCH /pages/:id/reorder', () => {
  it('should reorder', async () => {
    const created = await supertest(app.server)
      .post('/pages')
      .set('Cookie', authCookie)
      .send({ moduleId: testModuleId, title: 'Reorder' })
    const res = await supertest(app.server)
      .patch(`/pages/${created.body.page.id}/reorder`)
      .set('Cookie', authCookie)
      .send({ position: 2 })

    expect(res.status).toBe(200)
    expect(res.body.page.position).toBe(2)
  })
})

describe('DELETE /pages/:id', () => {
  it('should delete page', async () => {
    const created = await supertest(app.server)
      .post('/pages')
      .set('Cookie', authCookie)
      .send({ moduleId: testModuleId, title: 'Delete' })
    const res = await supertest(app.server)
      .delete(`/pages/${created.body.page.id}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(204)
  })
})
