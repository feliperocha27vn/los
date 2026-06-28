import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { setupAgendaE2E } from '../e2e-helpers'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string

beforeAll(async () => {
  const ctx = await setupAgendaE2E()
  app = ctx.app
  authCookie = ctx.authCookie
  otherAuthCookie = ctx.otherAuthCookie
})

afterAll(async () => {
  await app.close()
})

describe('agenda calendars e2e', () => {
  it('should create a calendar', async () => {
    const res = await supertest(app.server)
      .post('/agenda/calendars')
      .set('Cookie', authCookie)
      .send({ name: 'Trabalho', color: '#3b82f6' })

    expect(res.status).toBe(201)
    expect(res.body.calendar.name).toBe('Trabalho')
    expect(res.body.calendar.color).toBe('#3b82f6')
  })

  it('should list calendars of the user only', async () => {
    const create = await supertest(app.server)
      .post('/agenda/calendars')
      .set('Cookie', authCookie)
      .send({ name: 'Pessoal', color: '#10b981' })

    const res = await supertest(app.server)
      .get('/agenda/calendars')
      .set('Cookie', authCookie)

    expect(res.status).toBe(200)
    expect(res.body.calendars.length).toBeGreaterThanOrEqual(1)
    expect(res.body.calendars.some((c: { id: string }) => c.id === create.body.calendar.id)).toBe(true)
  })

  it('should not list calendars of another user', async () => {
    const create = await supertest(app.server)
      .post('/agenda/calendars')
      .set('Cookie', authCookie)
      .send({ name: 'X', color: '#000000' })

    const res = await supertest(app.server)
      .get('/agenda/calendars')
      .set('Cookie', otherAuthCookie)

    expect(res.status).toBe(200)
    expect(
      res.body.calendars.every((c: { id: string }) => c.id !== create.body.calendar.id),
    ).toBe(true)
  })

  it('should update a calendar', async () => {
    const create = await supertest(app.server)
      .post('/agenda/calendars')
      .set('Cookie', authCookie)
      .send({ name: 'Old', color: '#000000' })

    const res = await supertest(app.server)
      .put(`/agenda/calendars/${create.body.calendar.id}`)
      .set('Cookie', authCookie)
      .send({ name: 'New' })

    expect(res.status).toBe(200)
    expect(res.body.calendar.name).toBe('New')
  })

  it('should delete a calendar (cascade events)', async () => {
    const create = await supertest(app.server)
      .post('/agenda/calendars')
      .set('Cookie', authCookie)
      .send({ name: 'ToDelete', color: '#000000' })

    await supertest(app.server)
      .post('/agenda/events')
      .set('Cookie', authCookie)
      .send({
        title: 'X',
        calendarId: create.body.calendar.id,
        startAt: new Date('2026-07-15T09:00:00Z').toISOString(),
        endAt: new Date('2026-07-15T10:00:00Z').toISOString(),
      })

    const del = await supertest(app.server)
      .delete(`/agenda/calendars/${create.body.calendar.id}`)
      .set('Cookie', authCookie)

    expect(del.status).toBe(204)
  })

  it('should return 401 without auth', async () => {
    const res = await supertest(app.server).get('/agenda/calendars')
    expect(res.status).toBe(401)
  })
})
