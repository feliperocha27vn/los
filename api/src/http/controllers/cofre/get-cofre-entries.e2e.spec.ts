import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupCofreE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let cofreCookie: string
let getCofreCookie: () => string
let setCofreCookie: (value: string) => void

beforeAll(async () => {
  const ctx = await setupCofreE2E()
  app = ctx.app
  authCookie = ctx.authCookie
  getCofreCookie = ctx.getCofreCookie
  setCofreCookie = ctx.setCofreCookie

  const res = await supertest(app.server)
    .post('/cofre/unlock')
    .set('Cookie', authCookie)
    .send({ pin: '123456' })
  const cookies = res.headers['set-cookie'] as string[]
  setCofreCookie(cookies.find((c: string) => c.startsWith('cofre_token='))!.split(';')[0])
})

afterAll(async () => {
  await app.close()
})

describe('GET /cofre/entries', () => {
  it('should list entries with cofre cookie', async () => {
    cofreCookie = getCofreCookie()
    const response = await supertest(app.server)
      .get('/cofre/entries')
      .set('Cookie', `${authCookie}; ${cofreCookie}`)

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
