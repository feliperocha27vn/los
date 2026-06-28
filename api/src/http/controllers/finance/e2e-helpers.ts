import { InMemoryFinanceCategoriesRepository } from '@in-memory/in-memory-finance-categories-repository'
import { InMemoryFinanceCreditCardExpensesRepository } from '@in-memory/in-memory-finance-credit-card-expenses-repository'
import { InMemoryFinanceTransactionsRepository } from '@in-memory/in-memory-finance-transactions-repository'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'
import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { createApp } from '../../../app'

export interface FinanceE2ESetup {
  app: FastifyInstance
  authCookie: string
  otherAuthCookie: string
  financeCategoriesRepository: InMemoryFinanceCategoriesRepository
  financeTransactionsRepository: InMemoryFinanceTransactionsRepository
  financeCreditCardExpensesRepository: InMemoryFinanceCreditCardExpensesRepository
}

export async function setupFinanceE2E(): Promise<FinanceE2ESetup> {
  const usersRepository = new InMemoryUsersRepository()
  const financeCategoriesRepository = new InMemoryFinanceCategoriesRepository()
  const financeTransactionsRepository = new InMemoryFinanceTransactionsRepository()
  const financeCreditCardExpensesRepository = new InMemoryFinanceCreditCardExpensesRepository()

  await financeCategoriesRepository.createMany([
    {
      id: 'cat-alimentacao',
      name: 'Alimentação',
      type: 'expense',
      color: '#ef4444',
    },
    { id: 'cat-salario', name: 'Salário', type: 'income', color: '#22c55e' },
  ])

  await usersRepository.create({
    id: 'user-1',
    name: 'Admin',
    email: 'admin@lifeos.com',
    passwordHash: await hash('12345678'),
  })
  await usersRepository.create({
    id: 'user-2',
    name: 'Other',
    email: 'other@lifeos.com',
    passwordHash: await hash('12345678'),
  })

  const app = createApp(
    usersRepository,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
    financeCategoriesRepository,
    financeTransactionsRepository,
    financeCreditCardExpensesRepository,
  )
  await app.ready()

  const loginRes = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'admin@lifeos.com', password: '12345678' })
  const cookies = loginRes.headers['set-cookie'] as string[]
  const authCookie = cookies.find((c: string) => c.startsWith('token='))!.split(';')[0]

  const otherLogin = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'other@lifeos.com', password: '12345678' })
  const otherCookies = otherLogin.headers['set-cookie'] as string[]
  const otherAuthCookie = otherCookies.find((c: string) => c.startsWith('token='))!.split(';')[0]

  return {
    app,
    authCookie,
    otherAuthCookie,
    financeCategoriesRepository,
    financeTransactionsRepository,
    financeCreditCardExpensesRepository,
  }
}
