import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { hash } from '@node-rs/bcrypt'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { InMemoryAgendaCalendarsRepository } from '@in-memory/in-memory-agenda-calendars-repository'
import { InMemoryAgendaEventsRepository } from '@in-memory/in-memory-agenda-events-repository'
import { InMemoryAgendaEventExceptionsRepository } from '@in-memory/in-memory-agenda-event-exceptions-repository'
import { InMemoryAgendaTelegramLinksRepository } from '@in-memory/in-memory-agenda-telegram-links-repository'
import { InMemoryUserPreferencesRepository } from '@in-memory/in-memory-user-preferences-repository'
import { createApp } from '../../../app'

export interface AgendaE2ESetup {
  app: FastifyInstance
  authCookie: string
  otherAuthCookie: string
}

export async function setupAgendaE2E(): Promise<AgendaE2ESetup> {
  const usersRepository = new InMemoryUsersRepository()
  const agendaCalendarsRepository = new InMemoryAgendaCalendarsRepository()
  const agendaEventsRepository = new InMemoryAgendaEventsRepository()
  const agendaEventExceptionsRepository =
    new InMemoryAgendaEventExceptionsRepository()
  const agendaTelegramLinksRepository = new InMemoryAgendaTelegramLinksRepository()
  const userPreferencesRepository = new InMemoryUserPreferencesRepository()

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
    undefined,
    undefined,
    undefined,
    agendaCalendarsRepository,
    agendaEventsRepository,
    agendaEventExceptionsRepository,
    agendaTelegramLinksRepository,
    userPreferencesRepository,
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

  return { app, authCookie, otherAuthCookie }
}
