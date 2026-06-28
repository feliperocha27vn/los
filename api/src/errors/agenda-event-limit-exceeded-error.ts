export class AgendaEventLimitExceededError extends Error {
  constructor() {
    super('Limite de compromissos atingido (2000)')
    this.name = 'AgendaEventLimitExceededError'
  }
}
