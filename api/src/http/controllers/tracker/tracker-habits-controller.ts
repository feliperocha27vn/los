import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import z from 'zod'
import { CreateTrackerHabitUseCase } from '@use-cases/tracker-habits/create-tracker-habit'
import { FetchTrackerHabitsUseCase } from '@use-cases/tracker-habits/fetch-tracker-habits'
import { GetTrackerHabitDetailUseCase } from '@use-cases/tracker-habits/get-tracker-habit-detail'
import { UpdateTrackerHabitUseCase } from '@use-cases/tracker-habits/update-tracker-habit'
import { ReorderTrackerHabitUseCase } from '@use-cases/tracker-habits/reorder-tracker-habit'
import { ArchiveTrackerHabitUseCase } from '@use-cases/tracker-habits/archive-tracker-habit'
import { RestoreTrackerHabitUseCase } from '@use-cases/tracker-habits/restore-tracker-habit'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'

const habitResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string(),
  position: z.number(),
  archived: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function toResponse(record: {
  id: string
  name: string
  icon: string
  position: string
  archived: boolean
  createdAt: Date
  updatedAt: Date
}) {
  return {
    id: record.id,
    name: record.name,
    icon: record.icon,
    position: Number(record.position),
    archived: record.archived,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  }
}

export function makeTrackerHabitsController(
  trackerHabitsRepository: TrackerHabitsRepository
): FastifyPluginAsyncZod {
  return async (app) => {
    app.get('/tracker/habits', {
      schema: {
        tags: ['TrackerHabits'],
        summary: 'List tracker habits',
        querystring: z.object({ includeArchived: z.coerce.boolean().optional() }),
        response: { 200: z.object({ habits: habitResponseSchema.array() }) },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { includeArchived } = request.query
      const useCase = new FetchTrackerHabitsUseCase(trackerHabitsRepository)
      const { habits } = await useCase.execute({ userId, includeArchived })
      return reply.status(200).send({ habits: habits.map(toResponse) })
    })

    app.post('/tracker/habits', {
      schema: {
        tags: ['TrackerHabits'],
        summary: 'Create tracker habit',
        body: z.object({
          name: z.string().min(1).max(50),
          icon: z.string().min(1).max(50),
        }),
        response: {
          201: z.object({ habit: habitResponseSchema }),
          400: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      const { sub: userId } = request.user as { sub: string }
      const { name, icon } = request.body
      const useCase = new CreateTrackerHabitUseCase(trackerHabitsRepository)
      try {
        const { habit } = await useCase.execute({ userId, name, icon })
        return reply.status(201).send({ habit: toResponse(habit) })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro'
        return reply.status(400).send({ message })
      }
    })

    app.get('/tracker/habits/:id', {
      schema: {
        tags: ['TrackerHabits'],
        summary: 'Get tracker habit detail',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({ habit: habitResponseSchema }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new GetTrackerHabitDetailUseCase(trackerHabitsRepository)
        const { habit } = await useCase.execute({ habitId: id, userId })
        return reply.status(200).send({ habit: toResponse(habit) })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.put('/tracker/habits/:id', {
      schema: {
        tags: ['TrackerHabits'],
        summary: 'Update tracker habit',
        params: z.object({ id: z.string() }),
        body: z.object({
          name: z.string().min(1).max(50).optional(),
          icon: z.string().min(1).max(50).optional(),
        }),
        response: {
          200: z.object({
            habit: z.object({
              id: z.string(),
              name: z.string(),
              icon: z.string(),
              updatedAt: z.string(),
            }),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { name, icon } = request.body
        const useCase = new UpdateTrackerHabitUseCase(trackerHabitsRepository)
        const { habit } = await useCase.execute({ habitId: id, userId, name, icon })
        return reply.status(200).send({
          habit: { id: habit.id, name: habit.name, icon: habit.icon, updatedAt: habit.updatedAt.toISOString() },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.patch('/tracker/habits/:id/reorder', {
      schema: {
        tags: ['TrackerHabits'],
        summary: 'Reorder tracker habit',
        params: z.object({ id: z.string() }),
        body: z.object({ position: z.number().positive() }),
        response: {
          200: z.object({
            habit: z.object({
              id: z.string(),
              position: z.number(),
              updatedAt: z.string(),
            }),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const { position } = request.body
        const useCase = new ReorderTrackerHabitUseCase(trackerHabitsRepository)
        const { habit } = await useCase.execute({ habitId: id, userId, position })
        return reply.status(200).send({
          habit: { id: habit.id, position: Number(habit.position), updatedAt: habit.updatedAt.toISOString() },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.delete('/tracker/habits/:id', {
      schema: {
        tags: ['TrackerHabits'],
        summary: 'Archive tracker habit (soft delete)',
        params: z.object({ id: z.string() }),
        response: {
          204: z.void(),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new ArchiveTrackerHabitUseCase(trackerHabitsRepository)
        await useCase.execute({ habitId: id, userId })
        return reply.status(204).send()
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })

    app.patch('/tracker/habits/:id/restore', {
      schema: {
        tags: ['TrackerHabits'],
        summary: 'Restore archived tracker habit',
        params: z.object({ id: z.string() }),
        response: {
          200: z.object({
            habit: z.object({
              id: z.string(),
              name: z.string(),
              icon: z.string(),
              archived: z.boolean(),
              updatedAt: z.string(),
            }),
          }),
          404: z.object({ message: z.string() }),
        },
      },
    }, async (request, reply) => {
      try {
        const { sub: userId } = request.user as { sub: string }
        const { id } = request.params
        const useCase = new RestoreTrackerHabitUseCase(trackerHabitsRepository)
        const { habit } = await useCase.execute({ habitId: id, userId })
        return reply.status(200).send({
          habit: {
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            archived: habit.archived,
            updatedAt: habit.updatedAt.toISOString(),
          },
        })
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message })
        }
        throw error
      }
    })
  }
}
