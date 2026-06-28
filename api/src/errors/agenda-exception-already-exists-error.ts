export class AgendaExceptionAlreadyExistsError extends Error {
  constructor() {
    super('Já existe uma exceção para esta data')
    this.name = 'AgendaExceptionAlreadyExistsError'
  }
}
