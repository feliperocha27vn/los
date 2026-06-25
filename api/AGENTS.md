# los-api — Agentes de Backend

## Escopo do agente

**Você é o agente de backend.** Suas responsabilidades são:

- Implementar e manter apenas a pasta `api/`
- **Nunca** criar, editar ou deletar arquivos fora de `api/`
- O frontend (`web/`) é responsabilidade de outro agente
- Mudanças em `web/vite.config.ts` (proxy) podem ser feitas aqui, **apenas** quando o backend adicionar/remover uma rota — depois descrever o que mudou para o agente de frontend

### Regra de commit

Commits devem conter **apenas arquivos dentro de `api/`**. Exceções:

- `.specs/<modulo>.md` (contratos para o agente de frontend)
- `AGENTS.md` na raiz (workflow multi-agente)
- `api/AGENTS.md` (este arquivo)
- `web/vite.config.ts` (apenas quando adicionar/renomear/rotas do backend)

Sempre descreva no commit e na spec correspondente o que o frontend precisa atualizar.

## Stack

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Runtime | Node.js 20+ (ESM) |
| HTTP | Fastify 5 + `fastify-type-provider-zod` |
| Validação | Zod 4 (schemas inline nos controllers) |
| ORM | Drizzle ORM + PostgreSQL 17 |
| Auth | `@fastify/jwt` + `@fastify/cookie` (httpOnly cookies) |
| Hash | `@node-rs/bcrypt` |
| Testes | Vitest + supertest |
| Lint/Format | Biome |
| Package | pnpm |

## Arquitetura (Clean Architecture em Camadas)

```
src/
  app.ts            ← factory createApp(usersRepository)
  server.ts         ← entry point
  env.ts            ← Zod-validated env
  errors/           ← classes de erro de domínio
  http/controllers/ ← FastifyPluginAsyncZod, schemas inline, thin
  middlewares/      ← hooks cross-cutting
  factories/        ← composition root (DI manual)
  use-cases/        ← lógica de negócio (framework-independent)
  repositories/     ← contratos (interfaces)
    adapters/drizzle/ ← implementações Drizzle
  in-memory/        ← test doubles para testes unitários
  db/schema/        ← schemas Drizzle
  lib/              ← client DB, utilitários
```

## Regras

### Controllers
- Sempre `FastifyPluginAsyncZod` com `export const`
- Schemas Zod **inline** no bloco `schema:`, nunca extraídos
- Desestruturar `request.body`, `request.params`, `request.query`
- `schema.tags` e `schema.summary` sempre presentes
- Erros: `instanceof` + `reply.status().send({ message })`

### Segurança
- Token JWT via cookie `httpOnly`, `SameSite=Lax`, `Secure` em produção
- Hook global `preHandler` em `app.ts` protege todas as rotas
- Rotas públicas usam `config: { public: true }` no schema
- Senhas: bcrypt, mínimo 8 caracteres

### Testes (TDD)
- **Unitários**: colocalizados com use-cases, usam `in-memory/` repositories
- **E2E**: colocalizados com controllers, usam `supertest` + app real com in-memory repo
- Setup e2e: `src/test/e2e-setup.ts` (define `JWT_SECRET`, `NODE_ENV`)

### Path Aliases
| Alias | Path |
|-------|------|
| `@factories/*` | `src/factories/*` |
| `@use-cases/*` | `src/use-cases/*` |
| `@repositories/*` | `src/repositories/*` |
| `@errors/*` | `src/errors/*` |
| `@http/*` | `src/http/*` |
| `@in-memory/*` | `src/in-memory/*` |
| `@db/*` | `src/db/*` |
| `@lib/*` | `src/lib/*` |
| `@middlewares/*` | `src/middlewares/*` |
| `@utils/*` | `src/utils/*` |

## Comandos

```bash
pnpm dev              # servidor dev com hot reload
pnpm test:run         # testes unitários
pnpm test:e2e         # testes e2e
pnpm swagger          # gera swagger.json
pnpm db:generate      # gera migração Drizzle
pnpm db:migrate       # aplica migração
pnpm db:studio        # Drizzle Studio
pnpm lint             # Biome lint
pnpm format           # Biome format
pnpm check            # Biome check (lint + format)
```

## Fluxo de dependências

```
controller → factory → use-case → repository contract → adapter (Drizzle)
                                                      → in-memory (testes)
```

- Controllers são thin, nunca chamam ORM direto
- Use-cases recebem dependências por construtor
- Factories são o composition root
- Repository é interface primeiro, implementação depois
