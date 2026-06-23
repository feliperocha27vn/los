import { compare } from '@node-rs/bcrypt'
import { CofreLockedError } from '@errors/cofre-locked-error'
import { InvalidCofrePinError } from '@errors/invalid-cofre-pin-error'
import type { UsersRepository } from '@repositories/users-repository'

interface UnlockCofreInput {
  userId: string
  pin: string
}

interface UnlockCofreOutput {
  pinHash: string
}

const LOCKOUT_THRESHOLD = 3
const LOCKOUT_DURATION_MS = 30 * 1000

export class UnlockCofreUseCase {
  constructor(private readonly usersRepository: UsersRepository) {}

  async execute({ userId, pin }: UnlockCofreInput): Promise<UnlockCofreOutput> {
    const user = await this.usersRepository.findById(userId)

    if (!user) {
      throw new InvalidCofrePinError()
    }

    if (user.pinLockedUntil && user.pinLockedUntil > new Date()) {
      throw new CofreLockedError()
    }

    const valid = await compare(pin, user.pinHash)

    if (!valid) {
      await this.usersRepository.incrementPinAttempts(userId)

      const updated = await this.usersRepository.findById(userId)

      if (updated && updated.pinAttempts >= LOCKOUT_THRESHOLD) {
        const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS)
        await this.usersRepository.setPinLockedUntil(userId, lockedUntil)
      }

      throw new InvalidCofrePinError()
    }

    await this.usersRepository.resetPinAttempts(userId)

    return { pinHash: user.pinHash }
  }
}
