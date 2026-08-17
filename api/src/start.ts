// Entrypoint de conveniência para desenvolvimento local: migra, semeia e sobe o
// servidor no mesmo processo. Em produção (Cloud Run) NÃO use este arquivo — lá
// as migrations rodam num Job separado (dist/migrate.js) e o serviço sobe
// direto por dist/server.js.
import { reportStartupError, runMigrations, runSeed } from './bootstrap.js'

try {
  await runMigrations()
  await runSeed()
} catch (e) {
  reportStartupError(e)
  process.exit(1)
}

await import('./server.js')
