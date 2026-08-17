// Dispara um deploy na Coolify e acompanha até o fim.
//
// Uso:
//   pnpm deploy:coolify           # deploy normal (aproveita o cache de build)
//   pnpm deploy:coolify --force   # rebuild sem cache
//
// Env (api/.env localmente, ou o ambiente do CI):
//   COOLIFY_BASE_URL    ex.: https://coolify.seu-dominio.com
//   COOLIFY_API_TOKEN   token com permissão `deploy` + `read`
//   COOLIFY_APP_UUID    uuid do recurso no Coolify — é o stack compose inteiro
//                       (postgres + api), não só a API
//   COOLIFY_HEALTH_URL  opcional; ex.: https://api.votipet.tech/health
//                       Se definido, o script bate nele no fim — é o que prova
//                       de verdade que a API subiu. Sem ele, sobra o status
//                       que o próprio Coolify reporta.

const POLL_INTERVAL_MS = 10_000
const MAX_POLL_MINUTES = 15
const MAX_CONSECUTIVE_ERRORS = 5
const HEALTH_ATTEMPTS = 12
const HEALTH_INTERVAL_MS = 5_000
const LOG_TAIL_LINES = 80

interface Deployment {
  status?: string
  commit?: string
  logs?: string
}

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

function fail(message: string): never {
  console.error(`❌ ${message}`)
  process.exit(1)
}

function requiredEnv(name: string): string {
  const value = process.env[name]
  if (!value) fail(`Variável de ambiente ${name} não definida`)
  return value
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sleep(ms: number): Promise<void> {
  return new Promise((done) => setTimeout(done, ms))
}

const BASE_URL = requiredEnv('COOLIFY_BASE_URL').replace(/\/$/, '')
const API_TOKEN = requiredEnv('COOLIFY_API_TOKEN')
const APP_UUID = requiredEnv('COOLIFY_APP_UUID')
const HEALTH_URL = process.env.COOLIFY_HEALTH_URL
const force = process.argv.includes('--force') || process.argv.includes('-f')

async function api<T>(path: string, method: 'GET' | 'POST' = 'GET'): Promise<T> {
  const response = await fetch(`${BASE_URL}/api/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${API_TOKEN}`, Accept: 'application/json' },
  })

  const text = await response.text()
  let data: unknown

  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }

  if (!response.ok) {
    throw new HttpError(
      response.status,
      `Coolify retornou ${response.status}: ${JSON.stringify(data)}`,
    )
  }

  return data as T
}

async function triggerDeploy(): Promise<string> {
  console.log(`🚀 Disparando deploy${force ? ' (rebuild sem cache)' : ''}...`)

  // A Coolify aceita query params ou body JSON aqui; query param funciona
  // também nas versões mais antigas, então é o caminho seguro.
  const query = new URLSearchParams({ uuid: APP_UUID, force: String(force) })
  const result = await api<{ deployments?: Array<{ deployment_uuid?: string }> }>(
    `/deploy?${query}`,
    'POST',
  )

  const deploymentUuid = result.deployments?.[0]?.deployment_uuid
  if (!deploymentUuid) {
    fail(`Resposta da Coolify não trouxe deployment_uuid: ${JSON.stringify(result)}`)
  }

  console.log(`✅ Deploy enfileirado: ${deploymentUuid}`)
  return deploymentUuid
}

function formatLogs(logsJson: string | undefined): string {
  if (!logsJson) return '(sem logs)'

  let lines: string[]
  try {
    const parsed = JSON.parse(logsJson) as Array<{ timestamp?: string; output?: string }>
    lines = parsed.map((entry) => `[${entry.timestamp ?? '?'}] ${entry.output ?? ''}`)
  } catch {
    lines = logsJson.split('\n')
  }

  const tail = lines.slice(-LOG_TAIL_LINES)
  const omitted = lines.length - tail.length
  return omitted > 0
    ? `... (${omitted} linhas anteriores omitidas)\n${tail.join('\n')}`
    : tail.join('\n')
}

async function waitForDeployment(uuid: string): Promise<void> {
  const deadline = Date.now() + MAX_POLL_MINUTES * 60_000
  let consecutiveErrors = 0
  let lastStatus = ''

  while (Date.now() < deadline) {
    // Espera antes da primeira consulta: o registro do deploy leva um instante
    // pra ficar visível na API depois do enfileiramento.
    await sleep(POLL_INTERVAL_MS)

    let deployment: Deployment
    try {
      deployment = await api<Deployment>(`/deployments/${uuid}`)
      consecutiveErrors = 0
    } catch (error) {
      // Um 502 do proxy no meio de um build pesado não significa deploy
      // quebrado — só desiste depois de algumas falhas seguidas.
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
        fail(`${MAX_CONSECUTIVE_ERRORS} falhas seguidas ao consultar o deploy: ${describe(error)}`)
      }
      console.warn(
        `⚠️  Falha ao consultar (${consecutiveErrors}/${MAX_CONSECUTIVE_ERRORS}): ${describe(error)}`,
      )
      continue
    }

    const status = deployment.status ?? 'queued'
    if (status !== lastStatus) {
      console.log(`⏳ Status: ${status}`)
      lastStatus = status
    }

    if (status === 'finished') {
      console.log('✅ Deploy finalizado com sucesso!')
      console.log(`   Commit: ${deployment.commit ?? 'n/a'}`)
      return
    }

    if (status === 'failed' || status === 'cancelled-by-user') {
      const label = status === 'failed' ? 'Deploy falhou' : 'Deploy cancelado pelo usuário'
      console.error(`\n❌ ${label}.`)
      console.error('\n--- Últimos logs ---\n')
      console.error(formatLogs(deployment.logs))
      process.exit(1)
    }
  }

  fail(`Timeout: deploy não finalizou em ${MAX_POLL_MINUTES} minutos`)
}

async function checkHealth(): Promise<void> {
  if (!HEALTH_URL) {
    // Sem URL pública configurada, o melhor disponível é o status do recurso
    // no painel. Só lista applications — se o recurso tiver sido criado como
    // "Service" no Coolify, ele não aparece aqui.
    try {
      const apps = await api<Array<{ uuid: string; status: string }>>('/applications')
      const app = apps.find((a) => a.uuid === APP_UUID)
      if (!app) {
        console.warn('⚠️  Recurso não encontrado em /applications (foi criado como Service?)')
        console.warn('   Defina COOLIFY_HEALTH_URL para validar o boot de verdade.')
        return
      }
      console.log(`🏥 Recurso: ${app.status}`)
    } catch (error) {
      console.warn(`⚠️  Não foi possível verificar o status do recurso: ${describe(error)}`)
    }
    return
  }

  console.log(`🏥 Verificando ${HEALTH_URL}...`)

  for (let attempt = 1; attempt <= HEALTH_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(HEALTH_URL, { headers: { Accept: 'application/json' } })
      if (response.ok) {
        console.log(`✅ API respondendo (${response.status})`)
        return
      }
      console.log(`   tentativa ${attempt}/${HEALTH_ATTEMPTS}: HTTP ${response.status}`)
    } catch (error) {
      console.log(`   tentativa ${attempt}/${HEALTH_ATTEMPTS}: ${describe(error)}`)
    }
    if (attempt < HEALTH_ATTEMPTS) await sleep(HEALTH_INTERVAL_MS)
  }

  fail(`API não respondeu em ${HEALTH_URL} após ${HEALTH_ATTEMPTS} tentativas`)
}

const deploymentUuid = await triggerDeploy()
await waitForDeployment(deploymentUuid)
await checkHealth()
