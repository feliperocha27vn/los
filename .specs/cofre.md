# Cofre Module

**Design**: `design` (Pencil), node `C5hXs` — "Módulo Cofre"

**Backend**: `api/src/http/controllers/cofre/cofre-controller.ts`

---

## Estados

O Cofre tem dois estados:

### Bloqueado
- PIN screen: 6 dots + teclado numérico (0-9 + backspace)
- Nenhuma entrada visível

### Desbloqueado
- Lista de entradas com busca e filtro por categoria
- Detalhe com campos descriptografados

---

## Autenticação (duas camadas)

```
Cookie: token=<jwt>           ← POST /auth/login
Cookie: cofre_token=<jwt>     ← POST /cofre/unlock
```

**AMBOS httpOnly.** Nenhum token visível para JavaScript.

---

## Endpoints

### POST /cofre/unlock

Body:
```json
{ "pin": "string" }
```

Response 200:
```
Set-Cookie: cofre_token=<jwt>; HttpOnly; SameSite=Lax; Path=/cofre; Max-Age=300
```
```json
{ "message": "Cofre desbloqueado" }
```

Response 401:
```json
{ "message": "PIN inválido" }
```

Response 423:
```json
{ "message": "Cofre bloqueado temporariamente. Aguarde." }
```

**Regra**: 3 tentativas erradas → lockout de 30 segundos (status 423).

---

### POST /cofre/lock

Requires cookies `token` + `cofre_token`.

```
Set-Cookie: cofre_token=; Max-Age=0; Path=/cofre
```
```json
{ "message": "Cofre bloqueado" }
```

---

### GET /cofre/entries

Requires cookies `token` + `cofre_token`.

Query:
```
?category=credential|secure_note|api_key    ← filtra por categoria (opcional)
&search=string                              ← busca textual (opcional)
```

**Se `category` não for enviado, retorna TODAS as categorias.**

Response 200:
```json
{
  "entries": [
    {
      "id": "string",
      "category": "credential | secure_note | api_key",
      "title": "string",
      "url": "string | null",
      "username": "string | null",
      "provider": "string | null",
      "createdAt": "ISO date",
      "updatedAt": "ISO date"
    }
  ]
}
```

**⚠️ Não retorna campos sensíveis** (password, content, token).

Response 401:
```json
{ "message": "Cofre bloqueado. Faça o unlock primeiro." }
```

### Filtro por categoria

| Tab clicada | Query param | Resultado |
|-------------|-------------|-----------|
| **Todos** | (sem param) | Todas as categorias |
| **Credenciais** | `?category=credential` | Só credenciais |
| **Notas Seguras** | `?category=secure_note` | Só notas seguras |
| **Chaves de API** | `?category=api_key` | Só chaves de API |

Combinação com busca:
| Query | Resultado |
|-------|-----------|
| `?search=git` | Qualquer categoria com "git" no título/username/url/provider |
| `?category=credential&search=git` | Só credenciais com "git" |

---

### GET /cofre/entries/:id

Requires cookies `token` + `cofre_token`.

Response 200:
```json
{
  "entry": {
    "id": "string",
    "category": "credential | secure_note | api_key",
    "title": "string",
    "url": "string | null",
    "username": "string | null",
    "password": "string | null",
    "content": "string | null",
    "provider": "string | null",
    "token": "string | null",
    "createdAt": "ISO date",
    "updatedAt": "ISO date"
  }
}
```

**✅ Retorna TUDO descriptografado.** Mostrar campos conforme `category`:

| category | Campos a exibir |
|----------|----------------|
| `credential` | url, username, password |
| `secure_note` | content |
| `api_key` | provider, token |

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### POST /cofre/entries

Requires cookies `token` + `cofre_token`.

Body:
```json
{
  "category": "credential | secure_note | api_key",
  "title": "string (min 1)",
  "url": "string | null (optional)",
  "username": "string | null (optional)",
  "password": "string | null (optional)",
  "content": "string | null (optional)",
  "provider": "string | null (optional)",
  "token": "string | null (optional)"
}
```

Response 201:
```json
{ "entry": { "id": "string", "category": "string", "title": "string", "createdAt": "ISO date" } }
```

**Campos sensíveis (password, content, token) são encryptados automaticamente no backend.** O frontend envia em plaintext.

---

### PUT /cofre/entries/:id

Requires cookies `token` + `cofre_token`.

Body (todos opcionais):
```json
{
  "title": "string",
  "url": "string | null",
  "username": "string | null",
  "password": "string | null",
  "content": "string | null",
  "provider": "string | null",
  "token": "string | null"
}
```

Response 200:
```json
{ "entry": { "id": "string", "title": "string", "updatedAt": "ISO date" } }
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### DELETE /cofre/entries/:id

Requires cookies `token` + `cofre_token`.

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

## Fluxo

```
1. POST /cofre/unlock { pin }
   → cookie cofre_token setado (5 min)
2. GET /cofre/entries → lista
3. GET /cofre/entries/:id → detalhe descriptografado
4. POST /cofre/entries → criar
5. PUT /cofre/entries/:id → atualizar
6. DELETE /cofre/entries/:id → remover
7. POST /cofre/lock → limpa cookie
```

## Segurança

- Criptografia: AES-256-GCM, chave derivada do PIN (SHA-256)
- Campos sensíveis NUNCA trafegam na lista — apenas no detalhe
- Token cofre: httpOnly, SameSite=Lax, Path=/cofre, 5 min
- PIN: 3 tentativas → 30s lockout

## UX

- Breakpoints: Mobile 390, Tablet 768, Desktop 1440
- **Desktop**: 3 colunas (Categorias 220px | Lista 320px | Detalhe flex)
- **Tablet**: 2 colunas (Lista 260px | Detalhe flex), sem coluna de categorias
- **Mobile**: tela cheia com Header + Search + cards full-width
- **Bloqueado**: card centralizado 320px com PIN dots + teclado
- Campo senha no detalhe: ícone eye (toggle reveal) + ícone copy
- Campo URL: ícone external-link
- Ao sair da página: POST /cofre/lock
