import type { UsersRepository } from '@repositories/users-repository'
import { LoginUseCase } from '@use-cases/login'

export function makeLoginUseCase(usersRepository: UsersRepository) {
  return new LoginUseCase(usersRepository)
}
