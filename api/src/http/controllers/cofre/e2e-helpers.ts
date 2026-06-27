import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'

export interface CofreE2ESetup {
  app: FastifyInstance
  usersRepository: InMemoryUsersRepository
  cofreEntriesRepository: InMemoryCofreEntriesRepository
  authCookie: string
  getCofreCookie: () => string
  setCofreCookie: (value: string) => void
  bothCookies: () => string
}

export async function setupCofreE2E(): Promise<CofreE2ESetup> {
  const usersRepository = new InMemoryUsersRepository()
  const cofreEntriesRepository = new InMemoryCofreEntriesRepository()

  await usersRepository.create({
    id: 'user-1',
    name: 'Admin',
    email: 'admin@lifeos.com',
    passwordHash: await hash('12345678'),
  })

  const user = await usersRepository.findById('user-1')
  if (!user) throw new Error('user not found')
  user.pinHash = await hash('123456')

  const app = createApp(usersRepository, cofreEntriesRepository)
  await app.ready()

  const loginRes = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'admin@lifeos.com', password: '12345678' })

  const cookies = loginRes.headers['set-cookie'] as string[]
  const authCookie = cookies.find((c: string) => c.startsWith('token='))!.split(';')[0]

  let cofreCookie = ''

  return {
    app,
    usersRepository,
    cofreEntriesRepository,
    authCookie,
    getCofreCookie: () => cofreCookie,
    setCofreCookie: (value) => {
      cofreCookie = value
    },
    bothCookies: () => `${authCookie}; ${cofreCookie}`,
  }
}
