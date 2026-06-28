import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import supertest from 'supertest'
import type { FastifyInstance } from 'fastify'
import { setupAgendaE2E } from '../e2e-helpers'

let app: FastifyInstance
let authCookie: string

beforeAll(async () => {
  const ctx = await setupAgendaE2E()
  app = ctx.app
  authCookie = ctx.authCookie
})

afterAll(async () => {
  await app.close()
})

async function createCalendar(): Promise<string> {
  const res = await supertest(app.server)
    .post('/agenda/calendars')
    .set('Cookie', authCookie)
    .send({ name: 'C', color: '#3b82f6' })
  return res.body.calendar.id
}

describe('agenda events e2e', () => {
  it('should create a single event', async () => {
    const calendarId = await createCalendar()
    const res = await supertest(app.server)
      .post('/agenda/events')
      .set('Cookie', authCookie)
      .send({
        title: 'Daily Standup',
        calendarId,
        startAt: new Date('2026-07-15T09:00:00Z').toISOString(),
        endAt: new Date('2026-07-15T09:30:00Z').toISOString(),
      })
    expect(res.status).toBe(201)
    expect(res.body.event.title).toBe('Daily Standup')
    expect(res.body.event.status).toBe('scheduled')
  })

  it('should create a recurring weekly event', async () => {
    const calendarId = await createCalendar()
    const res = await supertest(app.server)
      .post('/agenda/events')
      .set('Cookie', authCookie)
      .send({
        title: 'Weekly Sync',
        calendarId,
        startAt: new Date('2026-07-15T10:00:00Z').toISOString(),
        endAt: new Date('2026-07-15T11:00:00Z').toISOString(),
        recurrence: 'weekly',
        recurrenceCount: 5,
      })
    expect(res.status).toBe(201)
    expect(res.body.event.recurrence).toBe('weekly')
  })

  it('should list events with expansion', async () => {
    const calendarId = await createCalendar()
    await supertest(app.server)
      .post('/agenda/events')
      .set('Cookie', authCookie)
      .send({
        title: 'Daily',
        calendarId,
        startAt: new Date('2026-07-15T09:00:00Z').toISOString(),
        endAt: new Date('2026-07-15T10:00:00Z').toISOString(),
        recurrence: 'weekly',
        recurrenceCount: 4,
      })
    const res = await supertest(app.server)
      .get('/agenda/events?from=2026-07-01T00:00:00Z&to=2026-08-31T23:59:59Z')
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.events.length).toBeGreaterThanOrEqual(4)
  })

  it('should update event status', async () => {
    const calendarId = await createCalendar()
    const create = await supertest(app.server)
      .post('/agenda/events')
      .set('Cookie', authCookie)
      .send({
        title: 'X',
        calendarId,
        startAt: new Date('2026-07-15T09:00:00Z').toISOString(),
        endAt: new Date('2026-07-15T10:00:00Z').toISOString(),
      })
    const res = await supertest(app.server)
      .patch(`/agenda/events/${create.body.event.id}/status`)
      .set('Cookie', authCookie)
      .send({ status: 'done' })
    expect(res.status).toBe(200)
    expect(res.body.event.status).toBe('done')
  })

  it('should delete an event', async () => {
    const calendarId = await createCalendar()
    const create = await supertest(app.server)
      .post('/agenda/events')
      .set('Cookie', authCookie)
      .send({
        title: 'X',
        calendarId,
        startAt: new Date('2026-07-15T09:00:00Z').toISOString(),
        endAt: new Date('2026-07-15T10:00:00Z').toISOString(),
      })
    const res = await supertest(app.server)
      .delete(`/agenda/events/${create.body.event.id}`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(204)
  })

  it('should return 404 for non-existent event', async () => {
    const res = await supertest(app.server)
      .get('/agenda/events/non-existent')
      .set('Cookie', authCookie)
    expect(res.status).toBe(404)
  })
})
