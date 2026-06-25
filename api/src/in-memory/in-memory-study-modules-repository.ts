import type {
  CreateStudyModuleInput,
  ReorderStudyModuleInput,
  StudyModuleRecord,
  StudyModulesRepository,
  UpdateStudyModuleInput,
} from '@repositories/study-modules-repository'

export class InMemoryStudyModulesRepository implements StudyModulesRepository {
  private modules: StudyModuleRecord[] = []

  async findById(id: string, userId: string): Promise<StudyModuleRecord | null> {
    return this.modules.find((m) => m.id === id && m.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { courseId?: string },
  ): Promise<StudyModuleRecord[]> {
    let result = this.modules.filter((m) => m.userId === userId)
    if (filters?.courseId) {
      result = result.filter((m) => m.courseId === filters.courseId)
    }
    return result.sort((a, b) => Number(a.position) - Number(b.position))
  }

  async countByCourseId(courseId: string, userId: string): Promise<number> {
    return this.modules.filter(
      (m) => m.courseId === courseId && m.userId === userId,
    ).length
  }

  async create(input: CreateStudyModuleInput): Promise<StudyModuleRecord> {
    const module: StudyModuleRecord = {
      id: input.id,
      courseId: input.courseId,
      userId: input.userId,
      name: input.name,
      position: input.position,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.modules.push(module)
    return module
  }

  async update(
    id: string,
    userId: string,
    input: UpdateStudyModuleInput,
  ): Promise<StudyModuleRecord> {
    const module = this.modules.find((m) => m.id === id && m.userId === userId)
    if (!module) throw new Error('StudyModule not found')
    if (input.name !== undefined) module.name = input.name
    module.updatedAt = new Date()
    return module
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderStudyModuleInput,
  ): Promise<StudyModuleRecord> {
    const module = this.modules.find((m) => m.id === id && m.userId === userId)
    if (!module) throw new Error('StudyModule not found')
    module.position = input.position
    module.updatedAt = new Date()
    return module
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.modules.findIndex(
      (m) => m.id === id && m.userId === userId,
    )
    if (index === -1) throw new Error('StudyModule not found')
    this.modules.splice(index, 1)
  }
}
