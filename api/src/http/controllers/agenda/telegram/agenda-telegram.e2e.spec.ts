import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { setupAgendaE2E } from '../e2e-helpers'

let app: FastifyInstance
let authCookie: string

beforeAll(async () => {
  const ctx = await setupAgendaE2E()
  app = ctx.app
  authCookie = ctx.authCookie
})

afterAll(async () => {
  await app.close()
})

describe('agenda telegram e2e', () => {
  it('should return 503 when telegram not configured', async () => {
    const res = await supertest(app.server)
      .get('/agenda/telegram/link')
      .set('Cookie', authCookie)
    expect(res.status).toBe(503)
  })

  it('should reject webhook without secret token (or return 503 if not configured)', async () => {
    const res = await supertest(app.server)
      .post('/agenda/telegram/webhook')
      .send({ update_id: 1, message: { chat: { id: 123 }, text: '/start abc' } })
    expect([401, 503]).toContain(res.status)
  })
})
