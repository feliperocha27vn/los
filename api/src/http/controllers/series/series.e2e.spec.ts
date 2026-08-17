import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { FastifyInstance } from 'fastify'
import supertest from 'supertest'
import { setupSeriesE2E } from './e2e-helpers'

let app: FastifyInstance
let authCookie: string
let otherAuthCookie: string

async function createSeries(body: Record<string, unknown>) {
  const response = await supertest(app.server)
    .post('/series')
    .set('Cookie', authCookie)
    .send(body)
  return response
}

beforeAll(async () => {
  const setup = await setupSeriesE2E()
  app = setup.app
  authCookie = setup.authCookie
  otherAuthCookie = setup.otherAuthCookie
})

afterAll(async () => {
  await app.close()
})

describe('POST /series', () => {
  it('should create a series with the marcador at T1E1', async () => {
    const response = await createSeries({ name: 'Breaking Bad' })

    expect(response.status).toBe(201)
    expect(response.body.series.name).toBe('Breaking Bad')
    expect(response.body.series.state).toBe('watching')
    expect(response.body.series.season).toBe(1)
    expect(response.body.series.episode).toBe(1)
    expect(response.body.series.positionSeconds).toBe(0)
  })

  it('should accept an explicit marcador', async () => {
    const response = await createSeries({
      name: 'The Office',
      season: 3,
      episode: 7,
      positionSeconds: 1440,
    })

    expect(response.status).toBe(201)
    expect(response.body.series.season).toBe(3)
    expect(response.body.series.episode).toBe(7)
    expect(response.body.series.positionSeconds).toBe(1440)
  })

  it('should reject a minutagem of 24h or more', async () => {
    const response = await createSeries({ name: 'Too long', positionSeconds: 86_400 })
    expect(response.status).toBe(400)
  })

  it('should reject season zero', async () => {
    const response = await createSeries({ name: 'Zero', season: 0 })
    expect(response.status).toBe(400)
  })

  it('should return 401 without auth', async () => {
    const response = await supertest(app.server).post('/series').send({ name: 'X' })
    expect(response.status).toBe(401)
  })
})

describe('GET /series', () => {
  it('should list the user series', async () => {
    const response = await supertest(app.server)
      .get('/series')
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(Array.isArray(response.body.series)).toBe(true)
  })

  it('should filter by state', async () => {
    const created = await createSeries({ name: 'To pause' })
    await supertest(app.server)
      .put(`/series/${created.body.series.id}`)
      .set('Cookie', authCookie)
      .send({ state: 'paused' })

    const response = await supertest(app.server)
      .get('/series')
      .query({ state: 'paused' })
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.series.every((s: { state: string }) => s.state === 'paused')).toBe(true)
    expect(response.body.series.some((s: { name: string }) => s.name === 'To pause')).toBe(true)
  })

  it('should reject an unknown state', async () => {
    const response = await supertest(app.server)
      .get('/series')
      .query({ state: 'dropped' })
      .set('Cookie', authCookie)

    expect(response.status).toBe(400)
  })

  it('should not leak series from another user', async () => {
    await createSeries({ name: 'Private' })
    const response = await supertest(app.server)
      .get('/series')
      .set('Cookie', otherAuthCookie)

    expect(response.body.series).toEqual([])
  })
})

describe('GET /series/:id', () => {
  it('should return the series detail', async () => {
    const created = await createSeries({ name: 'Severance', season: 2, episode: 4 })
    const response = await supertest(app.server)
      .get(`/series/${created.body.series.id}`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.series.name).toBe('Severance')
    expect(response.body.series.season).toBe(2)
  })

  it('should return 404 for a nonexistent series', async () => {
    const response = await supertest(app.server)
      .get('/series/nonexistent')
      .set('Cookie', authCookie)
    expect(response.status).toBe(404)
  })

  it('should return 404 for another user', async () => {
    const created = await createSeries({ name: 'Mine' })
    const response = await supertest(app.server)
      .get(`/series/${created.body.series.id}`)
      .set('Cookie', otherAuthCookie)
    expect(response.status).toBe(404)
  })
})

describe('PUT /series/:id', () => {
  it('should move the marcador to an arbitrary point', async () => {
    const created = await createSeries({ name: 'Dark' })
    const response = await supertest(app.server)
      .put(`/series/${created.body.series.id}`)
      .set('Cookie', authCookie)
      .send({ season: 2, episode: 5, positionSeconds: 300 })

    expect(response.status).toBe(200)
    expect(response.body.series.season).toBe(2)
    expect(response.body.series.episode).toBe(5)
    expect(response.body.series.positionSeconds).toBe(300)
  })

  it('should mark a series as finished', async () => {
    const created = await createSeries({ name: 'Chernobyl' })
    const response = await supertest(app.server)
      .put(`/series/${created.body.series.id}`)
      .set('Cookie', authCookie)
      .send({ state: 'finished' })

    expect(response.status).toBe(200)
    expect(response.body.series.state).toBe('finished')
  })

  it('should return 404 for another user', async () => {
    const created = await createSeries({ name: 'Protected' })
    const response = await supertest(app.server)
      .put(`/series/${created.body.series.id}`)
      .set('Cookie', otherAuthCookie)
      .send({ name: 'Hacked' })

    expect(response.status).toBe(404)
  })
})

describe('PATCH /series/:id/advance', () => {
  it('should advance to the next episode with an empty body', async () => {
    const created = await createSeries({
      name: 'Advance me',
      season: 3,
      episode: 7,
      positionSeconds: 1440,
    })
    const response = await supertest(app.server)
      .patch(`/series/${created.body.series.id}/advance`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.series.season).toBe(3)
    expect(response.body.series.episode).toBe(8)
    expect(response.body.series.positionSeconds).toBe(0)
  })

  it('should jump to the first episode of the next season', async () => {
    const created = await createSeries({ name: 'Season end', season: 1, episode: 13 })
    const response = await supertest(app.server)
      .patch(`/series/${created.body.series.id}/advance`)
      .set('Cookie', authCookie)
      .send({ nextSeason: true })

    expect(response.status).toBe(200)
    expect(response.body.series.season).toBe(2)
    expect(response.body.series.episode).toBe(1)
  })

  it('should bring a paused series back to watching', async () => {
    const created = await createSeries({ name: 'Resumed' })
    await supertest(app.server)
      .put(`/series/${created.body.series.id}`)
      .set('Cookie', authCookie)
      .send({ state: 'paused' })

    const response = await supertest(app.server)
      .patch(`/series/${created.body.series.id}/advance`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(200)
    expect(response.body.series.state).toBe('watching')
  })

  it('should return 404 for another user', async () => {
    const created = await createSeries({ name: 'No touching' })
    const response = await supertest(app.server)
      .patch(`/series/${created.body.series.id}/advance`)
      .set('Cookie', otherAuthCookie)

    expect(response.status).toBe(404)
  })
})

describe('DELETE /series/:id', () => {
  it('should delete the series', async () => {
    const created = await createSeries({ name: 'Delete me' })
    const response = await supertest(app.server)
      .delete(`/series/${created.body.series.id}`)
      .set('Cookie', authCookie)

    expect(response.status).toBe(204)
  })

  it('should return 404 for another user', async () => {
    const created = await createSeries({ name: 'Keep me' })
    const response = await supertest(app.server)
      .delete(`/series/${created.body.series.id}`)
      .set('Cookie', otherAuthCookie)

    expect(response.status).toBe(404)
  })
})
