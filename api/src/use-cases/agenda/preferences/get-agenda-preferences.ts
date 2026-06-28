import type { UserPreferencesRepository } from '@repositories/user-preferences-repository'

interface GetAgendaPreferencesInput {
  userId: string
}

interface GetAgendaPreferencesOutput {
  preferences: {
    notificationOffsetMinutes: number
    timezone: string
  }
}

export class GetAgendaPreferencesUseCase {
  constructor(
    private readonly userPreferencesRepository: UserPreferencesRepository,
  ) {}

  async execute(
    input: GetAgendaPreferencesInput,
  ): Promise<GetAgendaPreferencesOutput> {
    let prefs = await this.userPreferencesRepository.getByUserId(input.userId)
    if (!prefs) {
      prefs = await this.userPreferencesRepository.update(input.userId, {})
    }
    return {
      preferences: {
        notificationOffsetMinutes: prefs.notificationOffsetMinutes,
        timezone: prefs.timezone,
      },
    }
  }
}
