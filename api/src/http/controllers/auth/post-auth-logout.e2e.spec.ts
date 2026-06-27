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

describe('POST /auth/logout', () => {
  it('should logout and clear token cookie', async () => {
    const response = await supertest(app.server)
      .post('/auth/logout')
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.message).toBe('Logout realizado')
  })
})
