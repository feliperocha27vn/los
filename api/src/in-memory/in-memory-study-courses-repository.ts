import type {
  CreateStudyCourseInput,
  ReorderStudyCourseInput,
  StudyCourseRecord,
  StudyCoursesRepository,
  UpdateStudyCourseInput,
} from '@repositories/study-courses-repository'

export class InMemoryStudyCoursesRepository implements StudyCoursesRepository {
  private courses: StudyCourseRecord[] = []

  async findById(id: string, userId: string): Promise<StudyCourseRecord | null> {
    return this.courses.find((c) => c.id === id && c.userId === userId) ?? null
  }

  async findManyByUserId(userId: string): Promise<StudyCourseRecord[]> {
    return this.courses
      .filter((c) => c.userId === userId)
      .sort((a, b) => Number(a.position) - Number(b.position))
  }

  async countByUserId(userId: string): Promise<number> {
    return this.courses.filter((c) => c.userId === userId).length
  }

  async create(input: CreateStudyCourseInput): Promise<StudyCourseRecord> {
    const course: StudyCourseRecord = {
      id: input.id,
      userId: input.userId,
      name: input.name,
      position: input.position,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.courses.push(course)
    return course
  }

  async update(
    id: string,
    userId: string,
    input: UpdateStudyCourseInput,
  ): Promise<StudyCourseRecord> {
    const course = this.courses.find((c) => c.id === id && c.userId === userId)
    if (!course) throw new Error('StudyCourse not found')
    if (input.name !== undefined) course.name = input.name
    course.updatedAt = new Date()
    return course
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderStudyCourseInput,
  ): Promise<StudyCourseRecord> {
    const course = this.courses.find((c) => c.id === id && c.userId === userId)
    if (!course) throw new Error('StudyCourse not found')
    course.position = input.position
    course.updatedAt = new Date()
    return course
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.courses.findIndex(
      (c) => c.id === id && c.userId === userId,
    )
    if (index === -1) throw new Error('StudyCourse not found')
    this.courses.splice(index, 1)
  }
}
