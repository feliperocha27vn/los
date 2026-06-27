import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { hash } from '@node-rs/bcrypt'
import { createApp } from '../../../app'

export interface NotesE2ESetup {
  app: FastifyInstance
  authCookie: string
  otherAuthCookie: string
}

export async function setupNotesE2E(): Promise<NotesE2ESetup> {
  const usersRepository = new InMemoryUsersRepository()
  const notesRepository = new InMemoryNotesRepository()

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

  const app = createApp(usersRepository, undefined, notesRepository)
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

  return { app, authCookie, otherAuthCookie }
}
