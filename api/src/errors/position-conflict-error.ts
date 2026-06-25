export class PositionConflictError extends Error {
  constructor() {
    super('Conflito de posição. Recalcule e tente novamente.')
    this.name = 'PositionConflictError'
  }
}
