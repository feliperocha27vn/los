export class ResourceNotFoundError extends Error {
  constructor() {
    super('Recurso não encontrado')
    this.name = 'ResourceNotFoundError'
  }
}
