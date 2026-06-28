# Life OS

Aplicação de gestão de vida pessoal com módulos: Agenda, Finanças, Cofre, Tarefas (Kanban), Hábitos (Rastreador) e Estudos.

## Stack

- **Backend**: Fastify 5 + Drizzle ORM + PostgreSQL 17 + Zod 4
- **Frontend**: React 19 + Vite + TanStack Router + Tailwind 4
- **Notificações**: Telegram (polling)
- **Deploy**: Docker Compose

## Subir localmente (Docker)

```bash
# 1. Copie e configure as variáveis
cp .env.example .env

# 2. Gere secrets fortes para o JWT
echo "JWT_SECRET=$(openssl rand -hex 32)" >> .env
echo "COFRE_JWT_SECRET=$(openssl rand -hex 32)" >> .env

# (Opcional) Telegram
# echo "TELEGRAM_BOT_TOKEN=seu_token" >> .env
# echo "TELEGRAM_BOT_USERNAME=seu_bot" >> .env

# 3. Suba os containers
docker compose up -d --build

# 4. Acompanhe os logs
docker compose logs -f api
```

Após subir, a aplicação estará disponível em:
- Frontend: http://localhost
- API: http://localhost/api
- Docs (Swagger): http://localhost/docs

## Estrutura

```
.
├── api/               # Backend Fastify
│   ├── src/
│   │   ├── db/        # Drizzle schemas
│   │   ├── http/      # Controllers (1 rota por arquivo)
│   │   ├── lib/       # db, telegram
│   │   ├── use-cases/ # Lógica de negócio
│   │   └── repositories/  # Interfaces + Drizzle/InMemory
│   ├── drizzle/       # SQL migrations
│   ├── scripts/       # scripts auxiliares
│   └── Dockerfile
├── web/               # Frontend React
│   ├── src/
│   └── Dockerfile
├── compose.yaml       # Docker Compose
├── .env.example       # Variáveis de ambiente
└── scripts/           # scripts auxiliares
```

## Desenvolvimento local (sem Docker)

Backend:
```bash
cd api
pnpm install
docker run -d --name los-postgres -e POSTGRES_USER=docker -e POSTGRES_PASSWORD=docker -e POSTGRES_DB=los -p 5432:5432 postgres:17-alpine
cp .env.example .env
# Edite .env: DATABASE_URL=postgresql://docker:docker@localhost:5432/los
pnpm db:migrate
pnpm dev
```

Frontend:
```bash
cd web
pnpm install
pnpm dev
```

## Comandos úteis (Docker)

```bash
docker compose up -d --build    # Build + start
docker compose down             # Stop
docker compose down -v          # Stop + remove volumes (apaga banco)
docker compose logs -f api      # Logs do backend
docker compose restart api      # Restart backend
docker compose exec api sh      # Shell dentro do container
docker compose pull             # Atualizar imagens base
```

## Migrations

Migrations rodam automaticamente no startup do `api` (via `dist/start.js`).
Para aplicar manualmente:

```bash
docker compose exec api node dist/start.js
```

O arquivo `start.js` é idempotente — só aplica migrations que ainda não foram executadas (tracking em tabela `_los_migrations`).

## Variáveis de ambiente

| Variável | Descrição | Obrigatório |
|---|---|---|
| `POSTGRES_USER` | Usuário do Postgres | Sim (default: los) |
| `POSTGRES_PASSWORD` | Senha do Postgres | **Sim** |
| `POSTGRES_DB` | Nome do banco | Sim (default: los) |
| `JWT_SECRET` | Secret do JWT (cookie auth) | **Sim** (gere com `openssl rand -hex 32`) |
| `COFRE_JWT_SECRET` | Secret do JWT do Cofre | **Sim** |
| `WEB_PORT` | Porta externa do frontend | Não (default: 80) |
| `TELEGRAM_BOT_TOKEN` | Token do @BotFather | Não (se vazio, notificações desabilitadas) |
| `TELEGRAM_BOT_USERNAME` | Username do bot | Não |
| `TELEGRAM_WEBHOOK_SECRET` | Secret do webhook | Não (polling mode usado por padrão) |

## Coolify

Para deploy no Coolify:
1. Crie um novo recurso "Docker Compose"
2. Cole o conteúdo de `compose.yaml`
3. Configure as env vars no painel do Coolify
4. Coolify gerencia volumes, healthchecks e TLS automaticamente
