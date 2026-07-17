import { randomUUID } from 'node:crypto'
import { hash } from '@node-rs/bcrypt'
import {
  cofreEntries,
  financeCategories,
  financeCreditCardExpenses,
  financeInstallments,
  financeTransactions,
  notes,
  studyCourses,
  studyModules,
  studyPages,
  tasks,
  trackerHabits,
  trackerRecords,
  users,
} from '@db/schema'
import { db } from '@lib/db'
import { deriveKey, encrypt } from '@utils/cofre-encryption'

interface EnsureSeedInput {
  email?: string
  password?: string
  pin?: string
  name?: string
  force?: boolean
}

const DEFAULT_EMAIL = 'admin@lifeos.com'
const DEFAULT_PASSWORD = '12345678'
const DEFAULT_PIN = '123456'
const DEFAULT_NAME = 'Admin'

function daysAgo(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function dateOnly(d: Date): string {
  return d.toISOString().split('T')[0]
}

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

    if (input.force) {
      await this.wipeAll()
    } else {
      const existing = await db.select().from(users).limit(1)
      if (existing.length > 0) {
        return { seeded: false, userId: existing[0].id, email: existing[0].email }
      }
    }

    const passwordHash = await hash(password)
    const pinHash = await hash(pin)
    const userId = randomUUID()
    const encKey = deriveKey(pinHash)

    await db.insert(users).values({
      id: userId,
      name,
      email,
      passwordHash,
      pinHash,
    })

    await this.seedNotes(userId, email, password, pin)
    await this.seedTasks(userId)
    await this.seedCofreEntries(userId, encKey)
    await this.seedFinance(userId)
    await this.seedStudies(userId)
    await this.seedHabitsAndRecords(userId)

    return { seeded: true, userId, email }
  }

  private async wipeAll() {
    await db.delete(trackerRecords)
    await db.delete(trackerHabits)
    await db.delete(studyPages)
    await db.delete(studyModules)
    await db.delete(studyCourses)
    await db.delete(financeInstallments)
    await db.delete(financeCreditCardExpenses)
    await db.delete(financeTransactions)
    await db.delete(financeCategories)
    await db.delete(cofreEntries)
    await db.delete(notes)
    await db.delete(tasks)
    await db.delete(users)
  }

  private async seedNotes(userId: string, email: string, password: string, pin: string) {
    const now = new Date()
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
        content:
          'Explore os módulos: Finanças, Cofre, Tarefas, Hábitos, Estudos e Notas.\n\n- **Finanças**: registre receitas e despesas\n- **Cofre**: guarde senhas e chaves de API (criptografadas com seu PIN)\n- **Tarefas**: organize seu dia com o Kanban\n- **Hábitos**: acompanhe sua consistência\n- **Estudos**: cadernos por curso, módulo e página',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: randomUUID(),
        userId,
        title: 'Reunião de planejamento Q3',
        content:
          'Pontos da reunião:\n1. Revisão das metas do trimestre\n2. Alocação de budget para ferramentas\n3. Cronograma de entregas\n4. Feedbacks da equipe',
        createdAt: daysAgo(2),
        updatedAt: daysAgo(1),
      },
      {
        id: randomUUID(),
        userId,
        title: 'Ideias para o projeto',
        content:
          '- Dashboard com métricas em tempo real\n- Notificações push para hábitos\n- Integração com calendário\n- Exportar relatórios em PDF',
        createdAt: daysAgo(5),
        updatedAt: daysAgo(3),
      },
      {
        id: randomUUID(),
        userId,
        title: 'Lista de compras',
        content: 'Leite, pão, ovos, café, frutas da semana, papel toalha',
        createdAt: daysAgo(7),
        updatedAt: daysAgo(7),
      },
      {
        id: randomUUID(),
        userId,
        title: 'Leituras recomendadas',
        content:
          '1. "Deep Work" — Cal Newport\n2. "Atomic Habits" — James Clear\n3. "The Pragmatic Programmer" — Hunt & Thomas',
        createdAt: daysAgo(10),
        updatedAt: daysAgo(8),
      },
    ])
  }

  private async seedTasks(userId: string) {
    const todoTasks = [
      { title: 'Renovar CNH', description: 'Agendar no DETRAN e levar documentos' },
      { title: 'Pagar fatura do cartão', description: 'Vencimento dia 15' },
      { title: 'Comprar presente da Ana', description: 'Aniversário sábado' },
      { title: 'Revisar relatório mensal', description: 'Comparar com mês anterior' },
    ]
    const inProgressTasks = [
      { title: 'Estudar para certificação', description: 'Capítulo 4 de TypeScript Avançado' },
      { title: 'Organizar escritório', description: 'Já comecei, falta a estante' },
    ]
    const doneTasks = [
      { title: 'Pagar aluguel', description: 'Transferência feita' },
      { title: 'Consulta médica', description: 'Exames de rotina OK' },
      { title: 'Backup dos arquivos', description: 'Drive sincronizado' },
    ]

    const allTasks = [
      ...todoTasks.map((t, i) => ({
        id: randomUUID(),
        userId,
        column: 'todo' as const,
        title: t.title,
        description: t.description,
        position: String(i + 1),
        createdAt: daysAgo(3),
        updatedAt: daysAgo(3),
      })),
      ...inProgressTasks.map((t, i) => ({
        id: randomUUID(),
        userId,
        column: 'in_progress' as const,
        title: t.title,
        description: t.description,
        position: String(i + 1),
        createdAt: daysAgo(5),
        updatedAt: daysAgo(1),
      })),
      ...doneTasks.map((t, i) => ({
        id: randomUUID(),
        userId,
        column: 'done' as const,
        title: t.title,
        description: t.description,
        position: String(i + 1),
        createdAt: daysAgo(7),
        updatedAt: daysAgo(2),
      })),
    ]

    await db.insert(tasks).values(allTasks)
  }

  private async seedCofreEntries(userId: string, encKey: Buffer) {
    await db.insert(cofreEntries).values([
      {
        id: randomUUID(),
        userId,
        category: 'credential',
        title: 'GitHub',
        url: 'https://github.com',
        username: 'admin@lifeos.com',
        passwordEnc: encrypt('EXAMPLE-GITHUB-PAT-PLACEHOLDER-DO-NOT-USE', encKey),
        createdAt: daysAgo(30),
        updatedAt: daysAgo(10),
      },
      {
        id: randomUUID(),
        userId,
        category: 'credential',
        title: 'Banco Inter',
        url: 'https://banco.inter.com.br',
        username: '12345678900',
        passwordEnc: encrypt('MinhaSenha123!', encKey),
        createdAt: daysAgo(60),
        updatedAt: daysAgo(15),
      },
      {
        id: randomUUID(),
        userId,
        category: 'credential',
        title: 'Netflix',
        url: 'https://netflix.com',
        username: 'admin@lifeos.com',
        passwordEnc: encrypt('Netflix@2026', encKey),
        createdAt: daysAgo(90),
        updatedAt: daysAgo(45),
      },
      {
        id: randomUUID(),
        userId,
        category: 'secure_note',
        title: 'Número do seguro do carro',
        contentEnc: encrypt(
          'Apólice: 12345-678\nVigência: 01/01/2026 a 31/12/2026\nSeguradora: Porto Seguro\nAssistência 24h: 0800-123-4567',
          encKey,
        ),
        createdAt: daysAgo(20),
        updatedAt: daysAgo(20),
      },
      {
        id: randomUUID(),
        userId,
        category: 'secure_note',
        title: 'Combinação do cofre físico',
        contentEnc: encrypt('Gire para direita 3x, esquerda 2x, direita 1x. Termina em 47.', encKey),
        createdAt: daysAgo(100),
        updatedAt: daysAgo(100),
      },
      {
        id: randomUUID(),
        userId,
        category: 'api_key',
        title: 'OpenAI',
        provider: 'OpenAI',
        tokenEnc: encrypt('EXAMPLE-OPENAI-PLACEHOLDER-DO-NOT-USE', encKey),
        createdAt: daysAgo(15),
        updatedAt: daysAgo(5),
      },
      {
        id: randomUUID(),
        userId,
        category: 'api_key',
        title: 'Stripe (produção)',
        provider: 'Stripe',
        tokenEnc: encrypt('EXAMPLE-STRIPE-PLACEHOLDER-DO-NOT-USE', encKey),
        createdAt: daysAgo(50),
        updatedAt: daysAgo(20),
      },
    ])
  }

  private async seedFinance(userId: string) {
    const expenseCategoryIds = {
      moradia: randomUUID(),
      alimentacao: randomUUID(),
      transporte: randomUUID(),
      saude: randomUUID(),
      lazer: randomUUID(),
      educacao: randomUUID(),
      contas: randomUUID(),
    }
    const incomeCategoryIds = {
      salario: randomUUID(),
      freelance: randomUUID(),
    }

    await db.insert(financeCategories).values([
      { id: expenseCategoryIds.moradia, name: 'Moradia', type: 'expense', color: '#6366f1' },
      { id: expenseCategoryIds.alimentacao, name: 'Alimentação', type: 'expense', color: '#f59e0b' },
      { id: expenseCategoryIds.transporte, name: 'Transporte', type: 'expense', color: '#06b6d4' },
      { id: expenseCategoryIds.saude, name: 'Saúde', type: 'expense', color: '#ef4444' },
      { id: expenseCategoryIds.lazer, name: 'Lazer', type: 'expense', color: '#ec4899' },
      { id: expenseCategoryIds.educacao, name: 'Educação', type: 'expense', color: '#8b5cf6' },
      { id: expenseCategoryIds.contas, name: 'Contas e Serviços', type: 'expense', color: '#64748b' },
      { id: incomeCategoryIds.salario, name: 'Salário', type: 'income', color: '#16a34a' },
      { id: incomeCategoryIds.freelance, name: 'Freelance', type: 'income', color: '#22c55e' },
    ])

    const transactions = [
      { description: 'Aluguel', amount: 2200, type: 'expense' as const, category: 'moradia', date: daysAgo(20), installments: 1, isFixed: true },
      { description: 'Condomínio', amount: 450, type: 'expense' as const, category: 'moradia', date: daysAgo(20), installments: 1, isFixed: true },
      { description: 'Conta de luz', amount: 185, type: 'expense' as const, category: 'contas', date: daysAgo(18), installments: 1, isFixed: true },
      { description: 'Conta de água', amount: 95, type: 'expense' as const, category: 'contas', date: daysAgo(15), installments: 1, isFixed: true },
      { description: 'Internet fibra', amount: 129, type: 'expense' as const, category: 'contas', date: daysAgo(12), installments: 1, isFixed: true },
      { description: 'Supermercado', amount: 380, type: 'expense' as const, category: 'alimentacao', date: daysAgo(10), installments: 1, isFixed: false },
      { description: 'iFood', amount: 65, type: 'expense' as const, category: 'alimentacao', date: daysAgo(8), installments: 1, isFixed: false },
      { description: 'Uber', amount: 45, type: 'expense' as const, category: 'transporte', date: daysAgo(7), installments: 1, isFixed: false },
      { description: 'Combustível', amount: 250, type: 'expense' as const, category: 'transporte', date: daysAgo(6), installments: 1, isFixed: false },
      { description: 'Cinema com amigos', amount: 80, type: 'expense' as const, category: 'lazer', date: daysAgo(5), installments: 1, isFixed: false },
      { description: 'Plano de saúde', amount: 520, type: 'expense' as const, category: 'saude', date: daysAgo(4), installments: 1, isFixed: true },
      { description: 'Curso online', amount: 297, type: 'expense' as const, category: 'educacao', date: daysAgo(3), installments: 3, isFixed: false },
      { description: 'Farmácia', amount: 48, type: 'expense' as const, category: 'saude', date: daysAgo(2), installments: 1, isFixed: false },
      { description: 'Salário', amount: 8500, type: 'income' as const, category: 'salario', date: daysAgo(15), installments: 1, isFixed: true },
      { description: 'Freelance landing page', amount: 1800, type: 'income' as const, category: 'freelance', date: daysAgo(8), installments: 1, isFixed: false },
      { description: 'Padaria', amount: 28, type: 'expense' as const, category: 'alimentacao', date: daysAgo(1), installments: 1, isFixed: false },
    ]

    const expenseMap = expenseCategoryIds as Record<string, string>
    const incomeMap = incomeCategoryIds as Record<string, string>

    const txRecords = transactions.map((t) => ({
      id: randomUUID(),
      userId,
      type: t.type,
      description: t.description,
      totalAmount: t.amount.toFixed(2),
      installmentsCount: t.installments,
      categoryId: t.type === 'expense' ? expenseMap[t.category] : incomeMap[t.category],
      source: 'principal' as const,
      isFixed: t.isFixed,
      createdAt: t.date,
      updatedAt: t.date,
    }))

    await db.insert(financeTransactions).values(txRecords)

    const ccExpenses = [
      { description: 'Notebook Dell', total: 4500, myShare: 2250, daysBack: 12, launched: true },
      { description: 'Jantar romântico', total: 320, myShare: 160, daysBack: 8, launched: false },
      { description: 'Assinatura Adobe', total: 119, myShare: 59.5, daysBack: 5, launched: true },
      { description: 'Curso Udemy', total: 199, myShare: 99.5, daysBack: 2, launched: false },
    ]

    await db.insert(financeCreditCardExpenses).values(
      ccExpenses.map((cc) => ({
        id: randomUUID(),
        userId,
        description: cc.description,
        totalAmount: cc.total.toFixed(2),
        myShareAmount: cc.myShare.toFixed(2),
        date: dateOnly(daysAgo(cc.daysBack)),
        launchedInMain: cc.launched,
        linkedTransactionId: null,
        createdAt: daysAgo(cc.daysBack),
        updatedAt: daysAgo(cc.daysBack),
      })),
    )
  }

  private async seedStudies(userId: string) {
    const course1Id = randomUUID()
    const course2Id = randomUUID()

    await db.insert(studyCourses).values([
      {
        id: course1Id,
        userId,
        name: 'TypeScript Avançado',
        position: '1',
        createdAt: daysAgo(30),
        updatedAt: daysAgo(1),
      },
      {
        id: course2Id,
        userId,
        name: 'Design System com Figma',
        position: '2',
        createdAt: daysAgo(20),
        updatedAt: daysAgo(3),
      },
    ])

    const modules = [
      { id: randomUUID(), courseId: course1Id, name: 'Tipos Genéricos', position: '1' },
      { id: randomUUID(), courseId: course1Id, name: 'Decorators', position: '2' },
      { id: randomUUID(), courseId: course1Id, name: 'Type Guards', position: '3' },
      { id: randomUUID(), courseId: course2Id, name: 'Tokens e Variáveis', position: '1' },
      { id: randomUUID(), courseId: course2Id, name: 'Componentes Reutilizáveis', position: '2' },
    ]

    await db.insert(studyModules).values(
      modules.map((m) => ({
        id: m.id,
        courseId: m.courseId,
        userId,
        name: m.name,
        position: m.position,
        createdAt: daysAgo(20),
        updatedAt: daysAgo(2),
      })),
    )

    const pages = [
      { moduleId: modules[0].id, title: 'Introdução a Generics', content: '# Generics\n\nPermitem criar componentes reutilizáveis com tipagem forte.\n\n```ts\nfunction identity<T>(value: T): T { return value; }\n```', position: '1' },
      { moduleId: modules[0].id, title: 'Constraints', content: '# Constraints\n\nLimitam os tipos aceitos:\n\n```ts\nfunction getName<T extends { name: string }>(obj: T): string {\n  return obj.name;\n}\n```', position: '2' },
      { moduleId: modules[1].id, title: 'Class Decorators', content: '# Decorators\n\nPermitem metaprogramação. Exemplo:\n\n```ts\nfunction sealed(constructor: Function) { Object.seal(constructor); }\n```', position: '1' },
      { moduleId: modules[2].id, title: 'typeof guard', content: '# Type Guards\n\n```ts\nfunction isString(value: unknown): value is string {\n  return typeof value === "string";\n}\n```', position: '1' },
      { moduleId: modules[3].id, title: 'Design Tokens', content: '# Tokens\n\nVariáveis CSS que centralizam valores de cor, tipografia e espaçamento.', position: '1' },
      { moduleId: modules[4].id, title: 'Composição de Componentes', content: '# Composição\n\nCrie componentes pequenos e combine-os. Use slots/props para flexibilidade.', position: '1' },
    ]

    await db.insert(studyPages).values(
      pages.map((p) => ({
        id: randomUUID(),
        moduleId: p.moduleId,
        userId,
        title: p.title,
        content: p.content,
        position: p.position,
        createdAt: daysAgo(15),
        updatedAt: daysAgo(1),
      })),
    )
  }

  private async seedHabitsAndRecords(userId: string) {
    const habits = [
      { name: 'Exercitar 30min', icon: 'Activity' },
      { name: 'Ler 20 páginas', icon: 'BookOpen' },
      { name: 'Meditar', icon: 'Brain' },
      { name: 'Beber 2L de água', icon: 'Droplet' },
      { name: 'Dormir antes das 23h', icon: 'Moon' },
    ]

    const habitIds = habits.map((h) => randomUUID())

    await db.insert(trackerHabits).values(
      habits.map((h, i) => ({
        id: habitIds[i],
        userId,
        name: h.name,
        icon: h.icon,
        position: String(i + 1),
        archived: false,
        createdAt: daysAgo(20),
        updatedAt: daysAgo(1),
      })),
    )

    const records: Array<{
      id: string
      habitId: string
      userId: string
      date: string
      completed: boolean
      energy: 'low' | 'medium' | 'high' | null
      quality: 'weak' | 'ok' | 'strong' | null
    }> = []

    for (let day = 6; day >= 0; day--) {
      const date = dateOnly(daysAgo(day))
      const dayEnergy: 'low' | 'medium' | 'high' = day === 2 ? 'low' : day === 5 ? 'high' : 'medium'
      const dayQuality: 'weak' | 'ok' | 'strong' = day === 2 ? 'weak' : day === 5 ? 'strong' : 'ok'

      habitIds.forEach((habitId, idx) => {
        const completed = !(day === 0 && idx === 4) && !(day === 3 && idx === 2)
        records.push({
          id: randomUUID(),
          habitId,
          userId,
          date,
          completed,
          energy: idx === 0 ? dayEnergy : null,
          quality: idx === 0 ? dayQuality : null,
        })
      })
    }

    await db.insert(trackerRecords).values(records)
  }
}
