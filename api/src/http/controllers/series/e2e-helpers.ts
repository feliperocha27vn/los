import { InMemorySeriesRepository } from '@in-memory/in-memory-series-repository'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'
import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { createApp } from '../../../app'

export interface SeriesE2ESetup {
  app: FastifyInstance
  authCookie: string
  otherAuthCookie: string
  seriesRepository: InMemorySeriesRepository
}

export async function setupSeriesE2E(): Promise<SeriesE2ESetup> {
  const usersRepository = new InMemoryUsersRepository()
  const seriesRepository = new InMemorySeriesRepository()

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

  // createApp recebe os repositórios posicionalmente; series é o 13º.
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
    undefined,
    undefined,
    undefined,
    seriesRepository,
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
  const otherAuthCookie = otherCookies
    .find((c: string) => c.startsWith('token='))!
    .split(';')[0]

  return { app, authCookie, otherAuthCookie, seriesRepository }
}
