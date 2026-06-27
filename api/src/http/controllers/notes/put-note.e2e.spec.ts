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

describe('PUT /notes/:id', () => {
  it('should update note', async () => {
    const createRes = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'Old' })

    const response = await supertest(app.server)
      .put(`/notes/${createRes.body.note.id}`)
      .set('Cookie', authCookie)
      .send({ title: 'New', content: 'Updated content' })

    expect(response.status).toBe(200)
    expect(response.body.note.title).toBe('New')
    expect(response.body.note.content).toBe('Updated content')
  })
})
