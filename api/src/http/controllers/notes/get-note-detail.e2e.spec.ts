import { describe, it, expect, beforeAll, afterAll } from 'vitest'
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

describe('GET /notes/:id', () => {
  it('should return full note', async () => {
    const createRes = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'Detail Test' })

    const response = await supertest(app.server)
      .get(`/notes/${createRes.body.note.id}`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.note.title).toBe('Detail Test')
    expect(response.body.note.content).toBeDefined()
  })

  it('should return 404', async () => {
    const response = await supertest(app.server)
      .get('/notes/nonexistent')
      .set('Cookie', authCookie)

    expect(response.status).toBe(404)
  })
})
