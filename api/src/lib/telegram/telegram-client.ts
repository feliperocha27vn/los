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
    parseMode?: 'MarkdownV2' | 'HTML' | 'Markdown',
  ): Promise<TelegramSendMessageResponse> {
    const url = `${this.apiBase}/bot${this.token}/sendMessage`
    const body: { chat_id: number; text: string; parse_mode?: string } = {
      chat_id: chatId,
      text,
    }
    if (parseMode) body.parse_mode = parseMode
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

  async getUpdates(offset?: number, timeoutSeconds = 30): Promise<{
    ok: boolean
    result?: Array<{
      update_id: number
      message?: {
        chat: { id: number }
        text?: string
        from?: { id: number; username?: string; first_name?: string }
      }
    }>
  }> {
    const params = new URLSearchParams({ timeout: String(timeoutSeconds) })
    if (offset !== undefined) params.set('offset', String(offset))
    const url = `${this.apiBase}/bot${this.token}/getUpdates?${params.toString()}`
    const response = await fetch(url)
    return (await response.json()) as {
      ok: boolean
      result?: Array<{
        update_id: number
        message?: {
          chat: { id: number }
          text?: string
          from?: { id: number; username?: string; first_name?: string }
        }
      }>
    }
  }
}
