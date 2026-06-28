# Agenda (Módulo Agenda)

**Design**: `design` (Pencil), módulo "Módulo Agenda" (node `zCvXO`)
- Desktop — Mês: `VSfdT`
- Desktop — Dia: `Xfge2` (selecionado)
- Tablet — Mês: `I9KzBr`
- Mobile — Dia: `j47vAz`
- (v2): Semana Desktop/Tablet/Mobile, Dia Tablet, Mês Mobile

**Backend**: `api/src/http/controllers/agenda/`

**Terminologia canônica**: ver `CONTEXT.md` → termos **Agenda**, **Calendário**, **Compromisso**, **Ocorrência**, **Exceção de Recorrência**.

---

## Conceito

O **Módulo Agenda** é a área do Life OS voltada para o gerenciamento pessoal de Compromissos, com suporte a múltiplos Calendários, recorrência e notificações via Telegram. É organizado em **2 visões** (Mês + Dia) com view switcher mostrando 4 botões (Semana/Agenda como "Em Breve" no MVP).

- **Single-user** (mesmo padrão dos outros módulos)
- **Calendars com CRUD total** (criar/editar/deletar livremente)
- **Recorrência** suportada (subset RRULE: `FREQ` + `INTERVAL` + `COUNT/UNTIL`)
- **Exceções de recorrência** suportadas (cancelar/adiar 1 ocorrência específica)
- **Notificações** via Telegram (bot único, modo polling)
- **Hard delete** em todas as entidades (com cascade)
- **Campos do evento**: `title`, `description`, `location`, `calendarId`, `startAt`, `endAt`, `allDay`, `recurrenceRule`, `recurrenceEndsAt`, `status`

---

## Autenticação

Todas as rotas exigem cookie `token` (JWT de `/auth/login`). Hook global em `app.ts` protege `/agenda/*`.

**Exceção**: `POST /agenda/telegram/webhook` é aberto (autenticado via header `X-Telegram-Bot-Api-Secret-Token`).

---

## Endpoints — Calendars (5)

### GET /agenda/calendars

Lista os calendários do user.

Response 200:
```json
{
  "calendars": [
    { "id": "string", "name": "string", "color": "string (hex)", "createdAt": "ISO date", "updatedAt": "ISO date" }
  ]
}
```

Ordenação: `name ASC`.

---

### POST /agenda/calendars

Cria um calendário.

Body:
```json
{ "name": "string (min 1, max 50)", "color": "string (hex, ex: #3b82f6)" }
```

Response 201:
```json
{
  "calendar": { "id": "string", "name": "string", "color": "string", "createdAt": "ISO date", "updatedAt": "ISO date" }
}
```

Response 400 (limite atingido — 20 calendários/user):
```json
{ "message": "Limite de calendários atingido (20)" }
```

---

### GET /agenda/calendars/:id

Response 200:
```json
{ "calendar": { "id": "string", "name": "string", "color": "string", "createdAt": "ISO date", "updatedAt": "ISO date" } }
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### PUT /agenda/calendars/:id

Body (pelo menos 1 campo):
```json
{ "name": "string (min 1, max 50)", "color": "string (hex)" }
```

Response 200:
```json
{ "calendar": { "id": "string", "name": "string", "color": "string", "updatedAt": "ISO date" } }
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### DELETE /agenda/calendars/:id

**Cascade**: remove todos os Compromissos do calendário, e em cascata todas as Exceções de Recorrência.

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

**UI**: ConfirmModal com contagem de Compromissos afetados.

---

## Endpoints — Events (6)

### GET /agenda/events

Lista Compromissos (com ocorrências expandidas de recorrências) no range.

Query (todos opcionais):
```
?from=YYYY-MM-DD           ← default = hoje
?to=YYYY-MM-DD             ← default = +30 dias
?calendarIds=id1,id2       ← filtra por calendários (opcional)
?status=scheduled|done|cancelled   ← default = scheduled
```

Response 200:
```json
{
  "events": [
    {
      "id": "string (occurrenceId OU eventId)",
      "eventId": "string (parent eventId; igual a id se não recorrente)",
      "title": "string",
      "description": "string",
      "location": "string",
      "calendarId": "string",
      "calendar": { "id": "string", "name": "string", "color": "string" } | null,
      "startAt": "ISO date",
      "endAt": "ISO date",
      "allDay": "boolean",
      "recurrence": "none | daily | weekly | monthly | yearly",
      "isRecurring": "boolean",
      "status": "scheduled | done | cancelled",
      "isException": "boolean"
    }
  ]
}
```

**Ordenação**: `startAt ASC`.

**Expansão**: o backend expande recorrências em ocorrências individuais no range `from..to`. Aplica Exceções de Recorrência (substitui por `newStartsAt/newEndsAt` ou filtra cancelados).

**Limite**: 2000 Compromissos/user (recorrências são ocorrências virtuais, não contam no limite).

---

### POST /agenda/events

Cria um Compromisso (único ou recorrente).

Body:
```json
{
  "title": "string (min 1, max 200)",
  "description": "string (opcional, max 2000)",
  "location": "string (opcional, max 200)",
  "calendarId": "string (uuid)",
  "startAt": "ISO date",
  "endAt": "ISO date",
  "allDay": "boolean (default false)",
  "recurrence": "none | daily | weekly | monthly | yearly (default none)",
  "recurrenceInterval": "number (1..12, default 1) — só usado se recurrence != none",
  "recurrenceCount": "number (1..365, opcional) — fecha após N ocorrências",
  "recurrenceEndsAt": "ISO date (opcional) — fecha em data (alternativa a recurrenceCount)"
}
```

Validação:
- `endAt > startAt`
- `recurrenceInterval >= 1` se `recurrence != none`
- `recurrenceCount` XOR `recurrenceEndsAt` (apenas 1, ou nenhum → infinito)
- `recurrenceEndsAt <= startAt + 2 anos` (cap de 2 anos no futuro)

Response 201:
```json
{
  "event": {
    "id": "string", "title": "string", "description": "string", "location": "string",
    "calendarId": "string", "startAt": "ISO date", "endAt": "ISO date", "allDay": "boolean",
    "recurrence": "string", "recurrenceInterval": "number", "recurrenceCount": "number | null",
    "recurrenceEndsAt": "ISO date | null", "status": "scheduled",
    "createdAt": "ISO date", "updatedAt": "ISO date"
  }
}
```

Response 400 (limite atingido — 2000/user):
```json
{ "message": "Limite de compromissos atingido (2000)" }
```

Response 404 (calendarId inválido):
```json
{ "message": "Recurso não encontrado" }
```

---

### GET /agenda/events/:id

Retorna o detalhe de um Compromisso + suas Exceções de Recorrência.

Response 200:
```json
{
  "event": { /* mesmo shape do POST */ },
  "exceptions": [
    {
      "id": "string", "originalDate": "YYYY-MM-DD",
      "action": "cancel | reschedule",
      "newStartsAt": "ISO date | null", "newEndsAt": "ISO date | null",
      "createdAt": "ISO date"
    }
  ]
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### PUT /agenda/events/:id

Atualiza um Compromisso. **Afeta todas as ocorrências** (não é possível editar só 1 ocorrência; pra isso use Exceptions).

Body (pelo menos 1 campo):
```json
{
  "title": "string (min 1, max 200)",
  "description": "string | null",
  "location": "string | null",
  "calendarId": "string",
  "startAt": "ISO date",
  "endAt": "ISO date",
  "allDay": "boolean",
  "recurrence": "none | daily | weekly | monthly | yearly",
  "recurrenceInterval": "number (1..12)",
  "recurrenceCount": "number | null",
  "recurrenceEndsAt": "ISO date | null"
}
```

Response 200: `{ "event": { ... } }`

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### PATCH /agenda/events/:id/status

Marca o status de um Compromisso (afeta só o evento-mãe; ocorrências geradas não persistem).

Body:
```json
{ "status": "scheduled | done | cancelled" }
```

Response 200:
```json
{ "event": { "id": "string", "status": "string", "updatedAt": "ISO date" } }
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### DELETE /agenda/events/:id

**Remove toda a série recorrente** (não apenas 1 ocorrência). Cascade em Exceções.

**UI**: ConfirmModal com 3 opções:
1. "Apenas este evento" → cria Exception `action=cancel` (POST /events/:id/exceptions)
2. "Este e os futuros" → PUT com `recurrenceEndsAt = ontem` (fecha a série)
3. "Todos os eventos" → DELETE

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

## Endpoints — Exceções de Recorrência (3)

### POST /agenda/events/:id/exceptions

Cria uma Exceção de Recorrência (cancelar ou adiar 1 Ocorrência).

Body:
```json
{
  "originalDate": "YYYY-MM-DD (data original da Ocorrência)",
  "action": "cancel | reschedule",
  "newStartsAt": "ISO date (required se action=reschedule)",
  "newEndsAt": "ISO date (required se action=reschedule)"
}
```

Validação:
- `originalDate` deve estar dentro do range de recorrência do evento
- Se `action=reschedule`, `newStartsAt > originalDate` e `newEndsAt > newStartsAt`
- Máximo 1 Exception por `originalDate` por evento (unique constraint)

Response 201:
```json
{
  "exception": {
    "id": "string", "eventId": "string", "originalDate": "YYYY-MM-DD",
    "action": "string", "newStartsAt": "ISO date | null", "newEndsAt": "ISO date | null",
    "createdAt": "ISO date"
  }
}
```

Response 400 (Exception já existe para essa data):
```json
{ "message": "Já existe uma exceção para esta data" }
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### GET /agenda/events/:id/exceptions

Lista todas as Exceções de um evento.

Response 200:
```json
{ "exceptions": [ { "id": "string", "originalDate": "...", "action": "...", "newStartsAt": "...", "newEndsAt": "...", "createdAt": "..." } ] }
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### DELETE /agenda/events/:id/exceptions/:exceptionId

Remove uma Exceção (volta a usar a Ocorrência original).

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

## Endpoints — Preferences (2)

### GET /agenda/preferences

Lê preferências de notificação do user.

Response 200:
```json
{
  "preferences": {
    "notificationOffsetMinutes": "number (default 15)",
    "timezone": "string (default 'America/Sao_Paulo')"
  }
}
```

---

### PUT /agenda/preferences

Atualiza preferências.

Body (pelo menos 1 campo):
```json
{
  "notificationOffsetMinutes": "number (0..1440)",
  "timezone": "string (timezone IANA válido)"
}
```

Response 200:
```json
{ "preferences": { "notificationOffsetMinutes": "...", "timezone": "..." } }
```

---

## Endpoints — Telegram (3)

### GET /agenda/telegram/link

Gera um deep link `https://t.me/<bot_username>?start=<jwt>` para o user iniciar conversa com o bot.

O JWT é temporário (10min) e contém apenas `userId`.

**Degradação**: se `TELEGRAM_BOT_TOKEN` não estiver configurado no env, retorna 503.

Response 200:
```json
{ "link": "https://t.me/lifeos_bot?start=eyJhbGc..." }
```

Response 503 (Telegram não configurado):
```json
{ "message": "Telegram não está configurado no servidor" }
```

---

### POST /agenda/telegram/webhook

Recebe update do bot Telegram. **Autentica via header `X-Telegram-Bot-Api-Secret-Token`** (não via cookie).

Body (formato Telegram `Update`):
```json
{
  "message": {
    "chat": { "id": 123456789 },
    "text": "/start <token_jwt>"
  }
}
```

**Comportamento**:
- Se `text` começa com `/start <token>`: valida JWT, vincula `chat_id ↔ user_id`
- Se `text` é `/start` sem token: responde "Use o link do Life OS para vincular"
- Outros comandos (`/help`, etc): responde com mensagem genérica

Response 200 (vazio ou mensagem de sucesso):
```json
{ "ok": true }
```

---

### DELETE /agenda/telegram/link

Desvincula a conta Telegram do user.

Response 204: (sem body)

---

## Fluxo típico

**Criar Calendário + Compromisso**:
```
1. POST /agenda/calendars { name: "Trabalho", color: "#3b82f6" }
2. POST /agenda/events { title: "Daily Standup", calendarId, startAt, endAt, recurrence: "weekly", ... }
3. GET /agenda/events?from=2026-06-01&to=2026-06-30   → lista ocorrências
4. POST /agenda/events/:id/exceptions { originalDate: "2026-07-15", action: "cancel" }   → pula feriado
5. PUT /agenda/events/:id { title: "Daily Standup (15min)" }   → renomeia (afeta todas)
```

**Vincular Telegram**:
```
1. GET /agenda/telegram/link   → recebe deep link
2. User clica no link, abre Telegram, manda /start <token>
3. POST /agenda/telegram/webhook   → bot recebe, vincula chat_id
4. PUT /agenda/preferences { notificationOffsetMinutes: 30 }   → ajusta antecedência
5. Backend (cron a cada 1 min) envia bot.sendMessage para Compromissos nos próximos 30 min
```

**Atualizar status**:
```
1. GET /agenda/events/:id
2. PATCH /agenda/events/:id/status { status: "done" }   → marca como cumprido
```

**Deletar Calendário**:
```
1. GET /agenda/calendars/:id   → vê lista de eventos (front-end mostra contagem)
2. ConfirmModal: "Tem certeza? 23 compromissos serão removidos"
3. DELETE /agenda/calendars/:id
```

---

## Segurança

- Todas as rotas exigem cookie `token` (httpOnly, SameSite=Lax)
- Exceção: `POST /agenda/telegram/webhook` autentica via header `X-Telegram-Bot-Api-Secret-Token` (env var)
- Use-cases filtram sempre por `userId`
- Repository rejeita acesso a Calendars/Events/Exceptions de outros users (404)
- Cross-tenant: `calendarId` deve pertencer ao user (validado no use-case → 404 se inválido)
- JWT de vinculação Telegram: 10min, contém apenas `userId`, assinado com `JWT_SECRET`
- Telegram webhook: valida secret token do env antes de processar

---

## UX (do design Pencil)

- Breakpoints: Mobile 390, Tablet 768, Desktop 1440
- **Sidebar** (240px Desktop, 80px Tablet, escondida Mobile):
  - Botão "+ Criar Compromisso" (full width, indigo)
  - **Mini Calendar**: date picker compacto (mês atual, navega por setas)
  - **MEUS CALENDÁRIOS**: lista de calendários com checkbox de cor (esconde/mostra eventos daquele calendário na view)
- **Header**:
  - Título "Agenda" + subtítulo "Compromissos, tarefas e reuniões com hora marcada"
  - Botão "Hoje" (volta pra data atual)
  - Navegação `</>` (move dia/mês/ semana)
  - Label de data/período ("28 de Junho de 2026" / "Junho de 2026")
  - View switcher: **Mês** / Semana / **Dia** / Agenda (Semana e Agenda como "Em Breve" no MVP)
- **Modo Mês** (Desktop `VSfdT`, Tablet `I9KzBr`, Mobile `kg8oR` em v2):
  - Grid 7 colunas × 5 linhas
  - Cada célula mostra número do dia + pills coloridos (eventos com horário)
- **Modo Dia** (Desktop `Xfge2`, Mobile `j47vAz`):
  - Coluna esquerda 280px: **Timeline** com slots de 1h (09:00–17:00 visível, scroll pra mais)
  - Painel direito: **Compromissos do Dia** com cards (badge de cor do calendário, título, horário, descrição)
- **Mobile — Dia** (`j47vAz`):
  - Header com dia atual + timeline vertical full-width
  - Eventos como cards full-width na hora correspondente
- **Confirmação antes de deletar** (ConfirmModal reutilizável, node `EzSM0`)

---

## Modelo de dados

### Tabela `agenda_calendars`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `user_id` | `text` FK → users.id | NOT NULL |
| `name` | `text` | NOT NULL, 1..50 |
| `color` | `text` | NOT NULL, hex (`#xxxxxx`) |
| `created_at` | `timestamp` | NOT NULL, default now() |
| `updated_at` | `timestamp` | NOT NULL, default now() |

Índices:
- `agenda_calendars_user_id_idx` em `(user_id)`

### Tabela `agenda_events`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `user_id` | `text` FK → users.id | NOT NULL |
| `calendar_id` | `text` FK → agenda_calendars.id, onDelete cascade | NOT NULL |
| `title` | `text` | NOT NULL, 1..200 |
| `description` | `text` | nullable, max 2000 |
| `location` | `text` | nullable, max 200 |
| `start_at` | `timestamp` | NOT NULL |
| `end_at` | `timestamp` | NOT NULL, > start_at |
| `all_day` | `boolean` | NOT NULL, default false |
| `recurrence` | `text` | NOT NULL, enum (`none`/`daily`/`weekly`/`monthly`/`yearly`), default `none` |
| `recurrence_interval` | `integer` | NOT NULL, default 1, 1..12 |
| `recurrence_count` | `integer` | nullable, 1..365 |
| `recurrence_ends_at` | `timestamp` | nullable, max start_at + 2 anos |
| `status` | `agenda_event_status` enum | `scheduled`/`done`/`cancelled`, default `scheduled` |
| `created_at` | `timestamp` | NOT NULL, default now() |
| `updated_at` | `timestamp` | NOT NULL, default now() |

Índices:
- `agenda_events_user_id_idx` em `(user_id)`
- `agenda_events_user_start_idx` em `(user_id, start_at)` (queries de range)
- `agenda_events_calendar_id_idx` em `(calendar_id)` (filtro por calendarIds)

### Tabela `agenda_event_exceptions`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `event_id` | `text` FK → agenda_events.id, onDelete cascade | NOT NULL |
| `original_date` | `date` | NOT NULL |
| `action` | `agenda_exception_action` enum | `cancel`/`reschedule`, NOT NULL |
| `new_starts_at` | `timestamp` | nullable, required se action=reschedule |
| `new_ends_at` | `timestamp` | nullable, required se action=reschedule |
| `created_at` | `timestamp` | NOT NULL, default now() |

Índices:
- `agenda_event_exceptions_event_id_idx` em `(event_id)`
- `agenda_event_exceptions_event_date_idx` UNIQUE em `(event_id, original_date)` (1 exception por data)

### Tabela `agenda_telegram_links`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `user_id` | `text` FK → users.id, onDelete cascade | UNIQUE, NOT NULL |
| `chat_id` | `bigint` | NOT NULL |
| `linked_at` | `timestamp` | NOT NULL, default now() |

### Alteração em `users`

| Coluna | Tipo | Notas |
|---|---|---|
| `notification_offset_minutes` | `integer` | NOT NULL, default 15 |
| `timezone` | `text` | NOT NULL, default 'America/Sao_Paulo' |

---

## Limites e regras

- **Calendars**: 20 por usuário
- **Events**: 2000 por usuário (ocorrências virtuais não contam)
- **Recorrência**: max 2 anos no futuro (cap via `recurrence_ends_at`)
- **Exceptions**: max 1 por `(event_id, original_date)` (unique constraint)
- **Telegram**: 1 link por user (UNIQUE em `user_id`)
- **Validação cross-tenant**: 404 (não 403) para FK inválida
- **Fuso horário**: armazenado em UTC (timestamp), convertido no frontend (timezone do user)

---

## O que NÃO está incluso (MVP)

- Multi-user / compartilhamento de agendas
- Notificações por email / SMS / Web Push
- Integração com Google Calendar / Apple Calendar / Outlook
- Sync de calendários entre dispositivos
- Edição de 1 ocorrência específica (apenas via Exceções: cancelar/adiar)
- Sincronização com módulo Tarefas
- Sincronização com módulo Finanças
- Visualização Semana (só Mês + Dia no MVP; Semana fica como "Em Breve")
- Visualização "Agenda" (lista de próximos N eventos)
- Mobile — Mês e Mobile — Semana (só Mobile Dia no MVP)
- Recorrência avançada (BYDAY, BYMONTH, múltiplas exceções semanais) — só subset RRULE
- Importação de calendários externos (.ics)
- Exportação de calendários
- Anexos em eventos
- Convidados / RSVPs
- Múltiplos fusos horários por evento
- Lembretes customizados por evento (offset global apenas)
