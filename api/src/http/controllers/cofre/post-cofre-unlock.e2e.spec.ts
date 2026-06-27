import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupCofreE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let setCofreCookie: (value: string) => void

beforeAll(async () => {
  const ctx = await setupCofreE2E()
  app = ctx.app
  authCookie = ctx.authCookie
  setCofreCookie = ctx.setCofreCookie
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
    setCofreCookie(c.split(';')[0])
  })

  it('should return 401 without auth cookie', async () => {
    const response = await supertest(app.server)
      .post('/cofre/unlock')
      .send({ pin: '123456' })

    expect(response.status).toBe(401)
  })
})
