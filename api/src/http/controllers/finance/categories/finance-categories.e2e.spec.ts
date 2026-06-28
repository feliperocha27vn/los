import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupFinanceE2E } from '../e2e-helpers'

let app: FastifyInstance
let authCookie: string

beforeAll(async () => {
  const ctx = await setupFinanceE2E()
  app = ctx.app
  authCookie = ctx.authCookie
})

afterAll(async () => {
  await app.close()
})

describe('GET /finance/categories', () => {
  it('should list seed categories', async () => {
    const res = await supertest(app.server).get('/finance/categories').set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.categories.length).toBeGreaterThanOrEqual(2)
  })

  it('should filter by type', async () => {
    const res = await supertest(app.server)
      .get('/finance/categories?type=income')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.categories.every((c: { type: string }) => c.type === 'income')).toBe(true)
  })
})
