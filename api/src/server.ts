import { writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createApp } from './app'
import { env } from './env'
import { usersRepository } from '@repositories/adapters/drizzle/drizzle-users-repository'
import { cofreEntriesRepository } from '@repositories/adapters/drizzle/drizzle-cofre-entries-repository'
import { notesRepository } from '@repositories/adapters/drizzle/drizzle-notes-repository'
import { tasksRepository } from '@repositories/adapters/drizzle/drizzle-tasks-repository'
import { studyCoursesRepository } from '@repositories/adapters/drizzle/drizzle-study-courses-repository'
import { studyModulesRepository } from '@repositories/adapters/drizzle/drizzle-study-modules-repository'
import { studyPagesRepository } from '@repositories/adapters/drizzle/drizzle-study-pages-repository'

const app = createApp(
  usersRepository,
  cofreEntriesRepository,
  notesRepository,
  tasksRepository,
  studyCoursesRepository,
  studyModulesRepository,
  studyPagesRepository
)

app
  .listen({
    port: env.PORT,
    host: '0.0.0.0',
  })
  .then(() => {
    console.log(`HTTP server running on port ${env.PORT}`)
    console.log(`Documentation: http://localhost:${env.PORT}/docs`)
  })

if (env.NODE_ENV === 'development') {
  const specFile = resolve(process.cwd(), 'swagger.json')
  app.ready().then(() => {
    const spec = JSON.stringify(app.swagger(), null, 2)
    writeFile(specFile, spec).then(() => {
      console.log('Swagger spec generated → swagger.json')
    })
  })
}
