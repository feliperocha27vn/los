// Entrypoint de migration, separado do servidor.
//
// No Cloud Run o serviço escala a zero, então todo cold start reexecutaria as
// migrations se elas estivessem no boot — custo de vCPU e latência na primeira
// requisição, a cada vez. Aqui elas rodam como passo explícito (Cloud Run Job),
// e o serviço (dist/server.js) só serve.
import { reportStartupError, runMigrations, runSeed } from './bootstrap.js'

try {
  await runMigrations()
  await runSeed()
  console.log('[migrate] done')
  process.exit(0)
} catch (e) {
  reportStartupError(e)
  process.exit(1)
}
