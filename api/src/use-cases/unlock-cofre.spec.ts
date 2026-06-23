import { describe, it, expect, beforeEach } from 'vitest'
import { InMemoryUsersRepository } from '@in-memory/in-memory-users-repository'
import { hash } from '@node-rs/bcrypt'
import { UnlockCofreUseCase } from './unlock-cofre'
import { CofreLockedError } from '@errors/cofre-locked-error'
import { InvalidCofrePinError } from '@errors/invalid-cofre-pin-error'

describe('unlock cofre use case', () => {
  let usersRepository: InMemoryUsersRepository

  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository()

    await usersRepository.create({
      id: 'user-1',
      name: 'Admin',
      email: 'admin@lifeos.com',
      passwordHash: await hash('12345678'),
    })
  })

  it('should unlock with correct PIN', async () => {
    const pinHash = await hash('123456')
    const user = await usersRepository.findById('user-1')
    user!.pinHash = pinHash

    const useCase = new UnlockCofreUseCase(usersRepository)

    const result = await useCase.execute({ userId: 'user-1', pin: '123456' })

    expect(result.pinHash).toBe(pinHash)
  })

  it('should throw on wrong PIN', async () => {
    const pinHash = await hash('123456')
    const user = await usersRepository.findById('user-1')
    user!.pinHash = pinHash

    const useCase = new UnlockCofreUseCase(usersRepository)

    await expect(() =>
      useCase.execute({ userId: 'user-1', pin: '999999' })
    ).rejects.toThrow(InvalidCofrePinError)
  })

  it('should increment pin attempts on wrong PIN', async () => {
    const pinHash = await hash('123456')
    const user = await usersRepository.findById('user-1')
    user!.pinHash = pinHash

    const useCase = new UnlockCofreUseCase(usersRepository)

    await expect(() =>
      useCase.execute({ userId: 'user-1', pin: '000000' })
    ).rejects.toThrow(InvalidCofrePinError)

    const updated = await usersRepository.findById('user-1')
    expect(updated!.pinAttempts).toBe(1)
  })

  it('should lock after 3 failed attempts', async () => {
    const pinHash = await hash('123456')
    const user = await usersRepository.findById('user-1')
    user!.pinHash = pinHash

    const useCase = new UnlockCofreUseCase(usersRepository)

    for (let i = 0; i < 3; i++) {
      await expect(() =>
        useCase.execute({ userId: 'user-1', pin: '000000' })
      ).rejects.toThrow(InvalidCofrePinError)
    }

    const updated = await usersRepository.findById('user-1')
    expect(updated!.pinAttempts).toBe(3)

    await expect(() =>
      useCase.execute({ userId: 'user-1', pin: '123456' })
    ).rejects.toThrow(CofreLockedError)
  })

  it('should reset attempts after successful unlock', async () => {
    const pinHash = await hash('123456')
    const user = await usersRepository.findById('user-1')
    user!.pinHash = pinHash

    const useCase = new UnlockCofreUseCase(usersRepository)

    await expect(() =>
      useCase.execute({ userId: 'user-1', pin: '000000' })
    ).rejects.toThrow(InvalidCofrePinError)

    await useCase.execute({ userId: 'user-1', pin: '123456' })

    const updated = await usersRepository.findById('user-1')
    expect(updated!.pinAttempts).toBe(0)
    expect(updated!.pinLockedUntil).toBeNull()
  })
})
