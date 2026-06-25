# Kanban Module (MVP — Tarefas com colunas fixas)

**Design**: `design` (Pencil), módulo "Módulo Organização" (node `GHgxZ`), sub-módulo Tarefas
- Desktop: `MzcGc` (Kanban Board `aCeoo`)
- Tablet: `kYHOe` (Kanban Board `jpq8m`)
- Mobile: `YFBQH` (Column Switcher `hRQuF` + Tasks List `tbBJx`)

**Backend**: `api/src/http/controllers/tasks/tasks-controller.ts`

**Terminologia canônica**: ver `CONTEXT.md` → termo **Tarefa**.

---

## Conceito

Sub-módulo do **Organização** que apresenta um quadro Kanban com **3 colunas fixas**: A Fazer / Em Progresso / Concluído. Cada Tarefa é um card que o usuário pode criar, editar, mover entre colunas, reordenar dentro da coluna e deletar.

- **Single-user** (sem boards múltiplos, sem times, sem assignees)
- **Sem tags, prioridade, dueDate, subtarefas**
- **Colunas fixas** (não gerenciáveis pelo usuário)
- **Hard delete** (sem soft delete)

---

## Autenticação

Requer cookie `token` (JWT de `/auth/login`). Todas as rotas `/tasks/*` são protegidas pelo hook global em `app.ts`. Nenhum token específico do cofre é necessário.

---

## Endpoints

### GET /tasks

Requires cookie `token`.

Query:
```
?column=todo|in_progress|done    ← filtra por coluna (opcional)
&search=string                   ← busca textual (ILIKE em title e description, opcional)
```

Response 200:
```json
{
  "tasks": [
    {
      "id": "string",
      "column": "todo | in_progress | done",
      "title": "string",
      "description": "string | null",
      "position": "number",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

**Ordenação**: `column, position ASC`. Sem `content` (Tasks não têm content; só `description`).

**Sem `column`**: retorna todas as colunas. **Sem `search`**: retorna tudo do usuário.

**Limite**: 500 tasks por usuário. Se exceder → `400`.

Response 400 (limite excedido):
```json
{ "message": "Limite de tarefas atingido (500)" }
```

---

### GET /tasks/:id

Requires cookie `token`.

Response 200:
```json
{
  "task": {
    "id": "string",
    "column": "todo | in_progress | done",
    "title": "string",
    "description": "string | null",
    "position": "number",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### POST /tasks

Requires cookie `token`.

Body:
```json
{
  "title": "string (min 1, max 200)",
  "description": "string | null (opcional, max 2000)",
  "column": "todo | in_progress | done (opcional, default 'todo')"
}
```

Comportamento:
- `position` é calculada automaticamente: `max(position) da coluna destino + 1.0` (vai para o fim)
- `createdAt` e `updatedAt` recebem `now()`

Response 201:
```json
{
  "task": {
    "id": "string",
    "column": "todo | in_progress | done",
    "title": "string",
    "description": "string | null",
    "position": "number",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

Response 400 (limite excedido):
```json
{ "message": "Limite de tarefas atingido (500)" }
```

---

### PUT /tasks/:id

Requires cookie `token`.

Body (todos opcionais, pelo menos 1):
```json
{
  "title": "string (min 1, max 200)",
  "description": "string | null"
}
```

**Não altera `column` nem `position`** — use `PATCH /tasks/:id/move` para isso.

Response 200:
```json
{
  "task": {
    "id": "string",
    "title": "string",
    "description": "string | null",
    "updatedAt": "ISO date"
  }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### PATCH /tasks/:id/move

Requires cookie `token`.

Body:
```json
{
  "column": "todo | in_progress | done",
  "position": "number (positivo, > 0)"
}
```

Comportamento:
- `position` é **explícita e obrigatória** — o frontend calcula (between / before / after) no drop
- Se a `position` colidir com a de outra task da mesma coluna destino → `409 Conflict`
- O front, ao receber 409, deve **recalcular a position** e reenviar

Response 200:
```json
{
  "task": {
    "id": "string",
    "column": "todo | in_progress | done",
    "position": "number",
    "updatedAt": "ISO date"
  }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

Response 409:
```json
{ "message": "Conflito de posição. Recalcule e tente novamente." }
```

---

### DELETE /tasks/:id

Requires cookie `token`.

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

## Fluxo

```
1. POST /tasks { title, description?, column? }  → cria no fim da coluna
2. GET  /tasks?column=...&search=...             → lista (filtra no client por coluna se quiser)
3. GET  /tasks/:id                               → detalhe
4. PUT  /tasks/:id { title?, description? }      → atualiza campos
5. PATCH /tasks/:id/move { column, position }    → move + reordena
6. DELETE /tasks/:id                             → remove definitivamente
```

Drag&drop (UX):
- Drop no fim de uma coluna → `position = max(position) + 1.0`
- Drop entre A e B → `position = (A.position + B.position) / 2`
- Drop no início → `position = primeiroDaColuna.position / 2` (ou `0.5` se coluna vazia)
- Em caso de 409, frontend recalcula posições de toda a coluna afetada e reenvia

---

## Segurança

- Todas as rotas exigem cookie `token` (httpOnly, SameSite=Lax)
- Use-cases filtram sempre por `userId` (isolamento por usuário)
- Repository rejeita acesso a tasks de outros usuários via `findById(id, userId)` e `update(id, userId, ...)`
- Sem criptografia específica (Tasks não são sensíveis como Cofre)

---

## UX (do design Pencil)

- Breakpoints: Mobile 390, Tablet 768, Desktop 1440
- **Desktop**: 3 colunas lado a lado, cada coluna 350px de largura, header com título + count badge + menu `...`, cards com título + descrição + footer
- **Tablet**: 3 colunas de 230px de largura, tipos ligeiramente menores
- **Mobile**: Column Switcher no topo (tabs horizontais: A Fazer / Em Progresso / Concluído) + Tasks List vertical
- Toolbar: Search box (largura 200px) + botão "Nova Tarefa" (indigo)
- **Bloqueado** N/A — Tasks não têm bloqueio como Cofre
- Confirmação antes de deletar (usar `ConfirmModal` reutilizável já presente no design, node `EzSM0`)

---

## Modelo de dados

Tabela `tasks`:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `user_id` | `text` FK → users.id | NOT NULL |
| `column` | `task_column` enum | `todo` \| `in_progress` \| `done` |
| `title` | `text` | NOT NULL |
| `description` | `text` | NULL |
| `position` | `numeric(20, 10)` | NOT NULL, default `1.0` |
| `created_at` | `timestamp` | NOT NULL, default now() |
| `updated_at` | `timestamp` | NOT NULL, default now() |

Índices:
- `tasks_user_id_idx` em `(user_id)`
- `tasks_user_column_position_idx` em `(user_id, column, position)`

---

## O que NÃO está incluso (MVP)

- Boards múltiplos (single board por usuário)
- Tags, prioridade, dueDate, assignee
- Sub-tarefas / checklists
- Compartilhamento / times
- Soft delete
- Drag&drop multi-select / bulk move
- Histórico de alterações
- Persistir ordem das colunas (são fixas: A Fazer / Em Progresso / Concluído)
