import type {
  CreateStudyPageInput,
  ReorderStudyPageInput,
  StudyPageRecord,
  StudyPagesRepository,
  UpdateStudyPageInput,
} from '@repositories/study-pages-repository'

export class InMemoryStudyPagesRepository implements StudyPagesRepository {
  private pages: StudyPageRecord[] = []

  async findById(id: string, userId: string): Promise<StudyPageRecord | null> {
    return this.pages.find((p) => p.id === id && p.userId === userId) ?? null
  }

  async findManyByUserId(
    userId: string,
    filters?: { moduleId?: string },
  ): Promise<StudyPageRecord[]> {
    let result = this.pages.filter((p) => p.userId === userId)
    if (filters?.moduleId) {
      result = result.filter((p) => p.moduleId === filters.moduleId)
    }
    return result.sort((a, b) => Number(a.position) - Number(b.position))
  }

  async countByModuleId(moduleId: string, userId: string): Promise<number> {
    return this.pages.filter(
      (p) => p.moduleId === moduleId && p.userId === userId,
    ).length
  }

  async create(input: CreateStudyPageInput): Promise<StudyPageRecord> {
    const page: StudyPageRecord = {
      id: input.id,
      moduleId: input.moduleId,
      userId: input.userId,
      title: input.title,
      content: input.content ?? '',
      position: input.position,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.pages.push(page)
    return page
  }

  async update(
    id: string,
    userId: string,
    input: UpdateStudyPageInput,
  ): Promise<StudyPageRecord> {
    const page = this.pages.find((p) => p.id === id && p.userId === userId)
    if (!page) throw new Error('StudyPage not found')
    if (input.title !== undefined) page.title = input.title
    if (input.content !== undefined) page.content = input.content
    page.updatedAt = new Date()
    return page
  }

  async reorder(
    id: string,
    userId: string,
    input: ReorderStudyPageInput,
  ): Promise<StudyPageRecord> {
    const page = this.pages.find((p) => p.id === id && p.userId === userId)
    if (!page) throw new Error('StudyPage not found')
    page.position = input.position
    page.updatedAt = new Date()
    return page
  }

  async delete(id: string, userId: string): Promise<void> {
    const index = this.pages.findIndex(
      (p) => p.id === id && p.userId === userId,
    )
    if (index === -1) throw new Error('StudyPage not found')
    this.pages.splice(index, 1)
  }
}
