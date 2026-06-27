# Controllers — Convenções

Pasta `src/http/controllers/`. Aqui vivem as rotas HTTP da API.

## Regra: 1 rota por arquivo

Cada endpoint HTTP vive em **seu próprio arquivo** dentro de `src/http/controllers/<recurso>/`.

Nomes de arquivo:
- `get-<recurso>.ts` — GET list
- `get-<recurso>-<id>.ts` — GET detail
- `post-<recurso>.ts` — POST create
- `put-<recurso>-<id>.ts` — PUT update
- `patch-<recurso>-<id>-<action>.ts` — PATCH actions (reorder, restore, move, unlock, lock)
- `delete-<recurso>-<id>.ts` — DELETE

Cada arquivo exporta uma `function xxxRoute(deps): FastifyPluginAsyncZod` que recebe dependências (repositories) por argumento e retorna um plugin Fastify.

**NUNCA** coloque mais de uma rota no mesmo arquivo. **NUNCA** misture schemas, helpers de response e rotas no mesmo arquivo.

## Schemas e helpers de response

Schemas Zod ficam **inline** no bloco `schema:` de cada rota (não extrair).

Helpers de response (schemas reutilizáveis e funções `toResponse`) ficam em arquivos `<recurso>-response.ts` separados:
- `task-response.ts`
- `habit-response.ts`
- `record-response.ts`
- `page-response.ts`
- `module-response.ts`
- `course-response.ts`
- `cofre-auth.ts` (contém hooks e helpers de auth do cofre)

Esses helpers são importados pelas rotas — não pelo controller.

## Composição: `index.routes.ts`

Cada pasta de controller tem um arquivo `index.routes.ts` que exporta uma função `register<Recurso>Routes(app, ...repos)` que:

1. Faz `app.register(getXxxRoute(repo))` para cada rota
2. Pode também `app.register(hookPlugin)` para hooks de escopo
3. Não retorna nada (`void`)

`app.register()` retorna `FastifyInstance` para chaining, então prefira o formato encadeado:

```ts
// exemplo: src/http/controllers/tasks/index.routes.ts
import type { FastifyInstance } from 'fastify'
import { getTasksRoute } from './get-tasks'
import { getTaskDetailRoute } from './get-task-detail'
// ... outras rotas
import type { TasksRepository } from '@repositories/tasks-repository'

export function registerTasksRoutes(
  app: FastifyInstance,
  tasksRepository: TasksRepository
): void {
  app
    .register(getTasksRoute(tasksRepository))
    .register(getTaskDetailRoute(tasksRepository))
    // ... outras rotas
}
```

**NÃO** crie arquivos `<recurso>-controller.ts` que apenas compõem rotas. Toda composição vai em `index.routes.ts`.

## Composition root: `index.ts`

`src/http/controllers/index.ts` é o composition root. Ele importa os `register<Recurso>Routes` de cada pasta e chama cada um dentro do `app.register()` da função `controllers()`. Também instancia os `InMemory*` repositories como fallbacks.

## Exceções: hooks globais

Se uma pasta precisa de um hook que se aplica a todas as suas rotas (ex: `preHandler` do cofre que valida `cofre_token`), o hook **deve ser registrado dentro do escopo do mesmo `app.register()` que registra as rotas** — caso contrário, o hook não é disparado para as rotas.

Exemplo correto (em `cofre-auth.ts`):
```ts
export function cofreRoutes(deps): FastifyPluginAsync {
  return async (app) => {
    app.addHook('preHandler', async (request, reply) => { /* ... */ })
    app.post('/cofre/unlock', { /* ... */ })
    // ... outras rotas
  }
}
```

## Estrutura final

```
src/http/controllers/
  auth/
    post-auth-login.ts
    get-auth-me.ts
    post-auth-logout.ts
    index.routes.ts
    e2e-helpers.ts
    post-auth-login.e2e.spec.ts
    get-auth-me.e2e.spec.ts
    post-auth-logout.e2e.spec.ts
  cofre/
    cofre-auth.ts (contém hook + todas as rotas do cofre, pois precisam estar no mesmo escopo)
    index.routes.ts
    e2e-helpers.ts
    post-cofre-unlock.e2e.spec.ts
    post-cofre-unlock-invalid.e2e.spec.ts
    get-cofre-entries.e2e.spec.ts
    get-cofre-entry-detail.e2e.spec.ts
    post-cofre-entry.e2e.spec.ts
    delete-cofre-entry.e2e.spec.ts
  notes/
    get-notes.ts
    get-note-detail.ts
    post-note.ts
    put-note.ts
    delete-note.ts
    index.routes.ts
    e2e-helpers.ts
    <...>.e2e.spec.ts
  tasks/
    task-response.ts
    get-tasks.ts
    ... (uma rota por arquivo)
    index.routes.ts
    e2e-helpers.ts
    <...>.e2e.spec.ts
  study-courses/  study-modules/  study-pages/   tracker/
    (mesma estrutura)
  index.ts (composition root)
```

## Testes E2E: 1 arquivo por rota

Cada arquivo `.e2e.spec.ts` cobre **uma** rota (ou um grupo de rotas intimamente relacionadas como unlock + lock). Helpers compartilhados (setup do app, login) ficam em `e2e-helpers.ts`.

## Regras finais

- **NUNCA** mais de uma rota por arquivo
- **NUNCA** schemas ou helpers de response dentro do mesmo arquivo de rota
- **NUNCA** arquivos `<recurso>-controller.ts` para composição — usar `index.routes.ts`
- Schemas Zod **inline** no bloco `schema:`
- Erros: `instanceof` + `reply.status().send({ message })`
- Testes e2e: 1 arquivo por rota, com helper compartilhado em `e2e-helpers.ts`
