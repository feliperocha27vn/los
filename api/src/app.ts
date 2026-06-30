import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import { controllers } from '@http/controllers'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'
import type { FinanceCategoriesRepository } from '@repositories/finance-categories-repository'
import type { FinanceCreditCardExpensesRepository } from '@repositories/finance-credit-card-expenses-repository'
import type { FinanceTransactionsRepository } from '@repositories/finance-transactions-repository'
import type { NotesRepository } from '@repositories/notes-repository'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'
import type { TasksRepository } from '@repositories/tasks-repository'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'
import type { UsersRepository } from '@repositories/users-repository'
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
  trackerRecordsRepository?: TrackerRecordsRepository,
  financeCategoriesRepository?: FinanceCategoriesRepository,
  financeTransactionsRepository?: FinanceTransactionsRepository,
  financeCreditCardExpensesRepository?: FinanceCreditCardExpensesRepository,
) {
  const app = fastify().withTypeProvider<ZodTypeProvider>()

  app.setSerializerCompiler(serializerCompiler)
  app.setValidatorCompiler(validatorCompiler)

  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
    'https://los-web.pages.dev',
    'https://api.votipet.tech',
    'https://votipet.tech',
    'https://www.votipet.tech',
  ]
  if (env.CORS_ORIGIN) {
    for (const origin of env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)) {
      if (!allowedOrigins.includes(origin)) allowedOrigins.push(origin)
    }
  }

  app.register(fastifyCors, {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (allowedOrigins.includes(origin)) return cb(null, true)
      if (/\.votipet\.tech$/.test(origin)) return cb(null, true)
      if (/\.pages\.dev$/.test(origin)) return cb(null, true)
      if (/\.coolify\.io$/.test(origin)) return cb(null, true)
      cb(null, false)
    },
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

  app.get(
    '/health',
    {
      config: { public: true },
    },
    async () => {
      return { status: 'ok', timestamp: new Date().toISOString() }
    },
  )

  app.register(
    controllers({
      usersRepository,
      cofreEntriesRepository,
      notesRepository,
      tasksRepository,
      studyCoursesRepository,
      studyModulesRepository,
      studyPagesRepository,
      trackerHabitsRepository,
      trackerRecordsRepository,
      financeCategoriesRepository,
      financeTransactionsRepository,
      financeCreditCardExpensesRepository,
    }),
  )

  return app
}
