export class CofreLockedError extends Error {
  constructor() {
    super('Cofre bloqueado temporariamente. Aguarde.')
    this.name = 'CofreLockedError'
  }
}
