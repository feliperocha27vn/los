export interface StudyCourseRecord {
  id: string
  userId: string
  name: string
  position: string
  createdAt: Date
  updatedAt: Date
}

export type CreateStudyCourseInput = Pick<
  StudyCourseRecord,
  'id' | 'userId' | 'name' | 'position'
>

export type UpdateStudyCourseInput = Partial<Pick<StudyCourseRecord, 'name'>>

export type ReorderStudyCourseInput = Pick<StudyCourseRecord, 'position'>

export interface StudyCoursesRepository {
  findById(id: string, userId: string): Promise<StudyCourseRecord | null>
  findManyByUserId(userId: string): Promise<StudyCourseRecord[]>
  countByUserId(userId: string): Promise<number>
  create(input: CreateStudyCourseInput): Promise<StudyCourseRecord>
  update(
    id: string,
    userId: string,
    input: UpdateStudyCourseInput,
  ): Promise<StudyCourseRecord>
  reorder(
    id: string,
    userId: string,
    input: ReorderStudyCourseInput,
  ): Promise<StudyCourseRecord>
  delete(id: string, userId: string): Promise<void>
}
