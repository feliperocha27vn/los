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

  const unlock = await supertest(app.server)
    .post('/cofre/unlock')
    .set('Cookie', authCookie)
    .send({ pin: '123456' })
  const cookies = unlock.headers['set-cookie'] as string[]
  setCofreCookie(cookies.find((c: string) => c.startsWith('cofre_token='))!.split(';')[0])
  cofreCookie = getCofreCookie()
})

afterAll(async () => {
  await app.close()
})

describe('POST /cofre/entries', () => {
  it('should create a credential entry', async () => {
    const response = await supertest(app.server)
      .post('/cofre/entries')
      .set('Cookie', `${authCookie}; ${cofreCookie}`)
      .send({
        category: 'credential',
        title: 'GitHub Create',
        url: 'https://github.com',
        username: 'admin',
        password: 'mypassword',
      })

    expect(response.status).toBe(201)
    expect(response.body.entry.title).toBe('GitHub Create')
    expect(response.body.entry.id).toBeDefined()
  })
})
