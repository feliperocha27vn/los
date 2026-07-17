import { db } from '@lib/db'
import {
  cofreEntries,
  financeCategories,
  financeCreditCardExpenses,
  financeTransactions,
  notes,
  studyCourses,
  studyModules,
  studyPages,
  tasks,
  trackerHabits,
  trackerRecords,
} from '@db/schema'
import { sql } from 'drizzle-orm'
import { EnsureSeedUseCase } from '../src/use-cases/ensure-seed'

const force = process.argv.includes('--force') || process.argv.includes('-f')

const useCase = new EnsureSeedUseCase()
const result = await useCase.execute({
  email: process.env.ADMIN_EMAIL,
  password: process.env.ADMIN_PASSWORD,
  pin: process.env.ADMIN_PIN,
  name: process.env.ADMIN_NAME,
  force,
})

if (result.seeded) {
  console.log('\n✓ Seed concluída com sucesso\n')
  console.log('  User:        ' + result.email)
  console.log('  Password:    ' + (process.env.ADMIN_PASSWORD || '12345678'))
  console.log('  Cofre PIN:   ' + (process.env.ADMIN_PIN || '123456'))
  console.log()
  console.log('  Dados populados:')
  console.log('   • 6 notas')
  console.log('   • 9 tarefas (4 todo, 2 in_progress, 3 done)')
  console.log('   • 7 entradas no cofre (3 credenciais, 2 notas, 2 API keys)')
  console.log('   • 9 categorias financeiras + 16 transações + 4 despesas de cartão')
  console.log('   • 2 cursos, 5 módulos, 6 páginas de estudo')
  console.log('   • 5 hábitos + 35 registros (7 dias)')
  console.log()
} else {
  console.log(`User já existe (${result.email}), seed ignorada.`)
  console.log('  Use `pnpm seed --force` para limpar e re-popular.')
  console.log()
  const tables = [
    { label: 'notas', table: notes },
    { label: 'tarefas', table: tasks },
    { label: 'cofre', table: cofreEntries },
    { label: 'transações', table: financeTransactions },
    { label: 'cartão', table: financeCreditCardExpenses },
    { label: 'categorias', table: financeCategories },
    { label: 'cursos', table: studyCourses },
    { label: 'módulos', table: studyModules },
    { label: 'páginas', table: studyPages },
    { label: 'hábitos', table: trackerHabits },
    { label: 'registros', table: trackerRecords },
  ]
  const counts = await Promise.all(
    tables.map(async ({ table }) => {
      const result = await db.select({ value: sql`count(*)::int` }).from(table)
      return Number(result[0]?.value ?? 0)
    }),
  )
  console.log('  Estado atual:')
  tables.forEach((t, i) => console.log(`   • ${counts[i]} ${t.label}`))
  console.log()
}
process.exit(0)
