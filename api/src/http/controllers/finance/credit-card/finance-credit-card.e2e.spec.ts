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

describe('finance credit card e2e', () => {
  it('should create expense with default 50% my share', async () => {
    const res = await supertest(app.server)
      .post('/finance/credit-card-expenses')
      .set('Cookie', authCookie)
      .send({ description: 'Supermercado', totalAmount: 200 })

    expect(res.status).toBe(201)
    expect(res.body.expense.myShareAmount).toBe(100)
    expect(res.body.expense.launchedInMain).toBe(false)
  })

  it('should list expenses of the current month by default', async () => {
    const res = await supertest(app.server)
      .get('/finance/credit-card-expenses')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.expenses)).toBe(true)
  })

  it('should launch creating a principal transaction', async () => {
    const create = await supertest(app.server)
      .post('/finance/credit-card-expenses')
      .set('Cookie', authCookie)
      .send({
        description: 'Restaurante',
        totalAmount: 80,
        myShareAmount: 40,
        date: '2026-06-27',
        categoryId: 'cat-alimentacao',
      })

    const launch = await supertest(app.server)
      .patch(`/finance/credit-card-expenses/${create.body.expense.id}/launch`)
      .set('Cookie', authCookie)

    expect(launch.status).toBe(200)
    expect(launch.body.expense.launchedInMain).toBe(true)
    expect(launch.body.transaction.description).toBe('Minha parte do cartão')
    expect(launch.body.transaction.totalAmount).toBe(40)
    expect(launch.body.transaction.source).toBe('credit_card')
    expect(launch.body.transaction.category.id).toBe('cat-alimentacao')
  })

  it('should return 409 when launching twice', async () => {
    const create = await supertest(app.server)
      .post('/finance/credit-card-expenses')
      .set('Cookie', authCookie)
      .send({ description: 'X', totalAmount: 50 })

    await supertest(app.server)
      .patch(`/finance/credit-card-expenses/${create.body.expense.id}/launch`)
      .set('Cookie', authCookie)

    const res = await supertest(app.server)
      .patch(`/finance/credit-card-expenses/${create.body.expense.id}/launch`)
      .set('Cookie', authCookie)

    expect(res.status).toBe(409)
  })

  it('should unlaunch and delete the linked transaction', async () => {
    const create = await supertest(app.server)
      .post('/finance/credit-card-expenses')
      .set('Cookie', authCookie)
      .send({ description: 'X', totalAmount: 50 })

    const launch = await supertest(app.server)
      .patch(`/finance/credit-card-expenses/${create.body.expense.id}/launch`)
      .set('Cookie', authCookie)
    const linkedTransactionId = launch.body.transaction.id

    const unlaunch = await supertest(app.server)
      .patch(`/finance/credit-card-expenses/${create.body.expense.id}/unlaunch`)
      .set('Cookie', authCookie)

    expect(unlaunch.status).toBe(200)
    expect(unlaunch.body.expense.launchedInMain).toBe(false)
    expect(unlaunch.body.expense.linkedTransactionId).toBeNull()

    const txRes = await supertest(app.server)
      .get(`/finance/transactions/${linkedTransactionId}`)
      .set('Cookie', authCookie)
    expect(txRes.status).toBe(404)
  })
})
