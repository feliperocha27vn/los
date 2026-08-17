# los-web

Frontend do Life OS. React 19 + Vite + TanStack Router + Tailwind 4.

Este é o escopo do **agente de frontend** (antigravity cli). A pasta `api/` é de outro agente — ver `AGENTS.md` na raiz.

## Rodar localmente

```bash
pnpm dev      # Vite em http://localhost:5173 (cai para 5174+ se a porta estiver ocupada)
pnpm build    # tsc -b && vite build
pnpm test     # Vitest
pnpm lint     # oxlint
```

O backend precisa estar em `http://localhost:3333`. O Vite faz proxy das rotas da API (`vite.config.ts` → `server.proxy`): `/auth`, `/cofre`, `/notes`, `/tasks`, `/courses`, `/modules`, `/pages`, `/tracker`, `/finance`, `/series`.

> **Ao adicionar um módulo novo no backend, acrescente o prefixo da rota nesse proxy.** Sem isso a requisição sai para o próprio Vite e volta HTML em vez de JSON.

Em dev `VITE_API_URL` fica vazio, então o client usa caminhos relativos e o proxy resolve. Não crie `.env` local a não ser que queira apontar para outro backend.

## Deploy

**O Cloudflare Pages faz build e publica sozinho a cada push na `main`.** Não existe passo manual: `git push` é o deploy.

- Projeto no Pages: `los-web` (`wrangler.toml` → `pages_build_output_dir = "dist"`)
- `VITE_API_URL` é **build-time**: o Vite assa o valor no bundle. Ele mora versionado em `.env.production` (`https://api.votipet.tech`), não numa variável do dashboard — assim qualquer build produz o mesmo resultado. Para trocar o backend de produção, edite esse arquivo e faça push.
- `pnpm deploy` (`pnpm build && wrangler pages deploy`) existe como saída de emergência, para publicar sem passar pelo git. No fluxo normal não use.
- O `Dockerfile` daqui serve ao stack Docker Compose da raiz, um caminho de deploy alternativo ao Pages. Se você publica pelo Pages, ele não é exercitado.

O backend **não** acompanha esse push: a API é deployada à parte, na Coolify, via `pnpm deploy:coolify` dentro de `api/`.

## Cliente da API (Kubb)

Os hooks e tipos em `src/core/api/gen/` são **gerados** a partir de `../api/swagger.json`. Não edite nada nessa pasta.

```bash
cd ../api && pnpm swagger    # regenera o swagger.json a partir das rotas
cd ../web && pnpm exec kubb generate
pnpm dlx prettier --ignore-unknown --write src/core/api/gen
```

> **O passo do prettier não é opcional.** O Kubb tenta formatar com prettier ao final, mas prettier não está em `devDependencies` — o hook falha com um aviso fácil de ignorar e a saída sai sem formatação. Como os arquivos versionados *estão* formatados, um `kubb generate` puro reescreve dezenas de arquivos só em espaçamento e enterra o diff de verdade. Rode o prettier antes de olhar o `git status`.

## Estrutura

```
src/
  routes/      ← rotas do TanStack Router (arquivo = rota); routeTree.gen.ts é gerado
  layouts/     ← AppShell (Sidebar, nav mobile, tema, logout)
  features/    ← lógica de domínio de um módulo, testável fora da tela
  ui/          ← primitivos compartilhados (Button, Input, ConfirmModal)
  core/        ← auth, tema, sessão, client HTTP e o código gerado pelo Kubb
```

Aliases: `@core`, `@ui`, `@features`, `@layouts`, `@routes` (definidos em `vite.config.ts` e `vitest.config.ts` — mexeu num, mexa no outro).

### Rotas

| Rota | Módulo |
|------|--------|
| `/` | Login (deslogado) / Dashboard |
| `/financas` | Finanças |
| `/organizacao/notas` | Organização → Notas |
| `/midia` | Mídia (marcador de séries) |
| `/cofre` | Cofre |

Uma rota nova precisa de: o arquivo em `src/routes/`, a entrada na Sidebar **e** na nav mobile do `AppShell.tsx`, e o valor correspondente no union `activeTab`.

## Convenções

- **Design primeiro no Pencil**, antes de programar tela ou componente (regra em `AGENTS.md`). O MCP do Pencil exige o app desktop aberto.
- **Termos do domínio** vêm do `CONTEXT.md` da raiz. Use o termo canônico em nome de variável, label e texto de tela — "Marcador", não "progresso".
- **Contratos de backend** ficam em `.specs/<modulo>.md`. Leia antes de consumir um módulo novo.
- **Sem commit automático**: peça autorização explícita antes de commitar ou dar push.
- Commits deste agente contêm **apenas arquivos dentro de `web/`**.
