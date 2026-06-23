import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let usersRepository: InMemoryUsersRepository

beforeAll(async () => {
  usersRepository = new InMemoryUsersRepository()

  await usersRepository.create({
    id: 'user-1',
    name: 'Sofia Davis',
    email: 'sofia@lifeos.com',
    passwordHash: await hash('12345678'),
  })

  app = createApp(usersRepository)
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('POST /auth/login (e2e)', () => {
  it('should login with valid credentials and set httpOnly cookie', async () => {
    const response = await supertest(app.server)
      .post('/auth/login')
      .send({ email: 'sofia@lifeos.com', password: '12345678' })

    expect(response.status).toBe(200)
    expect(response.body.user).toEqual({
      id: 'user-1',
      name: 'Sofia Davis',
      email: 'sofia@lifeos.com',
    })

    const cookies = response.headers['set-cookie']
    expect(cookies).toBeDefined()
    const tokenCookie = Array.isArray(cookies)
      ? cookies.find((c: string) => c.startsWith('token='))
      : cookies?.startsWith('token=')
    expect(tokenCookie).toBeTruthy()
    expect(tokenCookie).toContain('HttpOnly')
  })

  it('should return 401 with wrong password', async () => {
    const response = await supertest(app.server)
      .post('/auth/login')
      .send({ email: 'sofia@lifeos.com', password: 'wrongpass' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Credenciais inválidas')
  })

  it('should return 401 with non-existent email', async () => {
    const response = await supertest(app.server)
      .post('/auth/login')
      .send({ email: 'nobody@test.com', password: '12345678' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Credenciais inválidas')
  })
})

describe('GET /auth/me (e2e)', () => {
  it('should return user profile when authenticated', async () => {
    const loginResponse = await supertest(app.server)
      .post('/auth/login')
      .send({ email: 'sofia@lifeos.com', password: '12345678' })

    const cookies = loginResponse.headers['set-cookie'] as string[]
    const tokenCookie = cookies.find((c: string) => c.startsWith('token='))!

    const response = await supertest(app.server)
      .get('/auth/me')
      .set('Cookie', tokenCookie.split(';')[0])

    expect(response.status).toBe(200)
    expect(response.body.user).toEqual({
      id: 'user-1',
      name: 'Sofia Davis',
      email: 'sofia@lifeos.com',
    })
  })

  it('should return 401 without token', async () => {
    const response = await supertest(app.server).get('/auth/me')

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('Não autorizado')
  })
})
