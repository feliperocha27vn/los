# Estudos Module (MVP — Cursos, Módulos e Páginas hierárquicos)

**Design**: `design` (Pencil), módulo "Módulo Organização" (node `GHgxZ`), sub-módulo Estudos
- Desktop: `vcjez` (Painel de Estudos `kwmYm`, Tree Column `FsXvo`, Study Editor `oT2uc`)
- Tablet: `vAbwV`
- Mobile: `r4srZ`

**Backend**: `api/src/http/controllers/study-{courses,modules,pages}/`

**Terminologia canônica**: ver `CONTEXT.md` → termos **Estudo**, **Curso**, **Módulo**, **Página de Estudo**.

---

## Conceito

Sub-módulo do **Organização** que organiza conhecimento pessoal em uma árvore hierárquica de 3 níveis:

- **Curso** (Course): unidade de escopo do topo (ex: "React", "Node.js", "Inglês")
- **Módulo** (Module): agrupamento dentro de um Curso (ex: "1 - Interatividade")
- **Página de Estudo** (StudyPage): documento Markdown dentro de um Módulo (ex: "Anotações", "Exercícios")

Cada recurso tem CRUD completo + reordenação. Delete é em cascata (Postgres FK).

- **Single-user** (sem times, sem compartilhamento)
- **Sem criptografia** (igual Notas)
- **Sem search** no MVP
- **Sem soft delete** (hard delete + cascade)
- **Limites**: 50 cursos, 200 módulos por curso, 200 páginas por módulo

---

## Autenticação

Requer cookie `token` (JWT de `/auth/login`). Todas as rotas `/courses/*`, `/modules/*`, `/pages/*` são protegidas pelo hook global em `app.ts`. Nenhum token específico é necessário.

---

## Modelo de dados

3 tabelas com FKs em cascata:

- `study_courses` (id, user_id, name, position, created_at, updated_at)
- `study_modules` (id, course_id → study_courses ON DELETE CASCADE, user_id, name, position, ...)
- `study_pages` (id, module_id → study_modules ON DELETE CASCADE, user_id, title, content, position, ...)

`user_id` é denormalizado em `study_modules` e `study_pages` (além do FK) para evitar JOINs por query.

---

## Endpoints — Cursos

### GET /courses

Requires cookie `token`.

Response 200:
```json
{
  "courses": [
    {
      "id": "string",
      "name": "string",
      "position": "number",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

**Ordenação**: `position ASC`.

**Limite**: 50 cursos por usuário. Criar mais → `400`.

---

### GET /courses/:id

Response 200: `{ "course": { ... } }` (mesma estrutura do item acima)
Response 404: `{ "message": "Recurso não encontrado" }`

---

### POST /courses

Body:
```json
{ "name": "string (min 1, max 100)" }
```

Comportamento: `position` = `max(position) + 1.0` (vai para o fim).

Response 201: `{ "course": { ... } }`
Response 400 (limite excedido): `{ "message": "Limite de cursos atingido (50)" }`

---

### PUT /courses/:id

Body:
```json
{ "name": "string (min 1, max 100)" }
```

Response 200: `{ "course": { "id", "name", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### PATCH /courses/:id/reorder

Body:
```json
{ "position": "number (positivo, > 0)" }
```

Response 200: `{ "course": { "id", "position", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### DELETE /courses/:id

**Cascata**: deleta todos os módulos e páginas filhos (FK `ON DELETE CASCADE` no Postgres).

Response 204: (sem body)
Response 404: `{ "message": "Recurso não encontrado" }`

---

## Endpoints — Módulos

### GET /modules

Query: `?courseId=string` (opcional — filtra por curso)

Response 200: `{ "modules": [{ "id", "courseId", "name", "position", "createdAt", "updatedAt" }] }`

**Ordenação**: `position ASC`. Se `courseId` não pertence ao user → lista vazia (não vaza existência).

---

### GET /modules/:id

Response 200: `{ "module": { ... } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### POST /modules

Body:
```json
{
  "courseId": "string",
  "name": "string (min 1, max 100)"
}
```

Comportamento:
- Valida que `courseId` existe e pertence ao user (senão → 404)
- `position` = `max(position) + 1.0` (vai para o fim do curso)

Response 201: `{ "module": { ... } }`
Response 400 (limite excedido): `{ "message": "Limite de módulos atingido (200)" }`
Response 404 (courseId inválido): `{ "message": "Recurso não encontrado" }`

---

### PUT /modules/:id

Body: `{ "name": "string" }`
Response 200: `{ "module": { "id", "name", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### PATCH /modules/:id/reorder

Body: `{ "position": "number" }`
Response 200: `{ "module": { "id", "position", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### DELETE /modules/:id

**Cascata**: deleta todas as páginas filhas.

Response 204: (sem body)
Response 404: `{ "message": "Recurso não encontrado" }`

---

## Endpoints — Páginas

### GET /pages

Query: `?moduleId=string` (opcional)

Response 200: `{ "pages": [{ "id", "moduleId", "title", "content", "position", "createdAt", "updatedAt" }] }`

---

### GET /pages/:id

**Único endpoint com breadcrumb.**

Response 200:
```json
{
  "page": { "id", "moduleId", "title", "content", "position", "createdAt", "updatedAt" },
  "breadcrumbs": {
    "course": { "id", "name" } | undefined,
    "module": { "id", "name" } | undefined,
    "page": { "id", "name" }
  }
}
```

Response 404: `{ "message": "Recurso não encontrado" }`

---

### POST /pages

Body:
```json
{
  "moduleId": "string",
  "title": "string (min 1, max 200)",
  "content": "string (opcional, default '')"
}
```

Comportamento:
- Valida que `moduleId` existe e pertence ao user (senão → 404)
- `position` = `max(position) + 1.0`

Response 201: `{ "page": { ... } }`
Response 400 (limite): `{ "message": "Limite de páginas atingido (200)" }`
Response 404 (moduleId inválido): `{ "message": "Recurso não encontrado" }`

---

### PUT /pages/:id

Body:
```json
{
  "title": "string (opcional)",
  "content": "string (opcional)"
}
```

Comportamento: auto-save (debounce no front) — cada save = 1 request.

Response 200: `{ "page": { "id", "title", "content", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### PATCH /pages/:id/reorder

Body: `{ "position": "number" }`
Response 200: `{ "page": { "id", "position", "updatedAt" } }`
Response 404: `{ "message": "Recurso não encontrado" }`

---

### DELETE /pages/:id

Response 204: (sem body)
Response 404: `{ "message": "Recurso não encontrado" }`

---

## Segurança

- Todas as rotas exigem cookie `token` (httpOnly)
- `user_id` filtra em todas as queries (denormalized em modules/pages)
- **Cross-tenant 404** (não 403): se user tentar acessar recurso de outro user, retorna 404 para não vazar existência
- `POST /modules` valida que `courseId` pertence ao user
- `POST /pages` valida que `moduleId` pertence ao user
- Sem criptografia (igual Notas)

---

## Limites

| Recurso | Limite | Erro |
|---|---|---|
| Cursos por usuário | 50 | 400 |
| Módulos por curso | 200 | 400 |
| Páginas por módulo | 200 | 400 |

Limite teórico: 50 × 200 × 200 = 2.000.000 páginas por usuário (irreal). Cap prático confortável.

---

## UX (do design Pencil)

- **Desktop** (1440px): 2 colunas — Tree Column (320px) + Study Editor (760px)
- **Tablet** (768px): mesma estrutura
- **Mobile** (390px): Course Selector no topo + Tree Container vertical + Study Editor abaixo
- **Sem confirmação extra** para delete (já existe `ConfirmModal` reutilizável, node `EzSM0`)

---

## O que NÃO está incluso (MVP)

- Compartilhamento / times
- Tags em páginas
- Markdown preview server-side
- Search
- Soft delete
- Histórico de versões
- Export / import
- Templates de curso prontos
- Drag&drop multi-select
- Lixeira
