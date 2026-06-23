import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string

beforeAll(async () => {
  const usersRepository = new InMemoryUsersRepository()
  const notesRepository = new InMemoryNotesRepository()

  await usersRepository.create({
    id: 'user-1',
    name: 'Admin',
    email: 'admin@lifeos.com',
    passwordHash: await hash('12345678'),
  })

  app = createApp(usersRepository, undefined, notesRepository)
  await app.ready()

  const loginRes = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'admin@lifeos.com', password: '12345678' })

  const cookies = loginRes.headers['set-cookie'] as string[]
  authCookie = cookies.find((c: string) => c.startsWith('token='))!.split(';')[0]
})

afterAll(async () => {
  await app.close()
})

describe('POST /notes', () => {
  it('should create a note', async () => {
    const response = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'My Note' })

    expect(response.status).toBe(201)
    expect(response.body.note.title).toBe('My Note')
    expect(response.body.note.content).toBe('')
    expect(response.body.note.id).toBeDefined()
  })

  it('should return 401 without auth', async () => {
    const response = await supertest(app.server)
      .post('/notes')
      .send({ title: 'X' })

    expect(response.status).toBe(401)
  })
})

describe('GET /notes', () => {
  beforeEach(async () => {
    await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'Alpha' })
  })

  it('should list notes', async () => {
    const response = await supertest(app.server)
      .get('/notes')
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.notes.length).toBeGreaterThanOrEqual(1)
    expect(response.body.notes[0].snippet).toBeDefined()
    expect(response.body.notes[0].content).toBeUndefined()
  })

  it('should search notes', async () => {
    const response = await supertest(app.server)
      .get('/notes?search=alpha')
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.notes.length).toBeGreaterThanOrEqual(1)
  })
})

describe('GET /notes/:id', () => {
  it('should return full note', async () => {
    const createRes = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'Detail Test' })

    const response = await supertest(app.server)
      .get(`/notes/${createRes.body.note.id}`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.note.title).toBe('Detail Test')
    expect(response.body.note.content).toBeDefined()
  })

  it('should return 404', async () => {
    const response = await supertest(app.server)
      .get('/notes/nonexistent')
      .set('Cookie', authCookie)

    expect(response.status).toBe(404)
  })
})

describe('PUT /notes/:id', () => {
  it('should update note', async () => {
    const createRes = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'Old' })

    const response = await supertest(app.server)
      .put(`/notes/${createRes.body.note.id}`)
      .set('Cookie', authCookie)
      .send({ title: 'New', content: 'Updated content' })

    expect(response.status).toBe(200)
    expect(response.body.note.title).toBe('New')
    expect(response.body.note.content).toBe('Updated content')
  })
})

describe('DELETE /notes/:id', () => {
  it('should delete note', async () => {
    const createRes = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'To Delete' })

    const response = await supertest(app.server)
      .delete(`/notes/${createRes.body.note.id}`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(204)
  })
})
