import { randomUUID } from 'node:crypto'
import type {
  StudyCourseRecord,
  StudyCoursesRepository,
} from '@repositories/study-courses-repository'

const STUDY_COURSE_LIMIT = 50
const POSITION_STEP = 1.0

interface CreateStudyCourseInput {
  userId: string
  name: string
}

interface CreateStudyCourseOutput {
  course: StudyCourseRecord
}

export class CreateStudyCourseUseCase {
  constructor(
    private readonly studyCoursesRepository: StudyCoursesRepository,
  ) {}

  async execute({
    userId,
    name,
  }: CreateStudyCourseInput): Promise<CreateStudyCourseOutput> {
    const count = await this.studyCoursesRepository.countByUserId(userId)
    if (count >= STUDY_COURSE_LIMIT) {
      throw new Error('Limite de cursos atingido (50)')
    }

    const userCourses = await this.studyCoursesRepository.findManyByUserId(userId)
    const maxPosition = userCourses.reduce((max, c) => {
      const n = Number(c.position)
      return Number.isFinite(n) && n > max ? n : max
    }, 0)
    const nextPosition = (maxPosition + POSITION_STEP).toFixed(10)

    const course = await this.studyCoursesRepository.create({
      id: randomUUID(),
      userId,
      name,
      position: nextPosition,
    })

    return { course }
  }
}
