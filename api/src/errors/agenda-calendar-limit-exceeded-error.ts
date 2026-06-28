export class AgendaCalendarLimitExceededError extends Error {
  constructor() {
    super('Limite de calendários atingido (20)')
    this.name = 'AgendaCalendarLimitExceededError'
  }
}
