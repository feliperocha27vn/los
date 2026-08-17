export class SeriesLimitExceededError extends Error {
  constructor() {
    super('Limite de séries atingido (200)')
    this.name = 'SeriesLimitExceededError'
  }
}
