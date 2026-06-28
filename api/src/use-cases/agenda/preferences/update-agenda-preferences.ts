import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'

const MAX_OFFSET_MINUTES = 1440

interface UpdateAgendaPreferencesInput {
  userId: string
  notificationOffsetMinutes?: number
  timezone?: string
}

interface UpdateAgendaPreferencesOutput {
  preferences: {
    notificationOffsetMinutes: number
    timezone: string
  }
}

export class UpdateAgendaPreferencesUseCase {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  async execute(
    input: UpdateAgendaPreferencesInput,
  ): Promise<UpdateAgendaPreferencesOutput> {
    if (
      input.notificationOffsetMinutes === undefined &&
      input.timezone === undefined
    ) {
      throw new Error('Nenhum campo para atualizar')
    }
    if (input.notificationOffsetMinutes !== undefined) {
      if (
        !Number.isInteger(input.notificationOffsetMinutes) ||
        input.notificationOffsetMinutes < 0 ||
        input.notificationOffsetMinutes > MAX_OFFSET_MINUTES
      ) {
        throw new Error(
          `notificationOffsetMinutes deve estar entre 0 e ${MAX_OFFSET_MINUTES}`,
        )
      }
    }
    const prefs = await this.userPreferencesRepository.update(input.userId, {
      notificationOffsetMinutes: input.notificationOffsetMinutes,
      timezone: input.timezone,
    })
    return {
      preferences: {
        notificationOffsetMinutes: prefs.notificationOffsetMinutes,
        timezone: prefs.timezone,
      },
    }
  }
}
