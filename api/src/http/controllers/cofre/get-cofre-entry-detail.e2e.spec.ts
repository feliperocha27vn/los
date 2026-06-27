import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import supertest from 'supertest'
import { setupCofreE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string
let cofreCookie: string
let getCofreCookie: () => string
let setCofreCookie: (value: string) => void
let entryId: string

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

  const createRes = await supertest(app.server)
    .post('/cofre/entries')
    .set('Cookie', `${authCookie}; ${cofreCookie}`)
    .send({
      category: 'credential',
      title: 'GitHub',
      url: 'https://github.com',
      username: 'admin',
      password: 'mypassword',
    })
  entryId = createRes.body.entry.id
})

afterAll(async () => {
  await app.close()
})

describe('GET /cofre/entries/:id', () => {
  it('should return decrypted detail', async () => {
    const response = await supertest(app.server)
      .get(`/cofre/entries/${entryId}`)
      .set('Cookie', `${authCookie}; ${cofreCookie}`)

    expect(response.status).toBe(200)
    expect(response.body.entry.title).toBe('GitHub')
    expect(response.body.entry.password).toBe('mypassword')
  })

  it('should return 404 for non-existent entry', async () => {
    const response = await supertest(app.server)
      .get('/cofre/entries/non-existent')
      .set('Cookie', `${authCookie}; ${cofreCookie}`)

    expect(response.status).toBe(404)
  })
})

describe('PUT /cofre/entries/:id (in entries detail suite)', () => {
  it('should update entry', async () => {
    const response = await supertest(app.server)
      .put(`/cofre/entries/${entryId}`)
      .set('Cookie', `${authCookie}; ${cofreCookie}`)
      .send({ title: 'GitHub Updated' })

    expect(response.status).toBe(200)
    expect(response.body.entry.title).toBe('GitHub Updated')
  })
})
