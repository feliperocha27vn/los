export interface UserRecord {
  id: string
  name: string
  email: string
  passwordHash: string
  pinHash: string
  pinAttempts: number
  pinLockedUntil: Date | null
  createdAt: Date
  updatedAt: Date
}

export type CreateUserInput = Pick<UserRecord, 'id' | 'name' | 'email' | 'passwordHash'>

export interface UsersRepository {
  findById(id: string): Promise<UserRecord | null>
  findByEmail(email: string): Promise<UserRecord | null>
  create(input: CreateUserInput): Promise<UserRecord>
  incrementPinAttempts(userId: string): Promise<void>
  resetPinAttempts(userId: string): Promise<void>
  setPinLockedUntil(userId: string, lockedUntil: Date): Promise<void>
}
