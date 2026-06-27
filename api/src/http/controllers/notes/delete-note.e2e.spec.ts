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

describe('DELETE /notes/:id', () => {
  it('should delete note', async () => {
    const createRes = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'To Delete' })

    const response = await supertest(app.server)
      .delete(`/notes/${createRes.body.note.id}`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(204)
  })
})
