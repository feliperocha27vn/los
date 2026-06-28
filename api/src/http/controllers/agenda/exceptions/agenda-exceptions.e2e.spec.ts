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

async function createRecurringEvent(): Promise<string> {
  const cal = await supertest(app.server)
    .post('/agenda/calendars')
    .set('Cookie', authCookie)
    .send({ name: 'C', color: '#3b82f6' })
  const create = await supertest(app.server)
    .post('/agenda/events')
    .set('Cookie', authCookie)
    .send({
      title: 'Weekly',
      calendarId: cal.body.calendar.id,
      startAt: new Date('2026-07-06T09:00:00Z').toISOString(),
      endAt: new Date('2026-07-06T10:00:00Z').toISOString(),
      recurrence: 'weekly',
      recurrenceCount: 5,
    })
  return create.body.event.id as string
}

describe('agenda exceptions e2e', () => {
  it('should create a cancel exception', async () => {
    const eventId = await createRecurringEvent()
    const res = await supertest(app.server)
      .post(`/agenda/events/${eventId}/exceptions`)
      .set('Cookie', authCookie)
      .send({ originalDate: '2026-07-13', action: 'cancel' })
    expect(res.status).toBe(201)
    expect(res.body.exception.action).toBe('cancel')
  })

  it('should create a reschedule exception', async () => {
    const eventId = await createRecurringEvent()
    const res = await supertest(app.server)
      .post(`/agenda/events/${eventId}/exceptions`)
      .set('Cookie', authCookie)
      .send({
        originalDate: '2026-07-13',
        action: 'reschedule',
        newStartsAt: new Date('2026-07-13T11:00:00Z').toISOString(),
        newEndsAt: new Date('2026-07-13T12:00:00Z').toISOString(),
      })
    expect(res.status).toBe(201)
  })

  it('should return 409 when exception already exists', async () => {
    const eventId = await createRecurringEvent()
    await supertest(app.server)
      .post(`/agenda/events/${eventId}/exceptions`)
      .set('Cookie', authCookie)
      .send({ originalDate: '2026-07-13', action: 'cancel' })
    const res = await supertest(app.server)
      .post(`/agenda/events/${eventId}/exceptions`)
      .set('Cookie', authCookie)
      .send({ originalDate: '2026-07-13', action: 'cancel' })
    expect(res.status).toBe(409)
  })

  it('should list exceptions', async () => {
    const eventId = await createRecurringEvent()
    await supertest(app.server)
      .post(`/agenda/events/${eventId}/exceptions`)
      .set('Cookie', authCookie)
      .send({ originalDate: '2026-07-13', action: 'cancel' })
    const res = await supertest(app.server)
      .get(`/agenda/events/${eventId}/exceptions`)
      .set('Cookie', authCookie)
    expect(res.status).toBe(200)
    expect(res.body.exceptions).toHaveLength(1)
  })
})
