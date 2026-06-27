import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import supertest from 'supertest'
import { setupNotesE2E } from './e2e-helpers'
import type { FastifyInstance } from 'fastify'

let app: FastifyInstance
let authCookie: string

beforeAll(async () => {
  const ctx = await setupNotesE2E()
  app = ctx.app
  authCookie = ctx.authCookie
})

afterAll(async () => {
  await app.close()
})

beforeEach(async () => {
  await supertest(app.server)
    .post('/notes')
    .set('Cookie', authCookie)
    .send({ title: 'Alpha' })
})

describe('GET /notes', () => {
  it('should list notes', async () => {
    const response = await supertest(app.server)
      .get('/notes')
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.notes.length).toBeGreaterThanOrEqual(1)
    expect(response.body.notes[0].snippet).toBeDefined()
    expect(response.body.notes[0].content).toBeUndefined()
  })

  it('should search notes', async () => {
    const response = await supertest(app.server)
      .get('/notes?search=alpha')
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.notes.length).toBeGreaterThanOrEqual(1)
  })
})
