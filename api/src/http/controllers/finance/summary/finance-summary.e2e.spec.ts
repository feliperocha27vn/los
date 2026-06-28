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

describe('finance summary e2e', () => {
  it('should return zero for empty month', async () => {
    const res = await supertest(app.server)
      .get('/finance/summary?month=2026-01')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.income).toBe(0)
    expect(res.body.expenses).toBe(0)
    expect(res.body.balance).toBe(0)
    expect(res.body.period).toEqual({ month: 1, year: 2026 })
  })

  it('should sum transactions of the requested month', async () => {
    await supertest(app.server).post('/finance/transactions').set('Cookie', authCookie).send({
      type: 'income',
      description: 'Salário',
      totalAmount: 5000,
      firstInstallmentDate: '2026-06-05',
    })

    await supertest(app.server).post('/finance/transactions').set('Cookie', authCookie).send({
      type: 'expense',
      description: 'Mercado',
      totalAmount: 200,
      firstInstallmentDate: '2026-06-10',
    })

    const res = await supertest(app.server)
      .get('/finance/summary?month=2026-06')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.income).toBe(5000)
    expect(res.body.expenses).toBe(200)
    expect(res.body.balance).toBe(4800)
  })

  it('should include launched credit card expenses in expenses', async () => {
    const cc = await supertest(app.server)
      .post('/finance/credit-card-expenses')
      .set('Cookie', authCookie)
      .send({ description: 'CC X', totalAmount: 100, myShareAmount: 50 })

    await supertest(app.server)
      .patch(`/finance/credit-card-expenses/${cc.body.expense.id}/launch`)
      .set('Cookie', authCookie)

    const today = new Date()
    const month = String(today.getUTCMonth() + 1).padStart(2, '0')
    const year = today.getUTCFullYear()

    const res = await supertest(app.server)
      .get(`/finance/summary?month=${year}-${month}`)
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.expenses).toBeGreaterThanOrEqual(50)
  })
})
