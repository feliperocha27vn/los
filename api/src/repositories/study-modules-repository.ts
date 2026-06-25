export interface StudyModuleRecord {
  id: string
  courseId: string
  userId: string
  name: string
  position: string
  createdAt: Date
  updatedAt: Date
}

export type CreateStudyModuleInput = Pick<
  StudyModuleRecord,
  'id' | 'courseId' | 'userId' | 'name' | 'position'
>

export type UpdateStudyModuleInput = Partial<Pick<StudyModuleRecord, 'name'>>

export type ReorderStudyModuleInput = Pick<StudyModuleRecord, 'position'>

export interface StudyModulesRepository {
  findById(id: string, userId: string): Promise<StudyModuleRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { courseId?: string },
  ): Promise<StudyModuleRecord[]>
  countByCourseId(courseId: string, userId: string): Promise<number>
  create(input: CreateStudyModuleInput): Promise<StudyModuleRecord>
  update(
    id: string,
    userId: string,
    input: UpdateStudyModuleInput,
  ): Promise<StudyModuleRecord>
  reorder(
    id: string,
    userId: string,
    input: ReorderStudyModuleInput,
  ): Promise<StudyModuleRecord>
  delete(id: string, userId: string): Promise<void>
}
