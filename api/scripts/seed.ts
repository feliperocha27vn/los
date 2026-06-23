import { hash } from '@node-rs/bcrypt'
import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { users } from '../src/db/schema'
import { db } from '../src/lib/db'

const passwordHash = await hash('12345678')
const pinHash = await hash('123456')

await db.delete(users).where(eq(users.email, 'admin@lifeos.com'))

const userId = randomUUID()

await db.insert(users).values({
  id: userId,
  name: 'Admin',
  email: 'admin@lifeos.com',
  passwordHash,
  pinHash,
})

import { eq } from 'drizzle-orm'
import { notes, users } from '../src/db/schema'
import { db } from '../src/lib/db'

console.log('User seeded: admin@lifeos.com / 12345678')
console.log('Cofre PIN: 123456')

const now = new Date()

await db.insert(notes).values([
  {
    id: randomUUID(),
    userId,
    title: 'Ideias para o Life OS',
    content: `Abaixo estão as principais funcionalidades que pretendo implementar no módulo **Organização** do Life OS:\n\n• **Notas**: Suporte a Markdown, tags e pesquisa rápida\n• **Tarefas**: Kanban/Listas de afazeres integradas\n• **Hábitos**: Rastreador de hábitos com streaks diários\n\nSalvo automaticamente em tempo real`,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: randomUUID(),
    userId,
    title: 'Lista de Compras',
    content: 'Itens para comprar na feira de sábado: frutas, legumes, ovos e café.',
    createdAt: new Date(now.getTime() - 86400000),
    updatedAt: new Date(now.getTime() - 86400000),
  },
  {
    id: randomUUID(),
    userId,
    title: 'Reunião de Alinhamento',
    content: 'Notas sobre o roadmap do projeto e entregáveis para o próximo sprint.',
    createdAt: new Date(now.getTime() - 5 * 86400000),
    updatedAt: new Date(now.getTime() - 5 * 86400000),
  },
])

console.log('3 sample notes seeded')
