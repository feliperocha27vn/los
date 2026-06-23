# Auth Module

**Design**: `design` (Pencil), node `Fvjfv` — "Módulo Login"

**Backend**: `api/src/http/controllers/auth/auth-controller.ts`

---

## Endpoints

### POST /auth/login

Body:
```json
{ "email": "string (email)", "password": "string (min 8)" }
```

Response 200:
```
Set-Cookie: token=<jwt>; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800
```
```json
{ "user": { "id": "string", "name": "string", "email": "string" } }
```

Response 401:
```json
{ "message": "Credenciais inválidas" }
```

**⚠️ O token NUNCA é retornado no body.** Apenas via cookie httpOnly.

---

### GET /auth/me

Requires cookie `token`.

Response 200:
```json
{ "user": { "id": "string", "name": "string", "email": "string" } }
```

Response 401:
```json
{ "message": "Não autorizado" }
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### POST /auth/logout

Requires cookie `token`.

```
Set-Cookie: token=; Max-Age=0; Path=/
```
```json
{ "message": "Logout realizado" }
```

---

## Fluxo

```
1. POST /auth/login  { email, password }
2. Browser recebe cookie token (httpOnly)
3. GET /auth/me → valida sessão, retorna user
4. POST /auth/logout → limpa cookie
```

## Segurança

- Token JWT via cookie httpOnly, SameSite=Lax, Secure em produção
- Senha: bcrypt hash, mínimo 8 caracteres
- Expiração: 7 dias
- O frontend NUNCA acessa o token — usa GET /auth/me para verificar estado

## UX

- Breakpoints: Mobile 390, Tablet 768, Desktop 1440
- Desktop: 2 colunas (banner lateral + formulário)
- Tablet: card centralizado com sombra
- Mobile: tela cheia com formulário centralizado
- Campos: email + password + botão "Entrar"
- Link "Esqueceu a senha?" (placeholder, sem endpoint ainda)
