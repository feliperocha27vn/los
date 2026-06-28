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

describe('agenda preferences e2e', () => {
  it('should return default preferences', async () => {
    const res = await supertest(app.server)
      .get('/agenda/preferences')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.preferences.notificationOffsetMinutes).toBe(15)
    expect(res.body.preferences.timezone).toBe('America/Sao_Paulo')
  })

  it('should update preferences', async () => {
    const res = await supertest(app.server)
      .put('/agenda/preferences')
      .set('Cookie', authCookie)
      .send({ notificationOffsetMinutes: 30 })
    expect(res.status).toBe(200)
    expect(res.body.preferences.notificationOffsetMinutes).toBe(30)
  })

  it('should reject invalid offset', async () => {
    const res = await supertest(app.server)
      .put('/agenda/preferences')
      .set('Cookie', authCookie)
      .send({ notificationOffsetMinutes: 99999 })
    expect(res.status).toBe(400)
  })
})
