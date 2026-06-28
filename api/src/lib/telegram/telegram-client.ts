export interface TelegramUpdate {
  update_id: number
  message?: {
    chat: { id: number }
    text?: string
    from?: { id: number; username?: string; first_name?: string }
  }
}

export interface TelegramSendMessageResponse {
  ok: boolean
  result?: { message_id: number; chat: { id: number } }
  description?: string
}

export class TelegramClient {
  constructor(
    private readonly token: string,
    private readonly apiBase = 'https://api.telegram.org',
  ) {}

  isConfigured(): boolean {
    return !!this.token && this.token.length > 0
  }

  async sendMessage(
    chatId: number,
    text: string,
  ): Promise<TelegramSendMessageResponse> {
    const url = `${this.apiBase}/bot${this.token}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    })
    return (await response.json()) as TelegramSendMessageResponse
  }

  async getMe(): Promise<{ ok: boolean; result?: { username: string } }> {
    const url = `${this.apiBase}/bot${this.token}/getMe`
    const response = await fetch(url)
    return (await response.json()) as {
      ok: boolean
      result?: { username: string }
    }
  }
}
