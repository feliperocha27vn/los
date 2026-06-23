export class InvalidCofrePinError extends Error {
  constructor() {
    super('PIN inválido')
    this.name = 'InvalidCofrePinError'
  }
}
