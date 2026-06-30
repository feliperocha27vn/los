import { randomUUID } from 'node:crypto'
import { hash } from '@node-rs/bcrypt'
import { notes, users } from '@db/schema'
import { db } from '@lib/db'

interface EnsureSeedInput {
  email?: string
  password?: string
  pin?: string
  name?: string
}

const DEFAULT_EMAIL = 'admin@lifeos.com'
const DEFAULT_PASSWORD = '12345678'
const DEFAULT_PIN = '123456'
const DEFAULT_NAME = 'Admin'

export class EnsureSeedUseCase {
  async execute(input: EnsureSeedInput = {}): Promise<{
    seeded: boolean
    userId: string
    email: string
  }> {
    const email = input.email || DEFAULT_EMAIL
    const password = input.password || DEFAULT_PASSWORD
    const pin = input.pin || DEFAULT_PIN
    const name = input.name || DEFAULT_NAME

    const existing = await db.select().from(users).limit(1)
    if (existing.length > 0) {
      return { seeded: false, userId: existing[0].id, email: existing[0].email }
    }

    const passwordHash = await hash(password)
    const pinHash = await hash(pin)
    const userId = randomUUID()
    const now = new Date()

    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash,
      pinHash,
    })

    await db.insert(notes).values([
      {
        id: randomUUID(),
        userId,
        title: 'Bem-vindo ao Life OS',
        content: `Sua conta foi criada automaticamente no primeiro boot.\n\nCredenciais iniciais:\n• Email: ${email}\n• Senha: ${password}\n• PIN do Cofre: ${pin}\n\n**Importante**: Troque a senha após o primeiro login.`,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        userId,
        title: 'Como começar',
        content: 'Explore os módulos: Finanças, Cofre, Tarefas, Hábitos, Estudos e Notas.',
        createdAt: now,
        updatedAt: now,
      },
    ])

    return { seeded: true, userId, email }
  }
}
