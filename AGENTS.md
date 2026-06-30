# Life OS — Project Agent Guide

## Multi-Agent Workflow

Este projeto usa dois agentes com responsabilidades separadas:

- **opencode** → backend (`api/`)
- **antigravity cli** → frontend (`web/`)

## Comunicação entre agentes

A comunicação entre agentes é feita via arquivos de spec em `.specs/`:

```
los/
├── .specs/
│   ├── auth.md          ← contrato do módulo login
│   └── cofre.md         ← contrato do módulo cofre
├── api/                 ← backend (opencode)
├── web/                 ← frontend (antigravity)
└── swagger.json         ← gerado via pnpm swagger
```

### Fluxo

1. **Backend implementa** → spec é criada/atualizada em `.specs/<modulo>.md`
2. **Swagger gerado** → `pnpm swagger` em `api/`
3. **Frontend consome** → agente lê `.specs/<modulo>.md` + design no Pencil

### Prompt padrão para o agente de frontend

```
Leia .specs/<modulo>.md e implemente o frontend conforme o design no Pencil em
C:\Users\felip\Documents\eu_memo\www\los\design, módulo "<Nome do Módulo>".

O backend já está rodando em http://localhost:3333.
O Vite em web/vite.config.ts já faz proxy de /auth, /cofre, /notes, /tasks, /courses, /modules, /pages, /tracker e /finance.
```

## Design (Pencil)

Arquivo: `C:\Users\felip\Documents\eu_memo\www\los\design`

| Módulo | Node ID | Nome |
|--------|---------|------|
| Login | `Fvjfv` | Módulo Login |
| Dashboard | `pogZh` | Módulo Dashboard |
| Cofre | `C5hXs` | Módulo Cofre |
| Organização | `GHgxZ` | Módulo Organização |

## Domínio (CONTEXT.md)

`CONTEXT.md` na raiz contém o glossário de termos do Life OS. Usar os termos canônicos em specs e código.

## Convenções

### Backend (api/)
- Stack: Fastify 5 + Zod 4 + Drizzle ORM + PostgreSQL
- Auth: JWT via cookies httpOnly (nenhum token exposto ao frontend)
- Arquitetura: Clean Architecture (controllers → use-cases → repositories)
- Testes: Vitest (unitários) + supertest (e2e)
- Guia detalhado: `api/AGENTS.md`

### Frontend (web/)
- Stack: React + Vite + Tailwind + TanStack Router
- Proxy: `/auth/*` e `/cofre/*` → `http://localhost:3333`
- **Regra de Design:** Sempre criar ou modificar os designs no Pencil primeiro antes de programar o frontend ou criar componentes.
- **Regra de Commit/Escopo:** O agente frontend só pode realizar commits e alterações dentro da pasta `web/`. É estritamente proibido mexer na pasta `api/` (que é responsabilidade do opencode).
- **Permissão de Commit:** Não faça commits ou push de forma automática. Sempre peça permissão explícita ao usuário antes de realizar qualquer commit/push.
