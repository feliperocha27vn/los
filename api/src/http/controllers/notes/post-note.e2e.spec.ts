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

describe('POST /notes', () => {
  it('should create a note', async () => {
    const response = await supertest(app.server)
      .post('/notes')
      .set('Cookie', authCookie)
      .send({ title: 'My Note' })

    expect(response.status).toBe(201)
    expect(response.body.note.title).toBe('My Note')
    expect(response.body.note.content).toBe('')
    expect(response.body.note.id).toBeDefined()
  })

  it('should return 401 without auth', async () => {
    const response = await supertest(app.server)
      .post('/notes')
      .send({ title: 'X' })

    expect(response.status).toBe(401)
  })
})
