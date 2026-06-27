import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'

export interface AuthE2ESetup {
  app: FastifyInstance
  usersRepository: InMemoryUsersRepository
  authCookie: string
}

export async function setupAuthE2E(): Promise<AuthE2ESetup> {
  const usersRepository = new InMemoryUsersRepository()

  await usersRepository.create({
    id: 'user-1',
    name: 'Sofia Davis',
    email: 'sofia@lifeos.com',
    passwordHash: await hash('12345678'),
  })

  const app = createApp(usersRepository)
  await app.ready()

  const loginRes = await supertest(app.server)
    .post('/auth/login')
    .send({ email: 'sofia@lifeos.com', password: '12345678' })
  const cookies = loginRes.headers['set-cookie'] as string[]
  const authCookie = cookies.find((c: string) => c.startsWith('token='))!.split(';')[0]

  return { app, usersRepository, authCookie }
}
