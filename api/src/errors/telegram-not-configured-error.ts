export class TelegramNotConfiguredError extends Error {
  constructor() {
    super('Telegram não está configurado no servidor')
    this.name = 'TelegramNotConfiguredError'
  }
}
