import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupCofreE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string

beforeAll(async () => {
  const ctx = await setupCofreE2E()
  app = ctx.app
  authCookie = ctx.authCookie

  // create second user to test wrong-PIN isolation
  const second = await ctx.usersRepository.create({
    id: 'user-2',
    name: 'Other',
    email: 'other@lifeos.com',
    passwordHash: await (await import('@node-rs/bcrypt')).hash('12345678'),
  })
  const loginRes = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'other@lifeos.com', password: '12345678' })
  const cookies = loginRes.headers['set-cookie'] as string[]
  otherAuthCookie = cookies.find((c: string) => c.startsWith('token='))!.split(';')[0]
  void second
})

afterAll(async () => {
  await app.close()
})

describe('POST /cofre/unlock (invalid PIN)', () => {
  it('should return 401 with wrong PIN', async () => {
    const response = await supertest(app.server)
      .post('/cofre/unlock')
      .set('Cookie', authCookie)
      .send({ pin: '000000' })

    expect(response.status).toBe(401)
    expect(response.body.message).toBe('PIN inválido')
  })
})
