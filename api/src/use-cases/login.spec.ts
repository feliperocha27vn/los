import { describe, it, expect } from 'vitest'
import { makeLoginUseCase } from '@factories/make-login-use-case'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'

describe('login use case', () => {
  it('should return user when credentials are valid', async () => {
    const usersRepository = new InMemoryUsersRepository()

    await usersRepository.create({
      id: 'user-1',
      name: 'Sofia Davis',
      email: 'sofia@lifeos.com',
      passwordHash: await hash('12345678'),
    })

    const useCase = makeLoginUseCase(usersRepository)

    const result = await useCase.execute({
      email: 'sofia@lifeos.com',
      password: '12345678',
    })

    expect(result.user).toEqual({
      id: 'user-1',
      name: 'Sofia Davis',
      email: 'sofia@lifeos.com',
    })
  })

  it('should throw when email does not exist', async () => {
    const usersRepository = new InMemoryUsersRepository()

    const useCase = makeLoginUseCase(usersRepository)

    await expect(() =>
      useCase.execute({
        email: 'wrong@email.com',
        password: '12345678',
      })
    ).rejects.toThrow('Credenciais inválidas')
  })

  it('should throw when password is wrong', async () => {
    const usersRepository = new InMemoryUsersRepository()

    await usersRepository.create({
      id: 'user-1',
      name: 'Sofia Davis',
      email: 'sofia@lifeos.com',
      passwordHash: await hash('12345678'),
    })

    const useCase = makeLoginUseCase(usersRepository)

    await expect(() =>
      useCase.execute({
        email: 'sofia@lifeos.com',
        password: 'wrongpassword',
      })
    ).rejects.toThrow('Credenciais inválidas')
  })
})
