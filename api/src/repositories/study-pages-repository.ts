export interface StudyPageRecord {
  id: string
  moduleId: string
  userId: string
  title: string
  content: string
  position: string
  createdAt: Date
  updatedAt: Date
}

export type CreateStudyPageInput = Pick<
  StudyPageRecord,
  'id' | 'moduleId' | 'userId' | 'title' | 'position'
> & {
  content?: string
}

export type UpdateStudyPageInput = Partial<Pick<StudyPageRecord, 'title' | 'content'>>

export type ReorderStudyPageInput = Pick<StudyPageRecord, 'position'>

export interface StudyPagesRepository {
  findById(id: string, userId: string): Promise<StudyPageRecord | null>
  findManyByUserId(
    userId: string,
    filters?: { moduleId?: string },
  ): Promise<StudyPageRecord[]>
  countByModuleId(moduleId: string, userId: string): Promise<number>
  create(input: CreateStudyPageInput): Promise<StudyPageRecord>
  update(
    id: string,
    userId: string,
    input: UpdateStudyPageInput,
  ): Promise<StudyPageRecord>
  reorder(
    id: string,
    userId: string,
    input: ReorderStudyPageInput,
  ): Promise<StudyPageRecord>
  delete(id: string, userId: string): Promise<void>
}
