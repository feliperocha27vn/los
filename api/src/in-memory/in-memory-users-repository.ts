import type {
  CreateUserInput,
  UserRecord,
  UsersRepository,
} from '@repositories/users-repository'

export class InMemoryUsersRepository implements UsersRepository {
  private users: UserRecord[] = []

  async findById(id: string): Promise<UserRecord | null> {
    return this.users.find((u) => u.id === id) ?? null
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return this.users.find((u) => u.email === email) ?? null
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    const user: UserRecord = {
      id: input.id,
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      pinHash: '',
      pinAttempts: 0,
      pinLockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.users.push(user)

    return user
  }

  async incrementPinAttempts(userId: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId)
    if (user) {
      user.pinAttempts += 1
    }
  }

  async resetPinAttempts(userId: string): Promise<void> {
    const user = this.users.find((u) => u.id === userId)
    if (user) {
      user.pinAttempts = 0
      user.pinLockedUntil = null
    }
  }

  async setPinLockedUntil(userId: string, lockedUntil: Date): Promise<void> {
    const user = this.users.find((u) => u.id === userId)
    if (user) {
      user.pinLockedUntil = lockedUntil
    }
  }
}
