import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupAuthE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance

beforeAll(async () => {
  const ctx = await setupAuthE2E()
  app = ctx.app
})

afterAll(async () => {
  await app.close()
})

describe('POST /auth/login', () => {
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
