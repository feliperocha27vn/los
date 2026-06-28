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
      const err = e as { code?: string; message?: string }
      if (
        err.code === '42710' ||
        err.code === '42P07' ||
        err.code === '42701' ||
        err.code === '42P06' ||
        (err.message && (
          err.message.includes('already exists') ||
          err.message.includes('does not exist') ||
          err.message.includes('constraint')
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

async function isSchemaInitialized(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1 FROM users LIMIT 1`)
    return true
  } catch {
    return false
  }
}

async function runMigrations() {
  console.log('[start] running migrations...')
  await ensureMigrationsTable()
  const applied = await getApplied()

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  const schemaExists = await isSchemaInitialized()

  // DB legado: schema existe mas _los_migrations está vazio (migrations
  // rodaram antes deste start.ts existir). Marca todas como aplicadas.
  if (schemaExists && applied.size === 0) {
    console.log('[start] legacy schema detected, marking migrations as applied')
    for (const file of files) {
      await db.execute(
        sql`INSERT INTO _los_migrations (name) VALUES (${file}) ON CONFLICT (name) DO NOTHING`,
      )
    }
    console.log('[start] no new migrations')
    return
  }

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
