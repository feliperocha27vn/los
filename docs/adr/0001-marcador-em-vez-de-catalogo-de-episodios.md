# Marcador de retomada em vez de catálogo de episódios

O módulo Mídia guarda, por Série, **uma única posição** — temporada, episódio e Minutagem de onde voltar a assistir — em vez de materializar o catálogo de episódios da obra e marcar cada um como visto. A dor original é literalmente "meu streaming não guarda onde parei", que é um bookmark; um checklist resolveria a mesma dor cobrando o preço de um catálogo.

## Considered Options

**Checklist com integração TMDB/TVMaze.** Puxaria as temporadas e episódios de cada série automaticamente, permitiria marcar episódios fora de ordem e daria estatísticas de consumo. Rejeitado: introduziria a **primeira dependência de serviço externo do Life OS** (chave de API, cache, tratamento de série sem match, indisponibilidade do provedor) num módulo que resolve um problema pessoal pequeno. Todos os outros módulos são auto-contidos e assim continuam.

**Checklist manual.** Mesmos benefícios, sem dependência externa. Rejeitado pelo custo de cadastro: 62 episódios digitados à mão só para Breaking Bad, multiplicado por dezenas de séries. O módulo morreria de tédio antes de ser útil.

## Consequences

- **Rewatch não tem histórico.** Rever uma série do começo sobrescreve o Marcador; não fica registro de que já tinha sido concluída antes.
- **Assistir fora de ordem não é representável.** O Marcador é linear por definição.
- **O backend não conhece o catálogo.** Ele não sabe quantos episódios uma temporada tem, por isso o Avanço precisa da flag `nextSeason` vinda do usuário — quem sabe que a temporada acabou é quem acabou de assisti-la.
- Evoluir para checklist depois exigiria migração de dados e uma fonte de catálogo; a volta (checklist → marcador) seria trivial.
