import type { FastifyPluginAsync } from 'fastify'
import type { UsersRepository } from '@repositories/users-repository'
import { makeAuthController } from './auth/auth-controller'
import { InMemoryCofreEntriesRepository } from '@in-memory/in-memory-cofre-entries-repository'
import { makeCofreController } from './cofre/cofre-controller'
import { registerNotesRoutes } from './notes/index.routes'
import { registerTasksRoutes } from './tasks/index.routes'
import { registerStudyCoursesRoutes } from './study-courses/index.routes'
import { registerStudyModulesRoutes } from './study-modules/index.routes'
import { registerStudyPagesRoutes } from './study-pages/index.routes'
import { registerTrackerHabitsRoutes } from './tracker/habits.routes'
import { registerTrackerRecordsRoutes } from './tracker/records.routes'
import { registerTrackerViewsRoutes } from './tracker/views.routes'
import { InMemoryNotesRepository } from '@in-memory/in-memory-notes-repository'
import { InMemoryTasksRepository } from '@in-memory/in-memory-tasks-repository'
import { InMemoryStudyCoursesRepository } from '@in-memory/in-memory-study-courses-repository'
import { InMemoryStudyModulesRepository } from '@in-memory/in-memory-study-modules-repository'
import { InMemoryStudyPagesRepository } from '@in-memory/in-memory-study-pages-repository'
import { InMemoryTrackerHabitsRepository } from '@in-memory/in-memory-tracker-habits-repository'
import { InMemoryTrackerRecordsRepository } from '@in-memory/in-memory-tracker-records-repository'
import type { CofreEntriesRepository } from '@repositories/cofre-entries-repository'
import type { NotesRepository } from '@repositories/notes-repository'
import type { TasksRepository } from '@repositories/tasks-repository'
import type { StudyCoursesRepository } from '@repositories/study-courses-repository'
import type { StudyModulesRepository } from '@repositories/study-modules-repository'
import type { StudyPagesRepository } from '@repositories/study-pages-repository'
import type { TrackerHabitsRepository } from '@repositories/tracker-habits-repository'
import type { TrackerRecordsRepository } from '@repositories/tracker-records-repository'

interface ControllersDeps {
  usersRepository: UsersRepository
  cofreEntriesRepository?: CofreEntriesRepository
  notesRepository?: NotesRepository
  tasksRepository?: TasksRepository
  studyCoursesRepository?: StudyCoursesRepository
  studyModulesRepository?: StudyModulesRepository
  studyPagesRepository?: StudyPagesRepository
  trackerHabitsRepository?: TrackerHabitsRepository
  trackerRecordsRepository?: TrackerRecordsRepository
}

export function controllers(deps: ControllersDeps): FastifyPluginAsync {
  const cofreEntriesRepo =
    deps.cofreEntriesRepository ?? new InMemoryCofreEntriesRepository()
  const notesRepo = deps.notesRepository ?? new InMemoryNotesRepository()
  const tasksRepo = deps.tasksRepository ?? new InMemoryTasksRepository()
  const studyCoursesRepo =
    deps.studyCoursesRepository ?? new InMemoryStudyCoursesRepository()
  const studyModulesRepo =
    deps.studyModulesRepository ?? new InMemoryStudyModulesRepository()
  const studyPagesRepo =
    deps.studyPagesRepository ?? new InMemoryStudyPagesRepository()
  const trackerHabitsRepo =
    deps.trackerHabitsRepository ?? new InMemoryTrackerHabitsRepository()
  const trackerRecordsRepo =
    deps.trackerRecordsRepository ?? new InMemoryTrackerRecordsRepository()

  return async (app) => {
    await app.register(makeAuthController(deps.usersRepository))
    await app.register(makeCofreController(deps.usersRepository, cofreEntriesRepo))
    registerNotesRoutes(app, notesRepo)
    registerTasksRoutes(app, tasksRepo)
    registerStudyCoursesRoutes(app, studyCoursesRepo)
    registerStudyModulesRoutes(app, studyModulesRepo, studyCoursesRepo)
    registerStudyPagesRoutes(
      app,
      studyPagesRepo,
      studyModulesRepo,
      studyCoursesRepo
    )
    registerTrackerHabitsRoutes(app, trackerHabitsRepo)
    registerTrackerRecordsRoutes(app, trackerRecordsRepo, trackerHabitsRepo)
    registerTrackerViewsRoutes(app, trackerRecordsRepo, trackerHabitsRepo)
  }
}
