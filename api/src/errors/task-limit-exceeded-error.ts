export class TaskLimitExceededError extends Error {
  constructor() {
    super('Limite de tarefas atingido (500)')
    this.name = 'TaskLimitExceededError'
  }
}
