# Notes Module (MVP — notas simples)

**Design**: `design` (Pencil), módulo "Módulo Organização" (node `GHgxZ`), sub-módulo Notas (desktop: `d2zd8`, tablet: `WaNRS`, mobile: `skMFh`)

**Backend**: `api/src/http/controllers/notes/notes-controller.ts`

---

## Endpoints

### GET /notes

Requires cookie `token`.

Query:
```
?search=string    ← busca textual no título e conteúdo (opcional)
```

Response 200:
```json
{
  "notes": [
    {
      "id": "string",
      "title": "string",
      "snippet": "string (120 chars max)",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

**⚠️ Não retorna `content`** — apenas snippet. Ordenado por `updatedAt DESC`.

---

### GET /notes/:id

Requires cookie `token`.

Response 200:
```json
{
  "note": {
    "id": "string",
    "title": "string",
    "content": "string (markdown raw)",
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

### POST /notes

Requires cookie `token`.

Body:
```json
{ "title": "string (min 1)" }
```

Response 201:
```json
{
  "note": {
    "id": "string",
    "title": "string",
    "content": "",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

A nota é criada com `content: ""`.

---

### PUT /notes/:id

Requires cookie `token`.

Body (todos opcionais):
```json
{
  "title": "string (min 1)",
  "content": "string"
}
```

Response 200:
```json
{
  "note": {
    "id": "string",
    "title": "string",
    "content": "string",
    "updatedAt": "ISO date"
  }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### DELETE /notes/:id

Requires cookie `token`.

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

## UX (do design Pencil)

- Breakpoints: Mobile 390, Tablet 768, Desktop 1440
- **Desktop**: 2 colunas (Lista 320px + Editor flex)
- **Tablet**: 2 colunas (Lista 240px + Editor flex)
- **Mobile**: Single column list (sem editor inline, navega para detalhe)

### Painel de Notas
- Lista: Search box + items (título + snippet + data)
- Item ativo: borda `$dark-border` + fill `$dark-card`
- Editor: Título + conteúdo markdown + "Salvo automaticamente"

### Comportamento
- Criar nota: POST /notes → redireciona para o editor
- Selecionar nota: GET /notes/:id → carrega conteúdo no editor
- Editar: PUT /notes/:id (auto-save no blur ou debounce)
- Deletar: DELETE /notes/:id

## O que NÃO está incluso (MVP)

- Tags (filtro e exibição)
- Breadcrumbs (Caminho da Nota)
- Renderização Markdown (backend só armazena texto puro)
- Sub-módulos Tarefas, Estudos, Hábitos
