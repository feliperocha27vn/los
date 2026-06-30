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

  it('should list a 3-installment purchase with the per-month installment amount and date, not the total', async () => {
    const create = await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', authCookie)
      .send({
        type: 'expense',
        description: 'Geladeira',
        totalAmount: 300,
        installmentsCount: 3,
        firstInstallmentDate: '2026-06-10',
      })
    expect(create.status).toBe(201)

    const monthRanges = [
      { from: '2026-06-01', to: '2026-06-30', date: '2026-06-10' },
      { from: '2026-07-01', to: '2026-07-31', date: '2026-07-10' },
      { from: '2026-08-01', to: '2026-08-31', date: '2026-08-10' },
    ]

    for (const [index, range] of monthRanges.entries()) {
      const res = await supertest(app.server)
        .get('/finance/transactions')
        .query({ from: range.from, to: range.to })
        .set('Cookie', authCookie)

      expect(res.status).toBe(200)
      const row = res.body.transactions.find(
        (t: { description: string }) => t.description === 'Geladeira',
      )
      expect(row).toBeDefined()
      expect(row.totalAmount).toBe(100)
      expect(row.currentInstallment).toBe(index + 1)
      expect(row.installmentsCount).toBe(3)
      expect(row.date).toBe(range.date)
    }

    // Fora do período da compra, não deve aparecer nenhuma linha para ela.
    const outsideRange = await supertest(app.server)
      .get('/finance/transactions')
      .query({ from: '2026-09-01', to: '2026-09-30' })
      .set('Cookie', authCookie)
    expect(
      outsideRange.body.transactions.some(
        (t: { description: string }) => t.description === 'Geladeira',
      ),
    ).toBe(false)
  })

  it('should create a fixed expense with the full amount repeating monthly, not divided', async () => {
    const create = await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', authCookie)
      .send({
        type: 'expense',
        description: 'Aluguel',
        totalAmount: 1500,
        firstInstallmentDate: '2026-06-05',
        isFixed: true,
      })

    expect(create.status).toBe(201)
    expect(create.body.transaction.isFixed).toBe(true)
    expect(create.body.installments).toHaveLength(36)
    expect(create.body.installments.every((i: { amount: number }) => i.amount === 1500)).toBe(true)

    const farFutureMonth = await supertest(app.server)
      .get('/finance/transactions')
      .query({ from: '2027-06-01', to: '2027-06-30' })
      .set('Cookie', authCookie)
    const row = farFutureMonth.body.transactions.find(
      (t: { description: string }) => t.description === 'Aluguel',
    )
    expect(row).toBeDefined()
    expect(row.totalAmount).toBe(1500)
    expect(row.date).toBe('2027-06-05')
  })

  it('should generate future installments when an existing transaction is marked as fixed via edit', async () => {
    const create = await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', authCookie)
      .send({
        type: 'expense',
        description: 'Streaming',
        totalAmount: 40,
        firstInstallmentDate: '2026-06-15',
      })
    expect(create.body.installments).toHaveLength(1)
    const id = create.body.transaction.id

    const update = await supertest(app.server)
      .put(`/finance/transactions/${id}`)
      .set('Cookie', authCookie)
      .send({ isFixed: true })
    expect(update.status).toBe(200)
    expect(update.body.transaction.isFixed).toBe(true)

    const nextMonth = await supertest(app.server)
      .get('/finance/transactions')
      .query({ from: '2026-07-01', to: '2026-07-31' })
      .set('Cookie', authCookie)
    const row = nextMonth.body.transactions.find(
      (t: { description: string }) => t.description === 'Streaming',
    )
    expect(row).toBeDefined()
    expect(row.totalAmount).toBe(40)
    expect(row.date).toBe('2026-07-15')
  })

  it('should stop future occurrences when a fixed expense is unmarked', async () => {
    const create = await supertest(app.server)
      .post('/finance/transactions')
      .set('Cookie', authCookie)
      .send({
        type: 'expense',
        description: 'Academia',
        totalAmount: 90,
        firstInstallmentDate: '2026-06-20',
        isFixed: true,
      })
    const id = create.body.transaction.id

    const unfix = await supertest(app.server)
      .put(`/finance/transactions/${id}`)
      .set('Cookie', authCookie)
      .send({ isFixed: false })
    expect(unfix.status).toBe(200)
    expect(unfix.body.transaction.isFixed).toBe(false)

    const detail = await supertest(app.server)
      .get(`/finance/transactions/${id}`)
      .set('Cookie', authCookie)
    const today = new Date().toISOString().slice(0, 10)
    expect(
      detail.body.installments.every((i: { date: string }) => i.date <= today),
    ).toBe(true)
  })
})
