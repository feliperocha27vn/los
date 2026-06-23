import { describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'
import { GetUserProfileUseCase } from './get-user-profile'
import { ResourceNotFoundError } from '@errors/resource-not-found-error'

describe('get user profile use case', () => {
  it('should return user by id', async () => {
    const usersRepository = new InMemoryUsersRepository()

    await usersRepository.create({
      id: 'user-1',
      name: 'Sofia Davis',
      email: 'sofia@lifeos.com',
      passwordHash: await hash('12345678'),
    })

    const useCase = new GetUserProfileUseCase(usersRepository)

    const result = await useCase.execute({ userId: 'user-1' })

    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Sofia Davis',
      email: 'sofia@lifeos.com',
    })
  })

  it('should throw when user does not exist', async () => {
    const usersRepository = new InMemoryUsersRepository()

    const useCase = new GetUserProfileUseCase(usersRepository)

    await expect(() =>
      useCase.execute({ userId: 'nonexistent' })
    ).rejects.toThrow('Recurso não encontrado')
  })
})
