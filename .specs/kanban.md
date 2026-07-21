# Kanban Module (MVP — Tarefas com colunas fixas + abas de categoria)

**Design**: `design` (Pencil), módulo "Módulo Organização" (node `GHgxZ`), sub-módulo Tarefas
- Desktop: `MzcGc` (Kanban Board `aCeoo`)
- Tablet: `kYHOe` (Kanban Board `jpq8m`)
- Mobile: `YFBQH` (Column Switcher `hRQuF` + Tasks List `tbBJx`)

**Backend**: `api/src/http/controllers/tasks/index.routes.ts`

**Terminologia canônica**: ver `CONTEXT.md` → termo **Tarefa**.

---

## Conceito

Sub-módulo do **Organização** que apresenta um quadro Kanban com **3 colunas fixas** (A Fazer / Em Progresso / Concluído) e **3 abas de categoria** (Trabalho / Pessoal / Outros). Cada Tarefa é um card que o usuário pode criar (escolhendo a categoria via badge), editar, mover entre colunas, reordenar dentro da coluna, reclassificar entre abas, e deletar.

- **Single-user** (sem boards múltiplos, sem times, sem assignees)
- **Sem tags, prioridade, dueDate, subtarefas**
- **Colunas fixas** (não gerenciáveis pelo usuário)
- **Categorias fixas** (`work` / `personal` / `other`, hardcoded no enum)
- **Hard delete** (sem soft delete)
- **Posição escopada por aba** (cada categoria tem sua própria ordenação por coluna)

---

## Autenticação

Requer cookie `token` (JWT de `/auth/login`). Todas as rotas `/tasks/*` são protegidas pelo hook global em `app.ts`. Nenhum token específico do cofre é necessário.

---

## Endpoints

### GET /tasks

Requires cookie `token`.

Query:
```
?category=work|personal|other   ← filtra por aba (opcional, default = sem filtro = todas as categorias)
&column=todo|in_progress|done    ← filtra por coluna (opcional)
&search=string                   ← busca textual (ILIKE em title e description, opcional)
```

Response 200:
```json
{
  "tasks": [
    {
      "id": "string",
      "category": "work | personal | other",
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

**Ordenação**: `category, column, position ASC`. Sem `content` (Tasks não têm content; só `description`).

**Sem `category`**: retorna todas as categorias. **Sem `column`**: retorna todas as colunas. **Sem `search`**: retorna tudo do usuário.

**Limite**: 500 tasks por usuário **somando todas as categorias**. Se exceder → `400`.

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
    "category": "work | personal | other",
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
  "column": "todo | in_progress | done (opcional, default 'todo')",
  "category": "work | personal | other (opcional, default 'other')"
}
```

Comportamento:
- `position` é calculada automaticamente: `max(position) da coluna destino (escopada pela category) + 1.0` (vai para o fim)
- `createdAt` e `updatedAt` recebem `now()`

Response 201:
```json
{
  "task": {
    "id": "string",
    "category": "work | personal | other",
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
  "description": "string | null",
  "category": "work | personal | other (reclassifica a task para outra aba)"
}
```

**Não altera `column` nem `position`** — use `PATCH /tasks/:id/move` para isso.

Response 200:
```json
{
  "task": {
    "id": "string",
    "category": "work | personal | other",
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
  "position": "number (positivo, > 0)",
  "category": "work | personal | other (obrigatório — escopo da posição)"
}
```

Comportamento:
- `position` é **explícita e obrigatória** — o frontend calcula (between / before / after) no drop
- A posição é **escopada por `(category, column)`** — colisão só considera tasks da mesma categoria E coluna
- Mover entre abas = mesmo endpoint, só muda `category` (junto com `position` recalculada)
- Se a `position` colidir com a de outra task do mesmo `(category, column)` → `409 Conflict`
- O front, ao receber 409, deve **recalcular a position** e reenviar

Response 200:
```json
{
  "task": {
    "id": "string",
    "category": "work | personal | other",
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
1. POST /tasks { title, description?, column?, category? }  → cria no fim da (category, column)
2. GET  /tasks?category=...&column=...&search=...           → lista com filtros combinados
3. GET  /tasks/:id                                          → detalhe
4. PUT  /tasks/:id { title?, description?, category? }      → atualiza campos + reclassifica aba
5. PATCH /tasks/:id/move { column, position, category }     → move + reordena (pode cruzar abas)
6. DELETE /tasks/:id                                        → remove definitivamente
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
- **Abas de categoria (logo abaixo do toolbar)**: Trabalho / Pessoal / Outros, com count badge por aba
  - Tab ativa: fundo destacado (indigo, igual ao botão "Nova Tarefa")
  - Padrão único para os 3 breakpoints (consistente com `Módulo Organização`)
- **Desktop**: 3 colunas lado a lado, cada coluna 350px de largura, header com título + count badge + menu `...`, cards com título + descrição + footer + **badge de categoria** (Trabalho=indigo, Pessoal=verde, Outros=cinza)
- **Tablet**: 3 colunas de 230px de largura, tipos ligeiramente menores
- **Mobile**: Column Switcher no topo (tabs horizontais: A Fazer / Em Progresso / Concluído) + Tasks List vertical
- Toolbar: Search box (largura 200px) + botão "Nova Tarefa" (indigo)
- **Modal "Nova Tarefa"**: input de título + textarea descrição + **segmented control de categoria** (3 botões lado a lado, default = Outros)
- **Menu do card** (`...`): opção "Mover para: Trabalho / Pessoal / Outros" (atualiza via `PUT /tasks/:id { category }`)
- **Bloqueado** N/A — Tasks não têm bloqueio como Cofre
- Confirmação antes de deletar (usar `ConfirmModal` reutilizável já presente no design, node `EzSM0`)

---

## Modelo de dados

Tabela `tasks`:

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `user_id` | `text` FK → users.id | NOT NULL |
| `category` | `task_category` enum | `work` \| `personal` \| `other`, **NOT NULL DEFAULT 'other'** |
| `column` | `task_column` enum | `todo` \| `in_progress` \| `done` |
| `title` | `text` | NOT NULL |
| `description` | `text` | NULL |
| `position` | `numeric(20, 10)` | NOT NULL, default `1.0` (escopada por `(user, category, column)`) |
| `created_at` | `timestamp` | NOT NULL, default now() |
| `updated_at` | `timestamp` | NOT NULL, default now() |

Índices:
- `tasks_user_id_idx` em `(user_id)`
- `tasks_user_category_column_position_idx` em `(user_id, category, column, position)` — suporta o GET com filtro de aba e ordenação por coluna+posição numa só varredura

**Migration automática**: o `DEFAULT 'other'` na nova coluna cuida do backfill — toda task existente vira `other` sem script de backfill explícito.

---

## O que NÃO está incluso (MVP)

- Boards múltiplos (single board por usuário)
- Categorias customizáveis pelo usuário (fixas: Trabalho / Pessoal / Outros)
- Cores customizadas por categoria
- Tags, prioridade, dueDate, assignee
- Sub-tarefas / checklists
- Compartilhamento / times
- Soft delete
- Drag&drop multi-select / bulk move
- Reordenar cards entre abas via drag&drop (vira `PUT` com `category`)
- Histórico de alterações
- Persistir ordem das colunas (são fixas: A Fazer / Em Progresso / Concluído)
