import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { sql } from 'drizzle-orm'
import { db } from './lib/db.js'

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

async function runMigrations() {
  console.log('[start] running migrations...')
  await ensureMigrationsTable()
  const applied = await getApplied()

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  let count = 0
  for (const file of files) {
    if (applied.has(file)) continue
    await applyFile(file)
    count++
  }

  if (count === 0) console.log('[start] no new migrations')
  else console.log(`[start] ${count} migration(s) applied`)
}

try {
  await runMigrations()
} catch (e) {
  console.error('[start] migration failed:', e)
  process.exit(1)
}

await import('./server.js')
