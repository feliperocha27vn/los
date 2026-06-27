import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupAuthE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string

beforeAll(async () => {
  const ctx = await setupAuthE2E()
  app = ctx.app
  authCookie = ctx.authCookie
})

afterAll(async () => {
  await app.close()
})

describe('GET /auth/me', () => {
  it('should return user profile when authenticated', async () => {
    const response = await supertest(app.server)
      .get('/auth/me')
      .set('Cookie', authCookie)

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
