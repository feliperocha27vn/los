import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let usersRepository: InMemoryUsersRepository
let cofreEntriesRepository: InMemoryCofreEntriesRepository
let authCookie: string
let cofreCookie: string

function bothCookies() {
  return `${authCookie}; ${cofreCookie}`
}

beforeAll(async () => {
  usersRepository = new InMemoryUsersRepository()
  cofreEntriesRepository = new InMemoryCofreEntriesRepository()

  const pinHash = await hash('123456')

  await usersRepository.create({
    id: 'user-1',
    name: 'Admin',
    email: 'admin@lifeos.com',
    passwordHash: await hash('12345678'),
  })

  const user = await usersRepository.findById('user-1')
  user!.pinHash = pinHash

  app = createApp(usersRepository, cofreEntriesRepository)
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

describe('POST /cofre/unlock', () => {
  it('should unlock with correct PIN and set httpOnly cookie', async () => {
    const response = await supertest(app.server)
      .post('/cofre/unlock')
      .set('Cookie', authCookie)
      .send({ pin: '123456' })

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Cofre desbloqueado')

    const cookies = response.headers['set-cookie'] as string[]
    const c = cookies.find((c: string) => c.startsWith('cofre_token='))!
    expect(c).toBeTruthy()
    expect(c).toContain('HttpOnly')
    expect(c).toContain('Path=/cofre')
    cofreCookie = c.split(';')[0]
  })

  it('should return 401 with wrong PIN', async () => {
    const response = await supertest(app.server)
      .post('/cofre/unlock')
      .set('Cookie', authCookie)
      .send({ pin: '000000' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('PIN inválido')
  })

  it('should return 401 without auth cookie', async () => {
    const response = await supertest(app.server)
      .post('/cofre/unlock')
      .send({ pin: '123456' })

    expect(response.status).toBe(401)
  })
})

describe('GET /cofre/entries', () => {
  beforeAll(async () => {
    if (!cofreCookie) {
      const res = await supertest(app.server)
        .post('/cofre/unlock')
        .set('Cookie', authCookie)
        .send({ pin: '123456' })

      const cookies = res.headers['set-cookie'] as string[]
      cofreCookie = cookies.find((c: string) => c.startsWith('cofre_token='))!.split(';')[0]
    }
  })

  it('should list entries', async () => {
    const response = await supertest(app.server)
      .get('/cofre/entries')
      .set('Cookie', bothCookies())

    expect(response.status).toBe(200)
    expect(response.body.entries).toBeInstanceOf(Array)
  })

  it('should return 401 without cofre cookie', async () => {
    const response = await supertest(app.server)
      .get('/cofre/entries')
      .set('Cookie', authCookie)

    expect(response.status).toBe(401)
  })
})

describe('POST /cofre/entries', () => {
  beforeAll(async () => {
    if (!cofreCookie) {
      const res = await supertest(app.server)
        .post('/cofre/unlock')
        .set('Cookie', authCookie)
        .send({ pin: '123456' })

      const cookies = res.headers['set-cookie'] as string[]
      cofreCookie = cookies.find((c: string) => c.startsWith('cofre_token='))!.split(';')[0]
    }
  })

  it('should create a credential entry', async () => {
    const response = await supertest(app.server)
      .post('/cofre/entries')
      .set('Cookie', bothCookies())
      .send({
        category: 'credential',
        title: 'GitHub',
        url: 'https://github.com',
        username: 'admin',
        password: 'mypassword',
      })

    expect(response.status).toBe(201)
    expect(response.body.entry.title).toBe('GitHub')
    expect(response.body.entry.id).toBeDefined()
  })
})

describe('GET /cofre/entries/:id', () => {
  let entryId: string

  beforeAll(async () => {
    if (!cofreCookie) {
      const res = await supertest(app.server)
        .post('/cofre/unlock')
        .set('Cookie', authCookie)
        .send({ pin: '123456' })

      const cookies = res.headers['set-cookie'] as string[]
      cofreCookie = cookies.find((c: string) => c.startsWith('cofre_token='))!.split(';')[0]
    }

    const createRes = await supertest(app.server)
      .post('/cofre/entries')
      .set('Cookie', bothCookies())
      .send({
        category: 'credential',
        title: 'GitHub Detail',
        url: 'https://github.com',
        username: 'admin',
        password: 'secret123',
      })

    entryId = createRes.body.entry.id
  })

  it('should return decrypted detail', async () => {
    const response = await supertest(app.server)
      .get(`/cofre/entries/${entryId}`)
      .set('Cookie', bothCookies())

    expect(response.status).toBe(200)
    expect(response.body.entry.title).toBe('GitHub Detail')
    expect(response.body.entry.password).toBe('secret123')
    expect(response.body.entry.url).toBe('https://github.com')
  })

  it('should return 404 for non-existent entry', async () => {
    const response = await supertest(app.server)
      .get('/cofre/entries/non-existent')
      .set('Cookie', bothCookies())

    expect(response.status).toBe(404)
  })
})

describe('DELETE /cofre/entries/:id', () => {
  it('should delete an entry', async () => {
    if (!cofreCookie) {
      const res = await supertest(app.server)
        .post('/cofre/unlock')
        .set('Cookie', authCookie)
        .send({ pin: '123456' })

      const cookies = res.headers['set-cookie'] as string[]
      cofreCookie = cookies.find((c: string) => c.startsWith('cofre_token='))!.split(';')[0]
    }

    const createRes = await supertest(app.server)
      .post('/cofre/entries')
      .set('Cookie', bothCookies())
      .send({ category: 'secure_note', title: 'To Delete', content: 'secret' })

    const deleteRes = await supertest(app.server)
      .delete(`/cofre/entries/${createRes.body.entry.id}`)
      .set('Cookie', bothCookies())

    expect(deleteRes.status).toBe(204)
  })
})
