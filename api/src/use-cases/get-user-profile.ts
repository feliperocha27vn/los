import { ResourceNotFoundError } from '@errors/resource-not-found-error'
import type { UsersRepository } from '@repositories/users-repository'

interface GetUserProfileInput {
  userId: string
}

interface GetUserProfileOutput {
  user: {
    id: string
    name: string
    email: string
  }
}

export class GetUserProfileUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ userId }: GetUserProfileInput): Promise<GetUserProfileOutput> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new ResourceNotFoundError()
    }

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    }
  }
}
