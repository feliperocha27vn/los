import { env } from '../src/env'
console.log('env.TELEGRAM_BOT_TOKEN:', env.TELEGRAM_BOT_TOKEN ? `<set: ${env.TELEGRAM_BOT_TOKEN.slice(0, 8)}...>` : '<undefined>')
console.log('env.TELEGRAM_BOT_USERNAME:', env.TELEGRAM_BOT_USERNAME ?? '<undefined>')
console.log('env.TELEGRAM_WEBHOOK_SECRET:', env.TELEGRAM_WEBHOOK_SECRET ?? '<undefined>')
process.exit(0)
