import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { setupFinanceE2E } from '../e2e-helpers'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string

beforeAll(async () => {
  const ctx = await setupFinanceE2E()
  app = ctx.app
  authCookie = ctx.authCookie
  otherAuthCookie = ctx.otherAuthCookie
})

afterAll(async () => {
  await app.close()
})

describe('finance transactions e2e', () => {
  it('should create a single-installment expense', async () => {
    const res = await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', authCookie)
      .send({
        type: 'expense',
        description: 'Mercado',
        totalAmount: 150.5,
        categoryId: 'cat-alimentacao',
      })

    expect(res.status).toBe(201)
    expect(res.body.transaction.description).toBe('Mercado')
    expect(res.body.transaction.totalAmount).toBe(150.5)
    expect(res.body.transaction.source).toBe('principal')
    expect(res.body.transaction.category.id).toBe('cat-alimentacao')
    expect(res.body.installments).toHaveLength(1)
  })

  it('should create a 3-installment purchase with monthly dates', async () => {
    const res = await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', authCookie)
      .send({
        type: 'expense',
        description: 'Notebook',
        totalAmount: 300,
        installmentsCount: 3,
        firstInstallmentDate: '2026-06-10',
      })

    expect(res.status).toBe(201)
    expect(res.body.installments).toHaveLength(3)
    expect(res.body.installments[0].date).toBe('2026-06-10')
    expect(res.body.installments[1].date).toBe('2026-07-10')
    expect(res.body.installments[2].date).toBe('2026-08-10')
  })

  it('should list transactions of the user only', async () => {
    await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', otherAuthCookie)
      .send({ type: 'income', description: 'Other income', totalAmount: 999 })

    const res = await supertest(app.server).get('/finance/transactions').set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(
      res.body.transactions.every((t: { description: string }) => t.description !== 'Other income'),
    ).toBe(true)
  })

  it('should return 404 when categoryId does not exist', async () => {
    const res = await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', authCookie)
      .send({
        type: 'expense',
        description: 'X',
        totalAmount: 10,
        categoryId: 'non-existent',
      })

    expect(res.status).toBe(404)
  })

  it('should return 401 without auth', async () => {
    const res = await supertest(app.server).get('/finance/transactions')
    expect(res.status).toBe(401)
  })
})
