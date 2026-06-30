import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { db } from './lib/db.js'
import { EnsureSeedUseCase } from './use-cases/ensure-seed.js'

const HERE = fileURLToPath(import.meta.url)
const MIGRATIONS_DIR = resolve(HERE, '..', '..', 'drizzle')

async function ensureMigrationsTable() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS _los_migrations (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `)
}

async function getApplied(): Promise<Set<string>> {
  const result = (await db.execute(sql`SELECT name FROM _los_migrations`)) as unknown as {
    rows?: Array<{ name: string }>
  }
  return new Set(result.rows?.map((r) => r.name) ?? [])
}

async function applyFile(filename: string): Promise<void> {
  const fullPath = resolve(MIGRATIONS_DIR, filename)
  const content = readFileSync(fullPath, 'utf-8')
  const statements = content
    .split('--> statement-breakpoint')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (const statement of statements) {
    try {
      await db.execute(sql.raw(statement))
    } catch (e) {
      const err = e as { cause?: { code?: string; message?: string }; code?: string; message?: string }
      // O driver embrulha o erro real do Postgres em DrizzleQueryError — o
      // código e a mensagem do Postgres (42710/23505/"already exists"/...)
      // vêm de err.cause, não de err (que só tem o texto da query falhada).
      const code = err.cause?.code ?? err.code
      const message = err.cause?.message ?? err.message
      if (
        code === '42710' || // duplicate_object
        code === '42P07' || // duplicate_table
        code === '42701' || // duplicate_column
        code === '42P06' || // duplicate_schema
        code === '23505' || // unique_violation (ex.: seed de categorias já inserido)
        (message && (
          message.includes('already exists') ||
          message.includes('does not exist') ||
          message.includes('constraint')
        ))
      ) {
        continue
      }
      throw e
    }
  }
  await db.execute(sql`INSERT INTO _los_migrations (name) VALUES (${filename})`)
  console.log(`[start] applied ${filename}`)
}

async function runMigrations() {
  console.log('[start] running migrations...')
  await ensureMigrationsTable()
  const applied = await getApplied()

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  // Sempre tenta aplicar todo arquivo ainda não registrado em _los_migrations —
  // nunca assume que "tabela já existe" significa "já está tudo aplicado".
  // Statements cujo objeto já existe (schema legado, aplicado por fora deste
  // runner) são ignorados individualmente pelo catch de applyFile; statements
  // realmente pendentes rodam de verdade. Marcar arquivos inteiros como
  // aplicados sem executá-los (como este código fazia antes) já deixou uma
  // coluna nova faltando em produção.
  let count = 0
  for (const file of files) {
    if (applied.has(file)) continue
    await applyFile(file)
    count++
  }

  if (count === 0) console.log('[start] no new migrations')
  else console.log(`[start] ${count} migration(s) applied`)
}

async function runSeed() {
  console.log('[start] checking seed...')
  const useCase = new EnsureSeedUseCase()
  const result = await useCase.execute({
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
    pin: process.env.ADMIN_PIN,
    name: process.env.ADMIN_NAME,
  })
  if (result.seeded) {
    console.log('')
    console.log('========================================')
    console.log(`[start] USER CREATED: ${result.email}`)
    console.log(`[start] password: ${process.env.ADMIN_PASSWORD || '12345678'}`)
    console.log(`[start] cofre pin: ${process.env.ADMIN_PIN || '123456'}`)
    console.log('========================================')
    console.log('')
  } else {
    console.log(`[start] user already exists (${result.email}), skipped seed`)
  }
}

try {
  await runMigrations()
  await runSeed()
} catch (e) {
  const err = e as { cause?: { code?: string; message?: string }; message?: string }
  if (err.cause?.code === '28P01' || err.message?.includes('password authentication')) {
    console.error('')
    console.error('==========================================================')
    console.error('[start] FATAL: PostgreSQL authentication failed')
    console.error('')
    console.error('The api service cannot connect to the postgres service.')
    console.error('This usually means the persistent volume los-postgres-data')
    console.error('was initialized with a different POSTGRES_PASSWORD than the')
    console.error('one currently in the api service env vars.')
    console.error('')
    console.error('Fix: stop the stack, DELETE the volume, redeploy.')
    console.error('  docker compose down -v   # deletes los-postgres-data')
    console.error('')
    console.error('After delete, the new volume will be created with the')
    console.error('POSTGRES_PASSWORD from your env vars, and the seed will run')
    console.error('automatically on first boot.')
    console.error('==========================================================')
    console.error('')
  } else {
    console.error('[start] startup failed:', e)
  }
  process.exit(1)
}

await import('./server.js')
