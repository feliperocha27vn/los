# Rastreador de Hábitos Module (MVP — Hábitos + Registros Diários)

**Design**: `design` (Pencil), módulo "Módulo Organização" (node `GHgxZ`), sub-módulo Hábitos
- Desktop: `LDjvF` (Tabela de Hábitos `NFkYw`)
- Tablet: `ERDaW`
- Mobile: `UnLhd` (Habits List `IdU3m` + Energy Select Row `Ou7C0`)

**Backend**: `api/src/http/controllers/tracker/`

**Terminologia canônica**: ver `CONTEXT.md` → termos **Rastreador de Hábitos**, **Hábito**, **Registro Diário**.

---

## Conceito

Sub-módulo do **Organização** que permite ao usuário criar **Hábitos** personalizados e registrar diariamente quais foram cumpridos. Cada dia pode ter valores subjetivos de **Energia** e **Qualidade**, e a **Pontuação** do dia é calculada automaticamente (count de hábitos cumpridos / total de hábitos ativos).

- **Single-user** (sem times, sem compartilhamento)
- **Sem criptografia**
- **Hábitos**: soft delete (`archived=true`) — registros históricos permanecem visíveis
- **Registros**: hard delete (são apenas marcas diárias)
- **2 endpoints de visualização**: `/tracker/today` (dia atual) e `/tracker/days` (histórico)
- **Limites**: 20 hábitos / 10.000 registros por user
- **Sem busca** no MVP

---

## Autenticação

Requer cookie `token` (JWT de `/auth/login`). Todas as rotas `/tracker/*` são protegidas pelo hook global em `app.ts`.

---

## Modelo de dados

2 tabelas com FK:

- `tracker_habits` (id, user_id, name, icon, position, archived, created_at, updated_at)
- `tracker_records` (id, habit_id → tracker_habits, user_id, date, completed, energy, quality, note, ...)

`user_id` é denormalizado em `tracker_records` (além do FK) para evitar JOINs por query. Constraint unique em `(habit_id, date)` — 1 registro por (hábito, dia).

`archived=true` em habits esconde o hábito de novos registros, mas o histórico (JOIN) ainda mostra os registros antigos com o nome preservado.

---

## Endpoints — Hábitos

### GET /tracker/habits

Lista hábitos do user (excluindo `archived=true`).

Response 200:
```json
{
  "habits": [
    {
      "id": "string",
      "name": "string",
      "icon": "string",
      "position": "number",
      "archived": false,
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

---

### POST /tracker/habits

Body:
```json
{
  "name": "string (min 1, max 50)",
  "icon": "string (min 1, max 50, nome Lucide)"
}
```

Comportamento: `position` = `max(position) + 1.0`. `archived` = false.

Response 201: `{ "habit": { ... } }`
Response 400 (limite 20): `{ "message": "Limite de hábitos atingido (20)" }`

---

### GET /tracker/habits/:id

Response 200: `{ "habit": { ... } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### PUT /tracker/habits/:id

Body:
```json
{
  "name": "string (opcional)",
  "icon": "string (opcional)"
}
```

Response 200: `{ "habit": { "id", "name", "icon", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### PATCH /tracker/habits/:id/reorder

Body: `{ "position": "number" }`
Response 200: `{ "habit": { "id", "position", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### DELETE /tracker/habits/:id

**Soft delete** (set `archived=true`). Registros antigos permanecem visíveis via JOIN.

Response 204: (sem body)
Response 404: `{ "message": "Recurso não encontrado" }`

---

### PATCH /tracker/habits/:id/restore

Desarquiva um hábito (`archived=false`).

Response 200: `{ "habit": { "id", "name", "icon", "archived", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

## Endpoints — Visualização (Today / Days)

### GET /tracker/today

Retorna o dia de hoje em UTC com **todos os hábitos ativos** (não-arquivados) do user, e o registro correspondente (se existir) para cada um.

Response 200:
```json
{
  "date": "2026-06-25",
  "habits": [
    {
      "habitId": "string",
      "name": "string",
      "icon": "string",
      "position": "number",
      "completed": true,
      "recordId": "string | null"
    }
  ],
  "energy": "low | medium | high | null",
  "quality": "weak | ok | strong | null",
  "score": {
    "completed": 3,
    "total": 5
  }
}
```

`score.completed` = count de hábitos com `completed=true` no dia. `score.total` = total de hábitos ativos.

---

### GET /tracker/days?from=YYYY-MM-DD&to=YYYY-MM-DD

Query:
- `from` (opcional, default: hoje - 30 dias)
- `to` (opcional, default: hoje)

Response 200:
```json
{
  "days": [
    {
      "date": "2026-06-25",
      "habits": [
        { "habitId": "string", "name": "string", "icon": "string", "completed": true, "recordId": "string" }
      ],
      "energy": "medium | null",
      "quality": "ok | null",
      "score": { "completed": 3, "total": 5 }
    }
  ]
}
```

Dias sem nenhum registro ainda aparecem com array de habits vazio + `score: { completed: 0, total: 0 }` — **ou são omitidos**? Decisão: **dias sem registro são omitidos** (a UI preenche buracos com `-` no front).

Limite: range de no máximo 90 dias (validado no controller).

---

## Endpoints — Registros (Upsert)

### PUT /tracker/records

**Idempotente**. Cria ou atualiza o registro de um hábito em uma data.

Body:
```json
{
  "habitId": "string (uuid)",
  "date": "YYYY-MM-DD",
  "completed": "boolean",
  "energy": "low | medium | high | null (opcional)",
  "quality": "weak | ok | strong | null (opcional)",
  "note": "string | null (opcional, max 500)"
}
```

Comportamento:
- Se já existe registro para (habitId, date) → atualiza
- Se não existe → cria
- `energy` e `quality` são valores **por dia** (não por hábito). Ao upsert de um hábito, se o body inclui `energy`/`quality`, atualiza o valor do dia. Se omite, mantém o existente.

Validação: `habitId` deve existir e pertencer ao user (senão 404). Hábito arquivado pode receber records? **Sim** (mas soft-deleted), pois o user pode ter registros antigos de hábitos que arquivou.

Response 200: `{ "record": { "id", "habitId", "date", "completed", "energy", "quality", "note", "createdAt", "updatedAt" } }`
Response 400 (limite 10k): `{ "message": "Limite de registros atingido (10000)" }`
Response 404 (habitId inválido): `{ "message": "Recurso não encontrado" }`

---

### DELETE /tracker/records/:id

Hard delete de um registro. Se deletar, o hábito volta a aparecer como "não cumprido" naquele dia.

Response 204: (sem body)
Response 404: `{ "message": "Recurso não encontrado" }`

---

## Segurança

- Todas as rotas exigem cookie `token` (httpOnly)
- `user_id` filtra em todas as queries (denormalized em records)
- **Cross-tenant 404** (não 403): recurso de outro user → 404
- `PUT /tracker/records` valida que `habitId` pertence ao user
- Sem criptografia (igual Notas/Estudos)

---

## Limites

| Recurso | Limite | Erro |
|---|---|---|
| Hábitos por user | 20 | 400 |
| Registros por user | 10.000 | 400 |
| Range em `/days` | 90 dias | 400 |

---

## UX (do design Pencil)

- **Desktop** (1440px): Tabela 9 colunas — Dia + 5 hábitos (checkboxes) + Energia (badge) + Pontuação (número) + Qualidade (badge)
- **Tablet** (768px): header + tabela (mesma estrutura, scroll horizontal)
- **Mobile** (390px): Card de pontuação do dia + Lista de hábitos (com ícone + checkbox) + Dropdown de Energia
- **Bottom navigation**: presente (não fazer parte do escopo do backend)

---

## O que NÃO está incluso (MVP)

- Streaks (sequência de dias consecutivos)
- Lembretes / notificações push
- Compartilhamento / times
- Tags em hábitos
- Metas (ex: 30 dias sem falhar)
- Gráficos de evolução
- Importação em massa
- Templates de hábitos prontos
- Edição de hábito após criar (apenas name e icon)
