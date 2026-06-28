# Financeiro (Módulo Finanças)

**Design**: `design` (Pencil), módulo "Módulo Financeiro" (node `MFWjE`)
- Desktop — Transações: `DPEHZ` (Content `C3cUi`)
- Desktop — Cartão de Crédito: `cr70D` (Content `Qtkbc`)
- Mobile — Transações: `eDUt6` (Content `khZVi`)
- Mobile — Cartão: `yy2fS` (Content `ROAOK`)

**Backend**: `api/src/http/controllers/finance/` (4 sub-pastas)

**Terminologia canônica**: ver `CONTEXT.md` → termos **Finanças**, **Transação**, **Despesa do Cartão**, **Parcela**, **Lançamento no Principal**.

---

## Conceito

O **Módulo Finanças** é a área do Life OS voltada para o controle de receitas, despesas e parcelamentos pessoais. É organizado em **duas sub-telas**:

1. **Transações** — visão geral de receitas e despesas avulsas
2. **Cartão de Crédito** — visão dedicada às compras no cartão, com split de "Minha Parte" e lançamento no principal

- **Single-user** (mesmo padrão dos outros módulos)
- **Categorias seed-only** (lista fixa via migration, sem CRUD no MVP)
- **Parcelamento** suportado (1 a N parcelas) com N registros de data
- **Hard delete** em todas as entidades
- **Minha Parte**: percentual configurável por despesa do cartão (default 50%)

---

## Autenticação

Todas as rotas exigem cookie `token` (JWT de `/auth/login`). Hook global em `app.ts` protege `/finance/*`. Sem token específico do cofre.

---

## Endpoints — Categorias

### GET /finance/categories

Lista as categorias seedadas. Filtra por `type` (opcional).

Query:
```
?type=expense|income    ← filtra por tipo (opcional)
```

Response 200:
```json
{
  "categories": [
    {
      "id": "string",
      "name": "string",
      "type": "expense | income",
      "color": "string (hex)"
    }
  ]
}
```

Ordenação: por `name ASC`.

---

## Endpoints — Transações

### GET /finance/transactions

Lista transações do usuário.

Query (todos opcionais):
```
?type=expense|income
?categoryId=<uuid>
?from=YYYY-MM-DD
?to=YYYY-MM-DD
?search=<string>            ← ILIKE em description
```

Response 200:
```json
{
  "transactions": [
    {
      "id": "string",
      "type": "expense | income",
      "description": "string",
      "category": { "id": "string", "name": "string", "color": "string" } | null,
      "totalAmount": "number",
      "installmentsCount": "number",
      "currentInstallment": "number | null",
      "date": "ISO date (YYYY-MM-DD)",
      "source": "principal | credit_card",
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime"
    }
  ]
}
```

**Ordenação**: `date DESC, createdAt DESC`.

**Limite**: 500 transações por usuário. Se exceder → `400`.

**Observação**: transações com `source: 'credit_card'` são as geradas via `PATCH /finance/credit-card-expenses/:id/launch` (marcadas como "Minha parte do cartão" no design). Aparecem misturadas com as avulsas mas a UI pode usar `source` para destacar.

Response 400 (limite excedido):
```json
{ "message": "Limite de transações atingido (500)" }
```

---

### GET /finance/transactions/:id

Retorna o detalhe de uma transação + suas parcelas (se parcelada).

Response 200:
```json
{
  "transaction": {
    "id": "string",
    "type": "expense | income",
    "description": "string",
    "category": { "id": "string", "name": "string", "color": "string" } | null,
    "totalAmount": "number",
    "installmentsCount": "number",
    "source": "principal | credit_card",
    "createdAt": "ISO datetime",
    "updatedAt": "ISO datetime"
  },
  "installments": [
    {
      "id": "string",
      "installmentNumber": "number (1..N)",
      "amount": "number",
      "date": "YYYY-MM-DD"
    }
  ]
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### POST /finance/transactions

Cria uma transação (receita ou despesa avulsa). Pode ser parcelada.

Body:
```json
{
  "type": "expense | income",
  "description": "string (min 1, max 200)",
  "categoryId": "string (uuid) | null",
  "totalAmount": "number (positivo)",
  "installmentsCount": "number (1..24, default 1)",
  "firstInstallmentDate": "YYYY-MM-DD (opcional, default hoje)"
}
```

Comportamento:
- Se `installmentsCount > 1`, cria N registros em `finance_installments` com `amount = totalAmount / installmentsCount` e datas mensais a partir de `firstInstallmentDate`
- `source` é sempre `'principal'` em transações criadas via este endpoint
- `createdAt` e `updatedAt` recebem `now()`

Response 201:
```json
{
  "transaction": { /* mesmo shape do GET /:id */ },
  "installments": [ /* array com N itens */ ]
}
```

Response 400 (limite excedido):
```json
{ "message": "Limite de transações atingido (500)" }
```

Response 404 (categoryId inválido):
```json
{ "message": "Recurso não encontrado" }
```

---

### PUT /finance/transactions/:id

Atualiza `description` e `categoryId` (campos editáveis). **NÃO** atualiza `totalAmount`, `installmentsCount`, `type`, `source`, `installments` (são imutáveis após criação — para mudar valor, delete e recrie).

Body (pelo menos 1 campo):
```json
{
  "description": "string",
  "categoryId": "string | null"
}
```

Response 200:
```json
{
  "transaction": {
    "id": "string",
    "description": "string",
    "category": { "id": "string", "name": "string", "color": "string" } | null,
    "updatedAt": "ISO datetime"
  }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### DELETE /finance/transactions/:id

Deleta definitivamente. Cascade em `finance_installments` (FK).

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### GET /finance/summary

Retorna o resumo financeiro do mês (Receitas, Despesas, Saldo).

Query:
```
?month=YYYY-MM    ← default = mês corrente (UTC)
```

Response 200:
```json
{
  "period": { "month": "number (1-12)", "year": "number" },
  "income": "number",
  "expenses": "number",
  "balance": "number"
}
```

**Cálculo**:
- `income` = soma de `totalAmount` de transações com `type: 'income'` cujas **parcelas** tenham `date` dentro do mês
- `expenses` = soma análoga para `type: 'expense'`
- `balance` = `income - expenses`
- Transações parceladas contribuem **proporcionalmente** ao número de parcelas no mês (1 de 3 = totalAmount/3)

---

## Endpoints — Despesas do Cartão

### GET /finance/credit-card-expenses

Lista as despesas do cartão do usuário (mês corrente por default, mas pode ser customizado).

Query (todos opcionais):
```
?month=YYYY-MM    ← default = mês corrente (UTC)
```

Response 200:
```json
{
  "expenses": [
    {
      "id": "string",
      "description": "string",
      "category": { "id": "string", "name": "string", "color": "string" } | null,
      "totalAmount": "number",
      "myShareAmount": "number",
      "date": "YYYY-MM-DD",
      "launchedInMain": "boolean",
      "linkedTransactionId": "string | null",
      "createdAt": "ISO datetime",
      "updatedAt": "ISO datetime"
    }
  ]
}
```

**Filtro padrão**: o endpoint retorna despesas cuja **data de compra** está no mês especificado. Útil para a tela do cartão mostrar a "fatura" do mês.

**Limite**: 200 despesas por usuário (não por mês). Se exceder → `400`.

Response 400 (limite excedido):
```json
{ "message": "Limite de despesas no cartão atingido (200)" }
```

---

### GET /finance/credit-card-expenses/:id

Response 200:
```json
{
  "expense": { /* mesmo shape do GET list */ }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### POST /finance/credit-card-expenses

Cria uma despesa no cartão. `launchedInMain` é `false` por default (o user marca depois via PATCH /launch).

Body:
```json
{
  "description": "string (min 1, max 200)",
  "categoryId": "string | null",
  "totalAmount": "number (positivo)",
  "myShareAmount": "number (>= 0, <= totalAmount, default totalAmount/2)",
  "date": "YYYY-MM-DD (opcional, default hoje)"
}
```

Response 201:
```json
{
  "expense": { /* mesmo shape do GET list */ }
}
```

Response 400 (limite excedido):
```json
{ "message": "Limite de despesas no cartão atingido (200)" }
```

Response 404 (categoryId inválido):
```json
{ "message": "Recurso não encontrado" }
```

---

### PUT /finance/credit-card-expenses/:id

Atualiza `description`, `categoryId`, `totalAmount`, `myShareAmount`, `date`. **NÃO** atualiza `launchedInMain` (controlado por PATCH /launch).

Body (pelo menos 1 campo):
```json
{
  "description": "string",
  "categoryId": "string | null",
  "totalAmount": "number",
  "myShareAmount": "number",
  "date": "YYYY-MM-DD"
}
```

Response 200:
```json
{
  "expense": { /* mesmo shape do GET list */ }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### DELETE /finance/credit-card-expenses/:id

Deleta definitivamente. **NÃO** deleta a transação vinculada no principal (se houver) — o user precisa deletar a transação manualmente se quiser.

Response 204: (sem body)

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

---

### PATCH /finance/credit-card-expenses/:id/launch

Marca a despesa como "Lançada no Principal" — **cria uma Transação** na tela principal com:
- `type: 'expense'`
- `description: 'Minha parte do cartão'`
- `categoryId: <categoria da despesa do cartão>`
- `totalAmount: <myShareAmount>`
- `installmentsCount: 1`
- `date: <data da despesa do cartão>`
- `source: 'credit_card'`
- FK reversa: `linkedTransactionId` na despesa

Se já está lançada, retorna 409.

Response 200:
```json
{
  "expense": { /* com launchedInMain=true e linkedTransactionId */ },
  "transaction": { /* a transação criada */ }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

Response 409 (já lançada):
```json
{ "message": "Despesa já lançada no principal" }
```

---

### PATCH /finance/credit-card-expenses/:id/unlaunch

Desfaz o lançamento. **Deleta a transação vinculada** na tela principal e marca `launchedInMain: false`.

Se não estava lançada, retorna 409.

Response 200:
```json
{
  "expense": { /* com launchedInMain=false e linkedTransactionId=null */ }
}
```

Response 404:
```json
{ "message": "Recurso não encontrado" }
```

Response 409 (não estava lançada):
```json
{ "message": "Despesa não está lançada no principal" }
```

---

## Fluxo típico

**Criar receita/despesa avulsa**:
```
1. GET  /finance/categories?type=expense   → lista categorias
2. POST /finance/transactions { type, description, categoryId, totalAmount, installmentsCount? }
3. GET  /finance/transactions              → lista
4. PUT  /finance/transactions/:id { description? }   → ajusta texto
5. DELETE /finance/transactions/:id        → remove
```

**Criar despesa de cartão**:
```
1. POST /finance/credit-card-expenses { description, categoryId, totalAmount, myShareAmount, date }
2. PATCH /finance/credit-card-expenses/:id/launch  → gera transação no principal
3. PATCH /finance/credit-card-expenses/:id/unlaunch → desfaz (deleta a transação criada)
```

**Resumo mensal**:
```
GET /finance/summary?month=2026-06  → receitas, despesas, saldo
GET /finance/transactions?from=2026-06-01&to=2026-06-30  → drill-down
```

---

## Segurança

- Todas as rotas exigem cookie `token` (httpOnly, SameSite=Lax)
- Use-cases filtram sempre por `userId` (isolamento por usuário)
- Repository rejeita acesso a transações/despesas de outros usuários via `findById(id, userId)`
- Cross-tenant: `categoryId` deve pertencer ao user (validado no use-case → 404 se inválido)
- Sem criptografia específica (Finanças não é sensível como Cofre)

---

## UX (do design Pencil)

- Breakpoints: Mobile 390, Tablet 768, Desktop 1440
- **Desktop — Transações**: tabela com colunas Transação (300px), Valor (120px), Tipo (100px, badge), Categoria (180px, badge), Data (120px), Parcelas (100px). Botões "+ Nova Despesa" e "+ Nova Receita" no topo. "Resumo Mensal" no rodapé com 3 cards (Receitas, Despesas, Saldo Efetivo)
- **Desktop — Cartão de Crédito**: tabela com colunas Despesa (250px), Valor Total (150px), Minha Parte (180px), Categoria (150px), Data (150px), Lançado no Principal? (220px, badge). Botão "+ Nova Despesa no Cartão". Resumo no rodapé (Total Fatura, Minha Parte, Lançado no Principal)
- **Mobile**: cards em vez de tabela
- **Tabs no topo**: "Transações" / "Cartão de Crédito"
- **Confirmação antes de deletar** (usar `ConfirmModal` reutilizável já presente no design, node `EzSM0`)

---

## Modelo de dados

### Tabela `finance_categories` (seed-only)

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `name` | `text` | NOT NULL, unique por (name, type) |
| `type` | `finance_category_type` enum | `expense` \| `income` |
| `color` | `text` | NOT NULL (hex) |

Sem `user_id` — categorias são globais. Sem soft delete.

### Tabela `finance_transactions`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `user_id` | `text` FK → users.id | NOT NULL |
| `category_id` | `text` FK → finance_categories.id | NULL |
| `type` | `finance_transaction_type` enum | `expense` \| `income` |
| `description` | `text` | NOT NULL |
| `total_amount` | `numeric(20, 10)` | NOT NULL, > 0 |
| `installments_count` | `integer` | NOT NULL, default 1, 1..24 |
| `source` | `finance_transaction_source` enum | `principal` \| `credit_card`, default `principal` |
| `created_at` | `timestamp` | NOT NULL, default now() |
| `updated_at` | `timestamp` | NOT NULL, default now() |

Índices:
- `finance_transactions_user_id_idx` em `(user_id)`
- `finance_transactions_user_date_idx` em `(user_id, created_at)` (para o summary)

### Tabela `finance_installments`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `transaction_id` | `text` FK → finance_transactions.id, onDelete cascade | NOT NULL |
| `installment_number` | `integer` | NOT NULL, 1..N |
| `amount` | `numeric(20, 10)` | NOT NULL, > 0 |
| `date` | `date` | NOT NULL |

Sem `user_id` — herda via JOIN com `finance_transactions`.

Índice:
- `finance_installments_transaction_id_idx` em `(transaction_id)`
- `finance_installments_date_idx` em `(date)` (para queries de summary mensal)

### Tabela `finance_credit_card_expenses`

| Coluna | Tipo | Notas |
|---|---|---|
| `id` | `text` PK | uuid |
| `user_id` | `text` FK → users.id | NOT NULL |
| `category_id` | `text` FK → finance_categories.id | NULL |
| `description` | `text` | NOT NULL |
| `total_amount` | `numeric(20, 10)` | NOT NULL, > 0 |
| `my_share_amount` | `numeric(20, 10)` | NOT NULL, >= 0, <= total_amount |
| `date` | `date` | NOT NULL |
| `launched_in_main` | `boolean` | NOT NULL, default false |
| `linked_transaction_id` | `text` FK → finance_transactions.id, onDelete set null | NULL |
| `created_at` | `timestamp` | NOT NULL, default now() |
| `updated_at` | `timestamp` | NOT NULL, default now() |

Índices:
- `finance_credit_card_expenses_user_id_idx` em `(user_id)`
- `finance_credit_card_expenses_user_date_idx` em `(user_id, date)`

---

## Limites e regras

- **Transações**: 500 por usuário
- **Despesas no cartão**: 200 por usuário
- **Parcelas**: 1..24 por transação
- **Categorias**: seed (10 fixas), sem CRUD no MVP
- **Datas de parcelas**: geradas mensalmente a partir de `firstInstallmentDate`
- **Cross-tenant**: 404 (não 403) para FK inválida

---

## Categorias seed (migration)

**Despesas (expense)**:
- Alimentação (`#ef4444`)
- Transporte (`#f59e0b`)
- Moradia (`#3b82f6`)
- Saúde (`#10b981`)
- Lazer (`#a855f7`)
- Educação (`#06b6d4`)
- Outros (`#71717a`)

**Receitas (income)**:
- Salário (`#22c55e`)
- Freelance (`#14b8a6`)
- Investimentos (`#eab308`)

---

## O que NÃO está incluso (MVP)

- Multi-user / compartilhamento
- Contas bancárias (saldos reais)
- Cartões de crédito múltiplos (assume 1 cartão)
- Faturas com ciclo mensal (cálculo de fechamento)
- Relatórios avançados (gráficos, tendências)
- Export CSV/JSON
- Sincronização bancária
- Metas financeiras / orçamento
- Recorrência automática de despesas
- Soft delete / archive
- Histórico de edições
