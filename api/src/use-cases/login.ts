import { compare } from '@node-rs/bcrypt'
import { InvalidCredentialsError } from '@errors/invalid-credentials-error'
import type { UsersRepository } from '@repositories/users-repository'

interface LoginInput {
  email: string
  password: string
}

interface LoginOutput {
  user: {
    id: string
    name: string
    email: string
  }
}

export class LoginUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ email, password }: LoginInput): Promise<LoginOutput> {
    const user = await this.usersRepository.findByEmail(email)

    if (!user) {
      throw new InvalidCredentialsError()
    }

    const passwordMatches = await compare(password, user.passwordHash)

    if (!passwordMatches) {
      throw new InvalidCredentialsError()
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
