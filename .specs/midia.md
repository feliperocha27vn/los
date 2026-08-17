# Módulo Mídia (MVP — Marcador de séries)

**Design**: ainda não existe no Pencil. O agente de frontend **precisa criar o design antes de programar** (regra em `AGENTS.md`). Módulo novo de primeiro nível na Sidebar, irmão de Organização e Finanças.

**Backend**: `api/src/http/controllers/series/`

**Terminologia canônica**: ver `CONTEXT.md` → termos **Mídia**, **Série**, **Estado da Série**, **Marcador**, **Minutagem**, **Avanço**.

**Decisão de arquitetura**: ver `docs/adr/0001-marcador-em-vez-de-catalogo-de-episodios.md`.

---

## Conceito

Módulo que resolve uma dor específica: o streaming do usuário não guarda onde ele parou. O Life OS guarda.

Cada **Série** tem exatamente um **Marcador** — temporada, episódio e Minutagem de **onde voltar a assistir**, não do último ponto visto. Terminou o T3E7? O Marcador vira T3E8 com Minutagem 0. É o "Próximo episódio" da Netflix, não um histórico.

- **Single-user** (sem times, sem compartilhamento)
- **Sem catálogo de episódios** e sem integração externa (TMDB/TVMaze) — ver ADR
- **Sem histórico** de passagens: o Marcador é sobrescrito
- **Sem watchlist**: só entra Série que já começou
- **Filmes fora de escopo**
- **Sem ordenação manual**: a lista vem por `updatedAt` desc
- **Limite**: 200 séries por usuário

### Estado da Série

| Estado | Significado |
|--------|-------------|
| `watching` | Assistindo. **Único que deve aparecer na listagem principal.** |
| `paused` | Pausada — inclui série abandonada. Não existe estado "largada" separado. |
| `finished` | Concluída. O Marcador congela no último valor real. |

O **Avanço** (`PATCH /series/:id/advance`) força `state = 'watching'`, qualquer que fosse o estado anterior — avançar é o ato de assistir.

---

## Endpoints

Base: `http://localhost:3333`. Proxy do Vite já configurado para `/series`.
Autenticação: cookie `token` httpOnly (igual aos demais módulos). Sem cookie → `401`.

### `GET /series`

Lista as séries do usuário, **mais recentemente mexida primeiro**.

Query string opcional:

| Param | Tipo | Notas |
|-------|------|-------|
| `state` | `watching` \| `paused` \| `finished` | Valor fora do enum → `400` |

```jsonc
// 200
{
  "series": [
    {
      "id": "uuid",
      "name": "Breaking Bad",
      "state": "watching",
      "season": 3,
      "episode": 8,
      "positionSeconds": 0,
      "createdAt": "2026-08-17T12:00:00.000Z",
      "updatedAt": "2026-08-17T12:00:00.000Z"
    }
  ]
}
```

### `POST /series`

```jsonc
// body
{
  "name": "Breaking Bad",   // obrigatório, 1..150
  "season": 3,              // opcional, default 1, int 1..99
  "episode": 7,             // opcional, default 1, int 1..9999
  "positionSeconds": 1440   // opcional, default 0, int 0..86399
}
```

- `201` → `{ "series": { ... } }`, sempre com `state: "watching"`
- `400` → `{ "message": "Limite de séries atingido (200)" }` ou erro de validação

Os campos do Marcador existem no POST para o caso real de cadastrar uma série que o usuário **já está no meio** — que é o caso de uso principal na primeira vez que ele abrir o módulo.

### `GET /series/:id`

- `200` → `{ "series": { ... } }`
- `404` → inexistente **ou de outro usuário** (não vaza existência)

### `PUT /series/:id`

Todos os campos opcionais; os ausentes ficam intactos.

```jsonc
{
  "name": "Breaking Bad",
  "state": "paused",
  "season": 3,
  "episode": 8,
  "positionSeconds": 1440
}
```

- `200` → `{ "series": { ... } }`
- `404` → inexistente ou de outro usuário

Use este endpoint para: renomear, mudar o Estado, e para "parei no meio do episódio" (mandando só `positionSeconds`).

### `PATCH /series/:id/advance`

A ação de uso diário: **"terminei mais um episódio"**.

```jsonc
// body OPCIONAL — pode mandar PATCH sem corpo nenhum
{ "nextSeason": true }   // quando o episódio terminado era o último da temporada
```

| Body | Efeito |
|------|--------|
| vazio / ausente / `{}` | `episode + 1`, `positionSeconds = 0` |
| `{ "nextSeason": true }` | `season + 1`, `episode = 1`, `positionSeconds = 0` |

Em ambos os casos `state` vira `watching`.

- `200` → `{ "series": { ... } }`
- `404` → inexistente ou de outro usuário

O backend **não sabe** quantos episódios uma temporada tem — quem sabe que a temporada acabou é o usuário, por isso a flag `nextSeason`.

### `DELETE /series/:id`

- `204` sem corpo
- `404` → inexistente ou de outro usuário

---

## O que o frontend precisa fazer

1. **Criar o design no Pencil** — módulo Mídia (Desktop/Tablet/Mobile), antes de qualquer código.
2. Adicionar a entrada **Mídia** na Sidebar.
3. Rodar o Kubb para gerar os hooks (`useGetSeries`, `usePostSeries`, `usePatchSeriesIdAdvance`, …) a partir do `swagger.json` regenerado.
4. Tela principal: lista de `GET /series?state=watching`, cada linha mostrando `Nome — T{season}E{episode}` e a Minutagem quando `positionSeconds > 0`.
5. **Botão de um clique por linha** disparando `PATCH /series/:id/advance` — é a ação mais frequente do módulo e não deve exigir formulário. Um segundo controle (menu/long-press) para "terminei a temporada" → `{ nextSeason: true }`.
6. Formulário só para: cadastrar série, parar no meio (`positionSeconds`), corrigir o Marcador e mudar o Estado.
7. Filtro para ver Pausadas e Concluídas — fora da listagem principal.

### Formato da Minutagem

`positionSeconds` é **inteiro em segundos**. O frontend exibe e recebe como `mm:ss` (ou `h:mm:ss` acima de 60min) e converte. Máximo aceito: `86399` (23:59:59).
