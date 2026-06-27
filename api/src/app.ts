import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import { controllers } from '@http/controllers'
import type { UsersRepository } from '@repositories/users-repository'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'
import type { NotesRepository } from '@repositories/notes-repository'
import type { TasksRepository } from '@repositories/tasks-repository'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import ScalarApiReference from '@scalar/fastify-api-reference'
import fastify from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from 'fastify-type-provider-zod'
import { env } from './env'

export function createApp(
  usersRepository: UsersRepository,
  cofreEntriesRepository?: CofreEntriesRepository,
  notesRepository?: NotesRepository,
  tasksRepository?: TasksRepository,
  studyCoursesRepository?: StudyCoursesRepository,
  studyModulesRepository?: StudyModulesRepository,
  studyPagesRepository?: StudyPagesRepository,
  trackerHabitsRepository?: TrackerHabitsRepository,
  trackerRecordsRepository?: TrackerRecordsRepository
) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setSerializerCompiler(serializerCompiler)
  app.setValidatorCompiler(validatorCompiler)

  app.register(fastifyCors, {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    credentials: true,
  })

  app.register(fastifyCookie)

  app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
  })

  app.addHook('preHandler', async (request, reply) => {
    if (request.routeOptions.config?.public) {
      return
    }

    if (request.url.startsWith('/docs')) {
      return
    }

    const token = request.cookies?.token

    if (!token) {
      return reply.status(401).send({ message: 'Não autorizado' })
    }

    try {
      const payload = app.jwt.verify(token)
      request.user = payload
    } catch {
      return reply.status(401).send({ message: 'Não autorizado' })
    }
  })

  app.register(fastifySwagger, {
    openapi: {
      info: {
        title: 'API Documentation',
        version: '1.0.0',
      },
    },
    transform: jsonSchemaTransform,
  })

  app.register(ScalarApiReference, {
    routePrefix: '/docs',
  })

  app.get('/health', {
    config: { public: true },
  }, async () => {
    return { status: 'ok', timestamp: new Date().toISOString() }
  })

  app.register(controllers({
    usersRepository,
    cofreEntriesRepository,
    notesRepository,
    tasksRepository,
    studyCoursesRepository,
    studyModulesRepository,
    studyPagesRepository,
    trackerHabitsRepository,
    trackerRecordsRepository,
  }))

  return app
}
