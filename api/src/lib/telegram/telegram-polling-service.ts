import type { TelegramClient } from '@lib/telegram/telegram-client'
import type { AgendaTelegramLinksRepository } from '@repositories/agenda-telegram-links-repository'
import { HandleTelegramStartUseCase } from '@use-cases/agenda/telegram/handle-telegram-start'
import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'

export class TelegramPollingService {
  private offset: number | undefined
  private running = false
  private intervalHandle: NodeJS.Timeout | null = null
  private readonly pollIntervalMs: number
  private readonly longPollTimeoutSeconds: number

  constructor(
    private readonly telegramClient: TelegramClient,
    private readonly agendaTelegramLinksRepository: AgendaTelegramLinksRepository,
    pollIntervalMs = 5000,
    longPollTimeoutSeconds = 25,
  ) {
    this.pollIntervalMs = pollIntervalMs
    this.longPollTimeoutSeconds = longPollTimeoutSeconds
  }

  start(): void {
    if (this.running) return
    this.running = true
    void this.pollLoop()
  }

  stop(): void {
    this.running = false
    if (this.intervalHandle) {
      clearTimeout(this.intervalHandle)
      this.intervalHandle = null
    }
  }

  private async pollLoop(): Promise<void> {
    if (!this.running) return
    if (!this.telegramClient.isConfigured()) return
    try {
      const response = await this.telegramClient.getUpdates(
        this.offset,
        this.longPollTimeoutSeconds,
      )
      if (response.ok && response.result) {
        for (const update of response.result) {
          this.offset = update.update_id + 1
          await this.handleUpdate(update)
        }
      }
    } catch {
      // ignore transient errors, retry on next tick
    } finally {
      if (this.running) {
        this.intervalHandle = setTimeout(
          () => void this.pollLoop(),
          this.pollIntervalMs,
        )
      }
    }
  }

  private async handleUpdate(update: {
    update_id: number
    message?: {
      chat: { id: number }
      text?: string
    }
  }): Promise<void> {
    const message = update.message
    if (!message?.text) return
    const text = message.text.trim()
    if (!text.startsWith('/start')) return

    const tokenMatch = text.match(/^\/start(?:\s+(\S+))?$/)
    const token = tokenMatch?.[1]
    const tokenPayload = token ? this.verifyJwt(token) : null

    const useCase = new HandleTelegramStartUseCase(
      this.agendaTelegramLinksRepository,
    )
    const result = await useCase.execute({
      chatId: message.chat.id,
      tokenPayload,
    })

    try {
      await this.telegramClient.sendMessage(
        message.chat.id,
        result.responseMessage,
      )
    } catch {
      // ignore
    }
  }

  private verifyJwt(token: string): { sub: string } | null {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      const payload = JSON.parse(
        Buffer.from(parts[1], 'base64url').toString('utf-8'),
      ) as { sub?: string; scope?: string; exp?: number }
      if (payload.scope !== 'telegram-link') return null
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        return null
      }
      if (!payload.sub) return null
      return { sub: payload.sub }
    } catch {
      return null
    }
  }
}
